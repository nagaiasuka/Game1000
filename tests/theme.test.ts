import test from "node:test";
import assert from "node:assert/strict";
import {
  MAIN_COLORS,
  readMainColor,
  tintStyles,
  THEME_KEY,
} from "../src/theme/preferences.ts";
test("theme storage accepts supported selections and recovers from corrupt or old values", () => {
  assert.equal(THEME_KEY, "@game1000/settings/theme/v1");
  for (const option of MAIN_COLORS)
    assert.equal(
      readMainColor(JSON.stringify({ mainColor: option.id })),
      option.id,
    );
  for (const raw of [
    null,
    "",
    "null",
    "invalid",
    "{}",
    '{"mainColor":"unknown"}',
    '{"mainColor":3}',
  ])
    assert.equal(readMainColor(raw), "cyan");
});
test("theming preserves shared styles and secondary colors, including alpha suffixes", () => {
  const base = Object.freeze({
    title: Object.freeze({ color: "#00F5FF", textShadowColor: "#00F5FF66" }),
    secondary: Object.freeze({ color: "#FF2BD6" }),
    transform: Object.freeze([{ scale: 0.98 }]),
    padding: 12,
  });
  const changed = tintStyles(base, "#FFD078");
  assert.equal(changed.title.color, "#FFD078");
  assert.equal(changed.title.textShadowColor, "#FFD07866");
  assert.equal(base.title.color, "#00F5FF");
  assert.equal(changed.secondary.color, "#FF2BD6");
  assert.deepEqual(changed.transform, [{ scale: 0.98 }]);
  assert.equal(changed.padding, 12);
  assert.equal(
    tintStyles("#00F5FF is a label", "#FFD078"),
    "#00F5FF is a label",
  );
});
test("all main colors are readable on the dark UI and behind dark button labels", () => {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const option of MAIN_COLORS)
    for (const dark of ["#070711", "#11111F", "#19192B"])
      assert.ok(
        (luminance(option.color) + 0.05) / (luminance(dark) + 0.05) >= 4.5,
        option.id,
      );
});
