import { test, expect } from "@playwright/test";
test("mobile demo countdown, 10 second deadline, result, replay and no real record", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?target=80");
  await expect(page.locator("#challenge")).toContainText("80");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/mobile-home.png", fullPage: true });
  await page.click("#demo");
  await page.click("#start");
  await expect(page.locator("#countdown")).toHaveText("3");
  await page.clock.runFor(3100);
  await expect(page.locator("#demo-hit")).toBeVisible();
  await page.click("#demo-hit");
  await page.clock.runFor(220);
  await page.click("#demo-hit");
  await expect(page.locator("#count")).toHaveText("2");
  await page.clock.runFor(9800);
  await expect(page.locator("#result")).toBeVisible();
  await expect(page.locator("#total")).toHaveText("2");
  await expect(page.locator("#share")).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("punch-lab-best")),
  ).toBeNull();
  await page.screenshot({
    path: "artifacts/mobile-result.png",
    fullPage: true,
  });
  await page.click("#again");
  await expect(page.locator("#start")).toBeEnabled();
  await page.click("#start");
  await page.clock.runFor(13100);
  await expect(page.locator("#rank")).toHaveText("측정 불가");
});
test("permission denial is actionable; camera retry and cancellation work", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: async () => {
          throw new DOMException("denied", "NotAllowedError");
        },
      },
    }),
  );
  await page.goto("/");
  await page.click("#begin");
  await expect(page.locator("#status")).toContainText("사이트 설정");
  await expect(page.locator("#retry-camera")).toBeVisible();
  await page.click("#retry-camera");
  await expect(page.locator("#status")).toContainText("사이트 설정");
  await page.click("#cancel");
  await expect(page.locator("#home")).toBeVisible();
});
test("camera without hardware has a useful message", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: async () => {
          throw new DOMException("none", "NotFoundError");
        },
      },
    }),
  );
  await page.goto("/");
  await page.click("#begin");
  await expect(page.locator("#status")).toContainText(
    "사용 가능한 카메라가 없습니다",
  );
});
test("pending permission cancelled by navigation releases late tracks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.stopped = false;
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: () =>
          new Promise((resolve) => {
            window.grant = () =>
              resolve({
                getTracks: () => [{ stop: () => (window.stopped = true) }],
              });
          }),
      },
    });
  });
  await page.goto("/");
  await page.click("#begin");
  await page.click("#cancel");
  await page.evaluate(() => window.grant());
  await expect.poll(() => page.evaluate(() => window.stopped)).toBe(true);
  await expect(page.locator("#home")).toBeVisible();
});
test("background interrupts a demo round without saving a result", async ({
  page,
}) => {
  await page.goto("/");
  await page.click("#demo");
  await page.click("#start");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#status")).toContainText("취소");
  await expect(page.locator("#start")).toBeEnabled();
});
test("real-mode workflow with simulated camera/pose saves record and copies challenge", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    window.syntheticCanvas = canvas;
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => canvas.captureStream(24) },
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copied = text;
        },
      },
    });
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
  });
  await page.route("**/*mediapipe_tasks-vision*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export class FilesetResolver{static async forVisionTasks(){return {};}} export class PoseLandmarker{static async createFromOptions(){return {detectForVideo(video,now){const points=Array.from({length:33},()=>({x:.5,y:.5,visibility:1}));const active=window.syntheticPunch||'guard';for(let side=0;side<2;side++){let s=[.4,.4],e=[.4,.55],w=[.45,.43];if(side===0&&active==='moving'){e=[.51,.54];w=[.58,.47];}if(side===0&&active==='extended'){e=[.56,.4];w=[.72,.4];}for(const [i,p] of [[11,s],[13,e],[15,w]])points[i+side]={x:p[0],y:p[1],visibility:1};}return {landmarks:[points]};}};}}`,
    }),
  );
  await page.goto("/");
  await page.click("#begin");
  // Painted canvas frames drive the actual video element; the AI output is explicitly mocked.
  async function frames(ms) {
    for (let t = 0; t < ms; t += 100) {
      await page.evaluate(() => {
        const ctx = window.syntheticCanvas.getContext("2d");
        ctx.fillStyle = String(Math.random());
        ctx.fillRect(0, 0, 640, 480);
        window.syntheticCanvas.captureStream;
      });
      await page.clock.runFor(100);
      await page.waitForTimeout(20);
    }
  }
  await frames(1800);
  await expect(page.locator("#start")).toBeEnabled();
  await page.click("#start");
  await frames(3200);
  await page.evaluate(() => (window.syntheticPunch = "moving"));
  await frames(100);
  await page.evaluate(() => (window.syntheticPunch = "extended"));
  await frames(150);
  await expect(page.locator("#count")).toHaveText("1");
  await frames(10000);
  await expect(page.locator("#result")).toBeVisible();
  expect(
    Number(await page.evaluate(() => localStorage.getItem("punch-lab-best"))),
  ).toBeGreaterThan(0);
  await page.click("#share");
  await expect(page.locator("#share-status")).toContainText("복사");
  expect(await page.evaluate(() => window.copied)).toContain("target=");
});
