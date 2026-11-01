import test from "node:test";
import assert from "node:assert/strict";
import {
  PunchDetector,
  scorePunch,
  elapsedPhase,
  validPose,
  challengeFrom,
} from "../src/engine.js";
function pose(stage, side = 0) {
  const points = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 1,
  }));
  const frames = {
    guard: [
      [0.4, 0.4],
      [0.4, 0.55],
      [0.45, 0.43],
    ],
    moving: [
      [0.4, 0.4],
      [0.51, 0.54],
      [0.58, 0.47],
    ],
    extended: [
      [0.4, 0.4],
      [0.56, 0.4],
      [0.72, 0.4],
    ],
  };
  for (const [n, i] of [11, 13, 15].entries()) {
    const [x, y] = frames[stage][n];
    points[i + side] = { x, y, visibility: 1 };
  }
  return points;
}
test("guard → extension → return is required, extended arm never counts twice", () => {
  const d = new PunchDetector();
  assert.equal(d.update(pose("guard"), 0).length, 0);
  assert.equal(d.update(pose("moving"), 100).length, 0);
  const hit = d.update(pose("extended"), 200);
  assert.equal(hit.length, 1);
  assert.equal(hit[0].side, "left");
  for (let t = 250; t < 600; t += 50)
    assert.equal(d.update(pose("extended"), t).length, 0);
  d.update(pose("guard"), 600);
  d.update(pose("moving"), 700);
  assert.equal(d.update(pose("extended"), 800).length, 1);
});
test("right hand detection", () => {
  const d = new PunchDetector();
  d.update(pose("guard", 1), 0);
  d.update(pose("moving", 1), 100);
  assert.equal(d.update(pose("extended", 1), 200)[0].side, "right");
});
test("tracking loss and frame gaps invalidate the punch", () => {
  for (const gap of [false, true]) {
    const d = new PunchDetector();
    d.update(pose("guard"), 0);
    d.update(pose("moving"), 100);
    if (!gap) d.update(null, 130);
    assert.equal(d.update(pose("extended"), gap ? 500 : 200).length, 0);
  }
});
test("low confidence, stationary poses, and straight-arm starts cannot count", () => {
  const d = new PunchDetector();
  for (let t = 0; t < 1000; t += 100)
    assert.equal(d.update(pose("extended"), t).length, 0);
  d.reset();
  for (let t = 0; t < 1000; t += 100)
    assert.equal(d.update(pose("guard"), t).length, 0);
  const p = pose("extended");
  p[15].visibility = 0.2;
  assert.equal(validPose(p), false);
  assert.equal(d.update(p, 1100).length, 0);
});
test("score bounds and confidence penalty", () => {
  assert.equal(scorePunch(100, 1, 1), 100);
  assert.ok(scorePunch(1, 200, 0.7) < scorePunch(1, 200, 1));
  assert.ok(scorePunch(1, 400, 1) < scorePunch(1, 200, 1));
  assert.equal(scorePunch(0, 1000, 1), 0);
});
test("countdown and deadline use elapsed time, including delayed frames", () => {
  assert.deepEqual(elapsedPhase(100, 100), {
    countdown: 3,
    remaining: 13,
    done: false,
  });
  assert.equal(elapsedPhase(100, 3100).countdown, 0);
  assert.equal(elapsedPhase(100, 3100).remaining, 10);
  assert.equal(elapsedPhase(100, 13100).done, true);
  assert.equal(elapsedPhase(100, 20000).remaining, 0);
});
test("challenge inputs cannot inject text or exceed index bounds", () => {
  assert.equal(challengeFrom("?target=85"), 85);
  assert.equal(challengeFrom("?target=0"), 0);
  for (const s of [
    "",
    "?target=NaN",
    "?target=101",
    "?target=-1",
    "?target=<script>",
  ])
    assert.equal(challengeFrom(s), null);
});
