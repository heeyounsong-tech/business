// Offline landing and simulated game; camera mode loads official remote AI assets.
// Camera availability depends on the browser secure context and permission policy.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
let html=await readFile('dist/index.html','utf8');
const script=html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const css=html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if(!script||!css)throw new Error('Unexpected Vite output');
const js=(await readFile(join('dist','assets',basename(script[1])),'utf8')).replace(/<\/script/gi,'<\\/script');
const style=await readFile(join('dist','assets',basename(css[1])),'utf8');
html=html.replace(script[0],`<script>window.PUNCH_STANDALONE=true;</script><script type="module">${js}</script>`).replace(css[0],`<style>${style}</style>`);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/punch-lab-try.html',html);
console.log('Standalone landing + demo: artifacts/punch-lab-try.html');
