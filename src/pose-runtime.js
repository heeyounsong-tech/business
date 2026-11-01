// Official MediaPipe Pose Solutions fallback. Its npm distribution includes the
// detector, lite landmark model and WASM; no external model server is required.
let scriptPromise;
export async function createPoseRuntime(standalone=false) {
 const base=standalone
  ? 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/'
  : `${import.meta.env.BASE_URL}pose-runtime/`;
 if(!window.Pose){
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=base+'pose.js';
   script.onload=resolve;script.onerror=()=>{script.remove();scriptPromise=null;reject(new Error('MediaPipe runtime unavailable'));};
   document.head.append(script);
  });
  await scriptPromise;
 }
 if(!window.Pose)throw new Error('MediaPipe Pose not available');
 const pose=new window.Pose({locateFile:file=>base+file});
 pose.setOptions({modelComplexity:0,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.6,minTrackingConfidence:.6});
 let result={landmarks:[]};
 pose.onResults(value=>{result={landmarks:value.poseLandmarks?[value.poseLandmarks]:[]};});
 try{await pose.initialize();}catch(error){await pose.close().catch(()=>{});throw error;}
 return {async detectForVideo(video){result={landmarks:[]};await pose.send({image:video});return result;},close:()=>pose.close()};
}
