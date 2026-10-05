"""Record actual Simulator gameplay, preserving native MOVs and real-time playback.

Requires a running XCTest controller (Capture.swift), and ffmpeg on PATH or
--ffmpeg. No application state, game logic, scores, or device records are changed
by this tool except through normal UI interactions.

Example:
  python3 scripts/tiktok/capture.py --device UUID --plan /path/to/recording-plan.json --ffmpeg PATH
  python3 scripts/tiktok/capture.py --device UUID --plan /path/to/recording-plan.json --only game-006-play

Plan: {"shots": [{"name": "game-006-play", "seconds": 12,
"setup": [{"op": "element", "key": "..."}],
"actions": [{"at": 1.2, "op": "tap", "at_point": [0.5, 0.6]}]}]}.
Coordinates are normalized to the actual app window. Action times are minimum
start offsets; gestures never overlap. For tap use at_point (at is timing).
"""
import argparse
import json
from pathlib import Path
import signal
import subprocess
import threading
import time
import tempfile
import uuid


def control(root, command):
    command = dict(command)
    if command["op"] == "wait":
        time.sleep(command["seconds"])
        return
    command["id"] = str(uuid.uuid4())
    pending = root / "next.json"
    pending.write_text(json.dumps(command, ensure_ascii=False))
    pending.replace(root / "command.json")
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        done = root / "done"
        if done.exists() and done.read_text() == command["id"]:
            if (root / "error").exists():
                raise RuntimeError((root / "error").read_text())
            return
        time.sleep(0.05)
    raise RuntimeError("XCTest controller timed out: " + command["op"])


def record(args, shot):
    output = Path(args.output)
    native = output / "native" / (shot["name"] + ".mov")
    target = output / (shot["name"] + ".mp4")
    if native.exists() or target.exists():
        raise FileExistsError("Move previous takes before recording " + shot["name"])
    native.parent.mkdir(parents=True, exist_ok=True)
    root = Path(args.controller)
    for command in shot.get("setup", []):
        control(root, command)
    time.sleep(1)
    ready = threading.Event()
    log = []
    process = subprocess.Popen(
        ["xcrun", "simctl", "io", args.device, "recordVideo", "--codec=h264",
         "--mask=black", str(native.resolve())], stderr=subprocess.PIPE,
        stdout=subprocess.DEVNULL, text=True,
    )

    def read_log():
        for line in process.stderr:
            log.append(line)
            if "Recording started" in line:
                ready.set()

    reader = threading.Thread(target=read_log, daemon=True)
    reader.start()
    success = False
    try:
        if not ready.wait(15):
            raise RuntimeError("Recording did not start: " + "".join(log))
        start = time.monotonic()
        events = []
        for action in shot.get("actions", []):
            action = dict(action)
            offset = action.pop("at", 1.2)
            time.sleep(max(0, start + offset - time.monotonic()))
            if "at_point" in action:
                action["at"] = action.pop("at_point")
            event_start = time.monotonic() - start
            control(root, action)
            events.append({"start": event_start, "end": time.monotonic() - start,
                           "command": action})
        # Always leave a real one-second tail, even if automation ran slowly.
        end = max(start + shot["seconds"], time.monotonic() + 1.2)
        time.sleep(max(0, end - time.monotonic()))
        elapsed = time.monotonic() - start
        success = True
    finally:
        if process.poll() is None:
            process.send_signal(signal.SIGINT)
        process.wait(timeout=30)
        reader.join(timeout=5)
    if not success or process.returncode:
        raise RuntimeError("Recording failed: " + "".join(log))
    metadata = {"shot": shot, "wall_seconds": elapsed, "events": events,
                "native": str(native), "audio": False, "recording_log": log}
    (output / (shot["name"] + ".capture.json")).write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n")
    # Preserve pixels: add black padding only. No crop, zoom, overlay, or speed
    # changes. fps duplicates static frames; it does not interpolate motion.
    intermediate = None
    encode_target = target
    if shot.get("export_start", 0):
        temporary = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        intermediate = Path(temporary.name)
        temporary.close()
        intermediate.unlink()
        encode_target = intermediate
    subprocess.run([
        args.ffmpeg, "-hide_banner", "-loglevel", "warning", "-n",
        "-i", str(native), "-vf",
        "pad=1584:2816:(ow-iw)/2:(oh-ih)/2:black,tpad=stop_mode=clone:stop_duration=30,fps=60",
        "-t", str(round(elapsed * 60) / 60),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(encode_target),
    ], check=True)
    if intermediate is not None:
        try:
            subprocess.run([
                args.ffmpeg, "-hide_banner", "-loglevel", "warning", "-n",
                "-i", str(intermediate), "-vf",
                f"trim=start={shot['export_start']},setpts=PTS-STARTPTS,fps=60",
                "-r", "60", "-t", str(shot["export_seconds"]), "-c:v", "libx264",
                "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", "-an", str(target),
            ], check=True)
        finally:
            intermediate.unlink(missing_ok=True)
    print(json.dumps({"file": str(target), "wall_seconds": elapsed,
                      "actions": events}, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--device", required=True)
    parser.add_argument("--plan", required=True)
    parser.add_argument("--output", default="docs/tiktok/day001/gameplay")
    parser.add_argument("--controller", default="/tmp/asobit-tiktok-controller")
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--only", nargs="*")
    args = parser.parse_args()
    for shot in json.loads(Path(args.plan).read_text())["shots"]:
        if args.only is None or shot["name"] in args.only:
            record(args, shot)


if __name__ == "__main__":
    main()
