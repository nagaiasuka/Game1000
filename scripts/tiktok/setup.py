"""Prepare the external XCTest controller, without modifying the app.

Run: python3 scripts/tiktok/setup.py --device SIMULATOR_UUID
Then run the printed xcodebuild command in a separate terminal.
Requires Xcode, an already-installed ASOBIT Release app and a booted Simulator.
"""
import argparse
import json
from pathlib import Path
import shlex
import shutil
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--device", required=True)
args = parser.parse_args()
source = Path(__file__).resolve().parent
root = Path("/tmp/asobit-tiktok-controller")
root.mkdir(exist_ok=True)
shutil.copy2(source / "Capture.swift", root / "Capture.swift")
shutil.copytree(source / "Capture.xcodeproj", root / "Capture.xcodeproj",
                dirs_exist_ok=True)
(root / "command.json").write_text(json.dumps({"op": "noop", "id": str(uuid.uuid4())}))
print(shlex.join(["xcodebuild", "test", "-project", str(root / "Capture.xcodeproj"),
                  "-scheme", "Capture", "-destination", "platform=iOS Simulator,id=" + args.device,
                  "-derivedDataPath", str(root / "build")]))
