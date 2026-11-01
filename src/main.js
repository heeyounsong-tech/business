import "./style.css";
import "./landing.css";
import { landing } from "./landing.js";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Camera } from "./camera.js";
import { createPoseRuntime } from "./pose-runtime.js";
import {
  CONFIG,
  PunchDetector,
  validPose,
  challengeFrom,
  elapsedPhase,
} from "./engine.js";
const $ = (s) => document.querySelector(s),
  camera = new Camera(),
  detector = new PunchDetector();
let lastFrameAt = 0;
let modelPromise;
let model,
  frame = 0,
  phase = "home",
  demo = false,
  facing = "user",
  readySince = 0,
  ready = false,
  gameStart = 0,
  lastInference = 0,
  inferenceInterval = 70,
  lastVideo = -1,
  run = 0,
  stats,
  streak = 0,
  lastPunch = 0,
  best = 0,
  storage = true;
try {
  const value = Number(localStorage.getItem("punch-lab-best"));
  best = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
} catch {
  storage = false;
}
const target = challengeFrom(location.search);
$("#app").innerHTML =
  `<header><a href="./" aria-label="PUNCH LAB 홈">PUNCH<span> LAB</span><small>CAMERA ARCADE / VOL. 01</small></a><nav aria-label="주요 메뉴"><a href="#how-it-works">이용 방법</a><a href="#faq">자주 묻는 질문</a></nav><b>● ON DEVICE</b></header>
<main>${landing}
<section id="arena" hidden><div class="eyebrow" id="mode-label">CAMERA CHECK</div><h2 id="arena-title">너의 링을 준비해.</h2><div class="view"><video autoplay muted playsinline></video><canvas id="overlay"></canvas><div class="body-guide" aria-hidden="true"></div><span class="live">● LOCAL CAMERA</span><div id="countdown" aria-live="assertive"></div><div id="hit" aria-live="polite"></div></div><p id="camera-state" role="status" hidden></p><p id="status" role="status" aria-live="polite">카메라를 연결하는 중…</p><div id="setup"><div class="options"><label>촬영 각도<select id="angle"><option value="60">사선 약 60°</option><option value="90">측면 약 90°</option></select></label><button id="flip" class="secondary">카메라 전환 ↻</button></div><p class="hint">실험용 촬영 각도입니다. 약 1.5~2m부터 조절하고 머리부터 허리, 양쪽 팔과 주먹이 모두 보이게 해주세요. 밝은 곳에서 카메라를 고정하세요.</p><button id="retry-model" class="secondary" hidden>AI 인식만 다시 준비</button><button id="retry-camera" class="secondary" hidden>카메라 다시 연결</button><button id="fallback-demo" class="secondary" hidden>카메라 없이 체험으로 전환 ▷</button><button id="start" class="primary" disabled>가드 자세를 확인하는 중</button></div><div id="hud" hidden><div><small>TIME LEFT</small><strong id="timer">10.0</strong></div><div><small>VALID PUNCHES</small><strong id="count">0</strong></div><div><small>BEST HIT</small><strong id="score">—</strong></div></div><button id="demo-hit" class="primary" hidden>펀치! (Space)</button><button id="cancel" class="text-button">중단하고 홈으로</button></section>
<section id="result" hidden><div class="eyebrow">CHALLENGE COMPLETE</div><h2>한계를 한 번 더.</h2><div class="result-card"><span id="result-tag">SPEED INDEX</span><strong id="result-score">0</strong><h3 id="rank"></h3><p id="comment"></p></div><div class="result-stats"><div>유효 펀치<b id="total"></b></div><div>최고 펀치 점수<b id="fastest"></b></div><div>왼손 / 오른손<b id="sides"></b></div><div>연속 성공<b id="streak"></b></div><div>개인 최고 지수<b id="best"></b></div></div><p id="result-note" class="hint"></p><button id="again" class="primary">다시 도전 ↗</button><button id="share" class="secondary">친구에게 도전하기 ↗</button><p id="share-status" role="status"></p><input id="share-link" readonly aria-label="도전 링크" hidden></section>
<details id="device-check"><summary>카메라 연결 점검</summary><p id="device-info"></p><button id="copy-diagnostics" class="secondary">점검 내용 복사</button><p id="diagnostics-status" role="status"></p></details><footer><b>PLAY HARD. STAY SAFE.</b><p>기기 주변을 비우고 화면이나 사람을 향해 치지 마세요.<br>게임용 지수이며 실제 속도·격투 능력을 측정하지 않습니다.</p><p>영상은 기기에서 처리하며 서버에 업로드·저장하지 않습니다.<br>카메라 시작 시 사용에 동의합니다. AI 모델 파일은 측정 준비 시 불러옵니다.</p></footer></main>`;
if (target !== null) {
  $("#challenge").hidden = false;
  $("#challenge").textContent =
    `친구의 도전 기록: ${target}점 — 너라면 깰 수 있지? (공유 기록은 검증되지 않았습니다)`;
}
document.body.dataset.screen = "home";
function show(next) {
  document.body.dataset.screen = next;
  window.scrollTo({top: 0, behavior: "instant"});
  phase = next;
  for (const id of ["home", "arena", "result"])
    $("#" + id).hidden = id !== next;
}
function status(text) {
  $("#status").textContent = text;
}
function release() {
  run++;
  cancelAnimationFrame(frame);
  camera.stop();
  $("#camera-state").hidden = true;
  $("#retry-model").hidden = true;
  $("video").srcObject = null;
  detector.reset();
  ready = false;
  readySince = 0;
}
async function loadModel() {
  if (model) return model;
  if (!modelPromise) {
    modelPromise = (async () => {
      const standalone = Boolean(window.PUNCH_STANDALONE);
      if (standalone) return createPoseRuntime(true);
      try {
      const files = await FilesetResolver.forVisionTasks(standalone
        ? "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        : `${import.meta.env.BASE_URL}wasm`);
      return await PoseLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: standalone
            ? "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
            : `${import.meta.env.BASE_URL}models/pose_landmarker_lite.task`,
          delegate: "CPU",
        },
        runningMode: "VIDEO", numPoses: 1,
        minPoseDetectionConfidence: 0.6, minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      } catch { return createPoseRuntime(false); }
    })();
  }
  try { model = await modelPromise; return model; }
  finally { modelPromise = null; }
}
async function initializeTracking(token) {
  $("#retry-model").hidden = true;
  status("카메라 연결 정상 · AI 신체 인식을 준비하는 중…");
  try {
    await loadModel();
    if (token !== run) return;
    $("#camera-state").textContent = "● 카메라 연결 정상 · AI 모델 준비 완료";
    lastVideo = -1; lastFrameAt = performance.now();
    lastInference = 0; inferenceInterval = 70;
    loop(performance.now(), token);
  } catch {
    if (token !== run) return;
    // Model errors are not camera failures. Keep the live preview and disable scoring.
    $("#camera-state").textContent = "● 카메라 연결 정상 · AI 인식 준비 실패";
    status("카메라 영상은 정상입니다. AI 모델 파일을 불러오지 못해 펀치 측정은 시작할 수 없습니다. 인터넷 연결을 확인해 주세요. 다운로드한 HTML은 공식 MediaPipe 파일을 불러옵니다. 웹앱 운영자는 모델 설치 상태도 확인해 주세요.");
    $("#start").disabled = true;
    $("#start").textContent = "AI 인식 준비 후 측정 가능";
    $("#retry-model").hidden = false;
    $("#fallback-demo").hidden = false;
  }
}
async function prepare(isDemo = false) {
  release();
  demo = isDemo;
  show("arena");
  phase = "prepare";
  $("#setup").hidden = false;
  $("#hud").hidden = true;
  $("#demo-hit").hidden = true;
  $("#retry-model").hidden = true;
  $("#camera-state").hidden = true;
  $("#camera-state").textContent = "";
  $("#retry-camera").hidden = true;
  $("#fallback-demo").hidden = true;
  $("#start").disabled = true;
  $("#start").textContent = "가드 자세를 확인하는 중";
  $("#countdown").textContent = "";
  $("#hit").textContent = "";
  $("#arena-title").textContent = demo ? "가볍게 워밍업." : "너의 링을 준비해.";
  $("#mode-label").textContent = demo ? "DEMO / SIMULATED" : "CAMERA CHECK";
  $(".view").classList.toggle("demo", demo);
  $("#flip").disabled = demo;
  $("#angle").disabled = demo;
  const token = run;
  if (demo) {
    ready = true;
    $("#start").disabled = false;
    $("#start").textContent = "체험 시작";
    status(
      "체험 모드: 버튼 또는 Space로 가상 펀치를 입력합니다. 실제 측정 기록에는 저장되지 않습니다.",
    );
    return;
  }
  status("카메라 연결 중… 권한 요청을 확인하세요.");
  try {
    if (!(await camera.open($("video"), facing)) || token !== run) return;
    $("video").classList.toggle("mirrored", facing === "user");
    camera.stream.getVideoTracks()[0].onended = () =>
      interrupt("카메라 연결이 끊겼습니다. 다시 연결해 주세요.");
    $("#camera-state").hidden = false;
    $("#camera-state").textContent = "● 카메라 연결 정상 · AI 인식 대기";
    await initializeTracking(token);
  } catch (error) {
    if (token !== run) return;
    release();
    status(error.message);
    $("#retry-camera").hidden = false;
    $("#fallback-demo").hidden = false;
  }
}
function draw(points) {
  const canvas = $("#overlay"),
    video = $("video");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.classList.toggle("mirrored", facing === "user");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!points) return;
  ctx.strokeStyle = "#f5ef54";
  ctx.fillStyle = "#f5ef54";
  ctx.lineWidth = 4;
  for (const [a, b] of [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
  ]) {
    if (
      points[a]?.visibility < CONFIG.confidence ||
      points[b]?.visibility < CONFIG.confidence
    )
      continue;
    ctx.beginPath();
    ctx.moveTo(points[a].x * canvas.width, points[a].y * canvas.height);
    ctx.lineTo(points[b].x * canvas.width, points[b].y * canvas.height);
    ctx.stroke();
  }
  for (const i of [11, 12, 13, 14, 15, 16]) {
    const p = points[i];
    if (p?.visibility >= CONFIG.confidence) {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
async function loop(now, token) {
  if (token !== run) return;
  if (!demo && now - lastFrameAt > 5000) {
    interrupt(
      "카메라 영상이 멈췄습니다. 다른 앱의 카메라 사용을 확인해 주세요.",
    );
    return;
  }
  if (
    !demo &&
    $("video").readyState >= 2 &&
    $("video").currentTime !== lastVideo &&
    now - lastInference >= inferenceInterval
  ) {
    lastVideo = $("video").currentTime;
    lastInference = now;
    lastFrameAt = now;
    try {
      const started = performance.now(),
        result = await model.detectForVideo($("video"), now),
        points = result.landmarks[0];
      if (token !== run) return;
      if (phase === "playing" && elapsedPhase(gameStart, performance.now()).done) { finish(); return; }
      inferenceInterval = Math.min(
        180,
        Math.max(70, (performance.now() - started) * 1.5),
      );
      draw(points);
      const valid = validPose(points);
      if (phase === "prepare") {
        const guard =
          valid &&
          [0, 1].every((side) => {
            const s = points[11 + side],
              e = points[13 + side],
              w = points[15 + side];
            return (
              Math.hypot(s.x - w.x, s.y - w.y) <
              (CONFIG.guard *
                (Math.hypot(s.x - e.x, s.y - e.y) +
                  Math.hypot(e.x - w.x, e.y - w.y))) /
                2
            );
          });
        if (guard) {
          if (!readySince) readySince = now;
          ready = now - readySince >= CONFIG.calibration;
        } else {
          readySince = 0;
          ready = false;
        }
        $("#start").disabled = !ready;
        $("#start").textContent = ready
          ? "준비 완료 · 10초 도전"
          : "가드 자세를 확인하는 중";
        status(
          ready
            ? "인식 준비 완료. 주먹을 몸 가까이 두고 시작하세요."
            : valid
              ? "팔을 굽혀 가드 자세를 1.2초 유지하세요."
              : "양쪽 어깨·팔꿈치·손목이 보이게 조정하세요. 밝은 조명과 사선 촬영을 권장합니다.",
        );
      } else if (phase === "playing") {
        if (valid) {
          status("뻗고, 가드로 복귀!");
          const events = detector.update(
            points.map((p) => ({
              ...p,
              x: p.x * ($("video").videoWidth / $("video").videoHeight),
            })),
            now,
          );
          for (const event of events) addPunch(event, now);
        } else {
          detector.update(null, now);
          streak = 0;
          stats.lost++;
          status(
            "추적 신뢰도 낮음 · 이 구간은 측정하지 않습니다. 양팔과 주먹을 보여 주세요.",
          );
        }
      }
    } catch {
      interrupt("신체 추적이 중단되었습니다. 카메라를 다시 연결해 주세요.");
      return;
    }
  }
  if (phase === "countdown" || phase === "playing") tick(performance.now());
  if (token === run) frame = requestAnimationFrame((t) => loop(t, token));
}
function start() {
  if (!ready || phase !== "prepare") return;
  phase = "countdown";
  stats = { count: 0, left: 0, right: 0, scores: [], maxStreak: 0, lost: 0 };
  streak = 0;
  lastPunch = 0;
  detector.reset();
  gameStart = performance.now();
  $("#setup").hidden = true;
  $("#hud").hidden = false;
  $("#count").textContent = "0";
  $("#score").textContent = "—";
  $("#timer").textContent = "10.0";
  $("#arena-title").textContent = demo ? "DEMO ROUND" : "준비. 집중. 펀치.";
  if (demo) loop(gameStart, run);
}
function tick(now) {
  const t = elapsedPhase(gameStart, now);
  if (t.done) {
    finish();
    return;
  }
  $("#countdown").textContent = t.countdown || "";
  if (!t.countdown && phase === "countdown") {
    phase = "playing";
    detector.reset();
    $("#demo-hit").hidden = !demo;
    status(
      demo ? "버튼 또는 Space로 펀치!" : "GO! 가드에서 시작해 팔을 뻗으세요.",
    );
  }
  $("#timer").textContent = Math.min(10, t.remaining).toFixed(1);
}
function addPunch(event, now) {
  if (
    phase !== "playing" ||
    now - gameStart >= CONFIG.countdown + CONFIG.duration
  )
    return;
  stats.count++;
  stats[event.side]++;
  stats.scores.push(event.score);
  streak = now - lastPunch < 1800 ? streak + 1 : 1;
  lastPunch = now;
  stats.maxStreak = Math.max(streak, stats.maxStreak);
  $("#count").textContent = stats.count;
  $("#score").textContent = Math.max(...stats.scores);
  $("#hit").textContent =
    `${event.side === "left" ? "LEFT" : "RIGHT"} +${event.score}`;
  $("#hit").classList.remove("pop");
  void $("#hit").offsetWidth;
  $("#hit").classList.add("pop");
}
let demoSide = 0,
  lastDemo = 0;
function demoHit() {
  const now = performance.now();
  if (!demo || now - lastDemo < CONFIG.cooldown) return;
  lastDemo = now;
  addPunch(
    { side: demoSide++ % 2 ? "right" : "left", score: 65 + (demoSide % 5) * 5 },
    now,
  );
}
function finish() {
  const result = stats;
  release();
  show("result");
  const index = result.scores.length
    ? Math.round(
        result.scores.reduce((a, b) => a + b, 0) / result.scores.length,
      )
    : 0;
  result.index = index;
  if (!demo && result.count) {
    best = Math.max(best, index);
    try {
      localStorage.setItem("punch-lab-best", String(best));
    } catch {
      storage = false;
    }
  }
  $("#result-score").textContent = result.count ? index : "—";
  $("#result-tag").textContent = demo
    ? "DEMO / 가상 점수"
    : "SPEED INDEX / 100";
  $("#rank").textContent = !result.count
    ? "측정 불가"
    : index >= 80
      ? "번개 주먹 ⚡"
      : index >= 60
        ? "링 위의 스피드스터"
        : index >= 40
          ? "리듬 타는 파이터"
          : "워밍업 완료";
  $("#comment").textContent = result.count
    ? "한 번 더. 다음 기록은 달라질 거야."
    : "유효한 동작을 확인하지 못했어요. 촬영 위치와 조명을 조정해 주세요.";
  $("#total").textContent = result.count;
  $("#fastest").textContent = result.count ? Math.max(...result.scores) : "—";
  $("#sides").textContent = `${result.left} / ${result.right}`;
  $("#streak").textContent = result.maxStreak;
  $("#best").textContent = best;
  $("#result-note").textContent =
    (demo
      ? "체험 점수입니다. 실제 측정·개인 기록에 반영하지 않습니다. "
      : result.lost
        ? "추적이 끊긴 구간을 제외한 결과입니다. "
        : "") +
    "지수는 유효 펀치 점수의 평균입니다. 등급은 게임 요소이며 촬영 조건에 따라 달라집니다." +
    (!storage
      ? " 브라우저 저장소를 사용할 수 없어 기록 저장이 제한됩니다."
      : "") +
    (target !== null && result.count
      ? ` 친구 기록 ${target}점 ${index > target ? "돌파!" : "다음에 도전!"} 전송된 기록은 검증되지 않았습니다.`
      : "");
  $("#share").disabled = demo || !result.count;
  $("#share-status").textContent = "";
  $("#share-link").hidden = true;
}
function interrupt(message) {
  if (!["prepare", "countdown", "playing"].includes(phase)) return;
  release();
  phase = "prepare";
  $("#setup").hidden = false;
  $("#hud").hidden = true;
  $("#demo-hit").hidden = true;
  $("#start").disabled = true;
  $("#countdown").textContent = "";
  status(message + " 진행 중인 라운드는 취소되었습니다.");
  $("#retry-camera").hidden = demo;
  if (demo) {
    ready = true;
    $("#start").disabled = false;
    $("#start").textContent = "체험 다시 시작";
  }
}
document.querySelectorAll("[data-action]").forEach(button => {button.onclick = () => prepare(button.dataset.action === "demo");});
$("#begin").onclick = () => prepare(false);
$("#demo").onclick = () => prepare(true);
$("#retry-model").onclick = () => {
  if (camera.stream && phase === "prepare") initializeTracking(run);
};
$("#fallback-demo").onclick = () => prepare(true);
$("#retry-camera").onclick = () => prepare(false);
$("#flip").onclick = () => {
  facing = facing === "user" ? "environment" : "user";
  prepare(false);
};
$("#start").onclick = start;
$("#cancel").onclick = () => {
  release();
  show("home");
};
$("#again").onclick = () => prepare(demo);
$("#demo-hit").onclick = demoHit;
$("#angle").onchange = () => {
  ready = false;
  readySince = 0;
  detector.reset();
  $("#start").disabled = true;
};
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && demo && phase === "playing") {
    e.preventDefault();
    demoHit();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden)
    interrupt("앱이 백그라운드로 전환되어 카메라를 중지했습니다.");
});
window.addEventListener("pagehide", release);
screen.orientation?.addEventListener("change", () =>
  interrupt("화면 방향이 바뀌었습니다. 위치를 다시 맞춰 주세요."),
);
window.addEventListener("orientationchange", () =>
  interrupt("화면 방향이 바뀌었습니다. 위치를 다시 맞춰 주세요."),
);
$("#share").onclick = async () => {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("target", stats.index);
  const text = `PUNCH LAB에서 ${stats.index}점! 내 기록에 도전해 봐.`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "PUNCH LAB", text, url: url.href });
      $("#share-status").textContent = "공유했습니다.";
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url.href);
      $("#share-status").textContent = "도전 링크를 복사했습니다.";
    } else throw new Error("clipboard");
  } catch (error) {
    if (error.name === "AbortError") return;
    $("#share-link").hidden = false;
    $("#share-link").value = url.href;
    $("#share-link").select();
    $("#share-status").textContent = "아래 링크를 길게 눌러 복사해 주세요.";
  }
};

