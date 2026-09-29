import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptsDeveloperPassword,
  DEVELOPER_HOLD_MS,
} from "../src/developer/access.ts";

test("developer access requires the configured password exactly", () => {
  assert.equal(DEVELOPER_HOLD_MS, 5000);
  assert.equal(acceptsDeveloperPassword("pass"), true);
  for (const value of ["", "PASS", "wrong", "pass "])
    assert.equal(acceptsDeveloperPassword(value), false);
});
