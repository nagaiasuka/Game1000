"""Send one normal UI command to the running TikTok XCTest controller."""
import json
from pathlib import Path
import sys
from capture import control

control(Path("/tmp/asobit-tiktok-controller"), json.loads(sys.argv[1]))
print("Done")