function cameraDiagnostics() {
  const policy = document.permissionsPolicy || document.featurePolicy;
  return [
    `보안 연결: ${window.isSecureContext ? "사용 가능" : "HTTPS 필요"}`,
    `카메라 API: ${navigator.mediaDevices?.getUserMedia ? "지원" : "미지원 또는 차단"}`,
    `삽입 화면: ${window.top !== window.self ? "외부 브라우저에서 직접 열기 권장" : "아님"}`,
    `카메라 정책: ${policy?.allowsFeature("camera") === false ? "차단" : "명시적 차단 없음 또는 확인 불가"}`,
    `영상: ${camera.stream?.getVideoTracks()[0]?.readyState || "연결 전/종료"}`,
    `AI: ${model ? "준비됨" : "준비되지 않음"}`,
    `현재 안내: ${$("#status").textContent}`,
  ].join("\n");
}
$("#device-check").addEventListener("toggle", () => {
  if ($("#device-check").open) $("#device-info").textContent = cameraDiagnostics();
});
$("#copy-diagnostics").onclick = async () => {
  const text = cameraDiagnostics();
  $("#device-info").textContent = text;
  try { await navigator.clipboard.writeText(text); $("#diagnostics-status").textContent = "점검 내용을 복사했습니다. 오류 확인 시 이 내용을 알려주세요."; }
  catch { $("#diagnostics-status").textContent = "위 점검 내용을 선택해 복사하거나 화면을 캡처해 주세요."; }
};
