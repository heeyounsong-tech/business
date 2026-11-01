import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
for(const width of [320,390,768,1440]){
 test(`landing is usable at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.locator('h1')).toContainText('얼마나');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#faq details').first().locator('summary').click();await expect(page.locator('#faq details').first()).toHaveAttribute('open','');
  await expect(page.locator('#faq details').first()).toContainText('실제 속도');
  if(width===1440){await page.screenshot({path:'artifacts/desktop-landing.png',fullPage:true});expect(await page.locator('.hero-poster').boundingBox().then(x=>x.x)).toBeGreaterThan(600);}
  if(width===390){await page.screenshot({path:'artifacts/mobile-landing.png',fullPage:true});await page.locator('.mobile-cta [data-action="demo"]').click();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('.mobile-cta')).toBeHidden();}
 });
}
test('downloadable HTML runs offline with a full simulated round',async({page,context})=>{
 await page.clock.install();await context.setOffline(true);
 await page.setContent(await readFile(path.resolve('artifacts/punch-lab-try.html'),'utf8'));
 await page.click('#demo');await page.click('#start');await page.clock.runFor(3100);await page.click('#demo-hit');await page.clock.runFor(10000);await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#total')).toHaveText('1');
});
test('camera troubleshooting reports browser support without collecting video',async({page})=>{await page.goto('/');await page.locator('#device-check summary').click();await expect(page.locator('#device-info')).toContainText('보안 연결: 사용 가능');await expect(page.locator('#device-info')).toContainText('카메라 API: 지원');await expect(page.locator('#device-info')).toContainText('AI: 준비되지 않음');});
