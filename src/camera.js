export const CAMERA_ERRORS = {
  NotAllowedError:
    "카메라 권한이 거부되었습니다. 브라우저 주소창의 사이트 설정에서 카메라를 허용하고 다시 시도하세요.",
  NotFoundError:
    "사용 가능한 카메라가 없습니다. 카메라 연결을 확인하거나 체험 모드를 이용하세요.",
  NotReadableError:
    "카메라를 열 수 없습니다. 다른 앱·탭의 카메라를 종료하고 다시 시도하세요.",
  OverconstrainedError:
    "요청한 카메라 조건을 지원하지 않습니다. 다른 카메라를 선택해 주세요.",
  SecurityError:
    "브라우저가 카메라를 차단했습니다. HTTPS와 사이트 권한을 확인하세요.",
  AbortError: "카메라 연결이 중단되었습니다. 다시 시도해 주세요.",
  TimeoutError:
    "카메라 영상 재생이 지연되고 있습니다. 다른 앱의 카메라 사용을 종료하고 다시 연결하세요.",
};
export function cameraMessage(error) {
  return (
    CAMERA_ERRORS[error.name] ||
    `카메라 연결에 실패했습니다 (${error.name || "알 수 없는 오류"}). 다른 브라우저 또는 체험 모드를 이용하세요.`
  );
}
export class Camera {
  constructor() {
    this.generation = 0;
    this.stream = null;
    this.request = null;
    this.pending = false;
  }
  stop() {
    this.generation++;
    this.pending = false;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
  async open(video, facing = "user") {
    this.stop();
    const generation = this.generation;
    if (!window.isSecureContext)
      throw new Error(
        "카메라는 HTTPS 또는 localhost에서만 사용할 수 있습니다.",
      );
    const policy = typeof document !== "undefined"
      ? (document.permissionsPolicy || document.featurePolicy) : null;
    if (policy?.allowsFeature("camera") === false)
      throw new Error("현재 미리보기·삽입 화면이 카메라 사용을 차단하고 있습니다. Safari 또는 Chrome에서 HTTPS 웹사이트 주소를 직접 열어 주세요.");
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "이 브라우저는 카메라를 지원하지 않습니다. Safari 또는 Chrome에서 직접 열어 주세요.",
      );
    this.pending = true;
    try {
      // Permission dialogs cannot be aborted by the web platform. Serialize requests;
      // a late response is released before another request is made.
      if (this.request) await this.request.catch(() => {});
      if (generation !== this.generation) return false;
      const request = (async () => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24, max: 30 },
            },
          });
        } catch (error) {
          if (
            generation !== this.generation ||
            !["OverconstrainedError", "NotFoundError"].includes(error.name)
          )
            throw error;
          return navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        }
      })();
      this.request = request;
      let stream;
      try {
        stream = await request;
      } finally {
        if (this.request === request) this.request = null;
      }
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      this.stream = stream;
      video.srcObject = stream;
      let timeout;
      try {
        await Promise.race([
          video.play(),
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject({ name: "TimeoutError" }), 10000);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      return generation === this.generation;
    } catch (error) {
      if (generation !== this.generation) return false;
      this.stop();
      throw new Error(cameraMessage(error));
    } finally {
      if (generation === this.generation) this.pending = false;
    }
  }
}
