import {stat} from 'node:fs/promises';
const files=['pose.js','pose_landmark_lite.tflite','pose_solution_packed_assets_loader.js','pose_solution_packed_assets.data','pose_solution_simd_wasm_bin.js','pose_solution_simd_wasm_bin.wasm','pose_solution_wasm_bin.js','pose_solution_wasm_bin.wasm','pose_web.binarypb'];
for(const file of files){
 const path=`public/pose-runtime/${file}`;
 try{if(!(await stat(path)).isFile()||(await stat(path)).size===0)throw new Error('empty');}
 catch{console.error(`실제 측정 배포 중단: ${path} 파일이 없습니다. npm run setup:assets를 먼저 실행하세요.`);process.exit(1);}
}
console.log('공식 MediaPipe Lite 런타임·내장 모델 배포 파일 확인 완료');
