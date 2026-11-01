export const CONFIG = Object.freeze({
  confidence: 0.65,
  guard: 1.8,
  travel: 0.65,
  movementStart: 0.15,
  straightCosine: -0.78,
  minScale: 0.035,
  resetReach: 1.25,
  scoreVelocity: 8,
  minDuration: 70,
  maxDuration: 850,
  cooldown: 180,
  gap: 220,
  calibration: 1200,
  countdown: 3000,
  duration: 10000,
});
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function scorePunch(travel, duration, confidence) {
  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (0.7 * Math.min(travel / (duration / 1000) / CONFIG.scoreVelocity, 1) +
          0.3 * Math.max(0, 1 - duration / CONFIG.maxDuration)) *
          100 *
          confidence,
      ),
    ),
  );
}
export class PunchDetector {
  constructor() {
    this.reset();
  }
  reset() {
    this.arms = [{}, {}];
    this.lastTime = null;
  }
  update(points, time) {
    if (this.lastTime !== null && time - this.lastTime > CONFIG.gap)
      this.arms = [{}, {}];
    this.lastTime = time;
    const events = [];
    for (let side = 0; side < 2; side++) {
      const [s, e, w] = [
        points?.[11 + side],
        points?.[13 + side],
        points?.[15 + side],
      ];
      const arm = this.arms[side];
      if (
        ![s, e, w].every(
          (p) =>
            p &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            (p.visibility ?? 0) >= CONFIG.confidence,
        )
      ) {
        this.arms[side] = {};
        continue;
      }
      const upper = distance(s, e),
        fore = distance(e, w),
        scale = (upper + fore) / 2;
      if (scale < CONFIG.minScale) {
        this.arms[side] = {};
        continue;
      }
      const reach = distance(s, w) / scale;
      const cosine =
        ((s.x - e.x) * (w.x - e.x) + (s.y - e.y) * (w.y - e.y)) /
        (upper * fore || 1);
      // A straight arm cannot exceed reach 2. Use angle + shoulder-relative travel.
      const straight = cosine < CONFIG.straightCosine;
      const rel = { x: (w.x - s.x) / scale, y: (w.y - s.y) / scale };
      if (!arm.state) {
        if (reach < CONFIG.guard)
          this.arms[side] = {
            state: "guard",
            rel,
            time,
            confidence: Math.min(s.visibility, e.visibility, w.visibility),
          };
        continue;
      }
      if (arm.state === "return") {
        if (reach < CONFIG.guard && time - arm.time > CONFIG.cooldown)
          this.arms[side] = { state: "guard", rel, time, confidence: 1 };
        continue;
      }
      const movement = distance(rel, arm.rel);
      if (arm.state === "guard" && movement > CONFIG.movementStart) {
        arm.state = "extend";
        arm.start = time;
      }
      if (arm.state === "extend") {
        arm.confidence = Math.min(
          arm.confidence,
          s.visibility,
          e.visibility,
          w.visibility,
        );
        const duration = time - arm.start;
        if (
          straight &&
          movement >= CONFIG.travel &&
          duration >= CONFIG.minDuration &&
          duration <= CONFIG.maxDuration
        ) {
          events.push({
            side: side ? "right" : "left",
            score: scorePunch(movement, duration, arm.confidence),
          });
          this.arms[side] = { state: "return", time };
        } else if (
          duration > CONFIG.maxDuration ||
          (duration > CONFIG.minDuration && reach < CONFIG.resetReach)
        )
          this.arms[side] = {};
      }
    }
    return events;
  }
}
export function validPose(p) {
  return [11, 12, 13, 14, 15, 16].every(
    (i) =>
      p?.[i]?.visibility >= CONFIG.confidence &&
      p[i].x >= 0 &&
      p[i].x <= 1 &&
      p[i].y >= 0 &&
      p[i].y <= 1,
  );
}
export function challengeFrom(search) {
  const raw = new URLSearchParams(search).get("target");
  return raw !== null && /^\d{1,3}$/.test(raw) && +raw <= 100 ? +raw : null;
}
export function elapsedPhase(start, now) {
  const elapsed = Math.max(0, now - start);
  return {
    countdown: Math.max(0, Math.ceil((CONFIG.countdown - elapsed) / 1000)),
    remaining: Math.max(
      0,
      (CONFIG.countdown + CONFIG.duration - elapsed) / 1000,
    ),
    done: elapsed >= CONFIG.countdown + CONFIG.duration,
  };
}
