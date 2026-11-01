import test from "node:test";
import assert from "node:assert/strict";
import { Camera, cameraMessage } from "../src/camera.js";
const video = { play: async () => {}, srcObject: null };
const track = () => ({
  stopped: false,
  stop() {
    this.stopped = true;
  },
});
function setup(getUserMedia) {
  globalThis.window = { isSecureContext: true };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { mediaDevices: { getUserMedia } },
  });
}
test("stale permission response releases every track", async () => {
  let resolve;
  const t = track();
  setup(() => new Promise((r) => (resolve = r)));
  const c = new Camera();
  const pending = c.open(video);
  c.stop();
  resolve({ getTracks: () => [t] });
  assert.equal(await pending, false);
  assert.equal(t.stopped, true);
  assert.equal(c.stream, null);
});
test("unsupported constraints retry once with generic video", async () => {
  const t = track();
  let attempts = 0;
  setup(async (constraints) => {
    attempts++;
    if (attempts === 1) throw { name: "OverconstrainedError" };
    assert.equal(constraints.video, true);
    return { getTracks: () => [t] };
  });
  const c = new Camera();
  assert.equal(await c.open(video), true);
  assert.equal(attempts, 2);
  c.stop();
  assert.equal(t.stopped, true);
});
test("permission denial does not retry and gives actionable guidance", async () => {
  let attempts = 0;
  setup(async () => {
    attempts++;
    throw { name: "NotAllowedError" };
  });
  await assert.rejects(new Camera().open(video), /사이트 설정/);
  assert.equal(attempts, 1);
});
test("play rejection releases camera", async () => {
  const t = track();
  setup(async () => ({ getTracks: () => [t] }));
  await assert.rejects(
    new Camera().open({
      play: async () => {
        throw { name: "NotReadableError" };
      },
    }),
    /다른 앱/,
  );
  assert.ok(t.stopped);
});
test("insecure and unsupported contexts provide direct guidance", async () => {
  setup(() => {});
  window.isSecureContext = false;
  await assert.rejects(new Camera().open(video), /HTTPS/);
  window.isSecureContext = true;
  navigator.mediaDevices = null;
  await assert.rejects(new Camera().open(video), /지원하지/);
  assert.match(cameraMessage({ name: "NotFoundError" }), /카메라 연결/);
});
test("overlapping opens serialize permission requests and release stale stream", async () => {
  const resolves = [];
  let calls = 0;
  setup(() => {
    calls++;
    return new Promise((resolve) => resolves.push(resolve));
  });
  const c = new Camera();
  const first = c.open(video);
  const second = c.open(video);
  assert.equal(calls, 1);
  const stale = track();
  resolves[0]({ getTracks: () => [stale] });
  assert.equal(await first, false);
  await Promise.resolve();
  assert.equal(calls, 2);
  const active = track();
  resolves[1]({ getTracks: () => [active] });
  assert.equal(await second, true);
  assert.ok(stale.stopped);
  assert.equal(active.stopped, false);
  c.stop();
});
test('embedded preview policy denial has specific browser guidance',async()=>{setup(()=>{throw new Error('should not request hardware');});globalThis.document={permissionsPolicy:{allowsFeature:()=>false}};try{await assert.rejects(new Camera().open(video),/미리보기/);}finally{delete globalThis.document;}});
