import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
test.use({launchOptions:{executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--enable-unsafe-swiftshader']}});
test('browser camera stream stays live after model failure, retries AI without reopening camera, and stops on exit',async({page})=>{
 await page.route('**/*mediapipe_tasks-vision*',route=>route.fulfill({contentType:'text/javascript',body:`export class FilesetResolver {static async forVisionTasks(){throw new Error('model offline');}} export class PoseLandmarker {}`}));
 await page.route('**/pose-runtime/**',route=>route.abort());
 await page.goto('/');await page.click('#begin');await expect(page.locator('#camera-state')).toContainText('AI 인식 준비 실패');
 await expect(page.locator('#status')).toContainText('카메라 영상은 정상');
 await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
 await expect(page.locator('#start')).toBeDisabled();
 const before=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(250);expect(await page.locator('video').evaluate(v=>v.currentTime)).toBeGreaterThan(before);
 await page.evaluate(()=>window.previewTrack=document.querySelector('video').srcObject.getVideoTracks()[0]);const id=await page.evaluate(()=>window.previewTrack.id);
 await page.click('#retry-model');await expect(page.locator('#retry-model')).toBeVisible();expect(await page.locator('video').evaluate(v=>v.srcObject.getVideoTracks()[0].id)).toBe(id);
 await page.screenshot({path:'artifacts/camera-preview-model-error.png',fullPage:true});await page.click('#cancel');expect(await page.evaluate(()=>window.previewTrack.readyState)).toBe('ended');
});
test('standalone HTML now requests browser camera and preserves preview if remote AI assets are unavailable',async({page})=>{
 const html=await readFile('artifacts/punch-lab-try.html','utf8');
 await page.route('**/camera-test',route=>route.fulfill({contentType:'text/html',body:html}));
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto('/camera-test');await page.click('#begin');await expect(page.locator('#camera-state')).toContainText('카메라 연결 정상');await expect(page.locator('#status')).toContainText('AI 모델 파일');await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);await page.click('#cancel');
});

test('official bundled Lite model initializes and runs inference on browser camera frames',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/');await page.click('#begin');
 await expect(page.locator('#camera-state')).toContainText('AI 모델 준비 완료',{timeout:45000});
 await expect(page.locator('#status')).toContainText('양쪽 어깨',{timeout:15000});
 await expect.poll(()=>page.locator('video').evaluate(v=>v.currentTime)).toBeGreaterThan(0);
 await page.screenshot({path:'artifacts/real-model-camera-smoke.png',fullPage:true});
 await page.click('#cancel');await expect(page.locator('#home')).toBeVisible();
});
