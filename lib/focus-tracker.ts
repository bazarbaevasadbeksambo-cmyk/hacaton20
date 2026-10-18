"use client";

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FocusSummary } from "./types";

// Everything here runs on the student's device. Frames are read from a local <video>
// and dropped right after landmark detection — nothing is stored or sent anywhere.

const MEDIAPIPE_VERSION = "0.10.14";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const EPISODE_AFTER_MS = 5000;
const YAW_THRESHOLD = 0.13; // deviation of the nose position between the eye corners
const PITCH_DOWN = 0.06; // looking down at the notebook is normal
const TICK_MS = 200;

// Face mesh landmark indices.
const NOSE_TIP = 1;
const EYE_OUTER_L = 33;
const EYE_OUTER_R = 263;
const CHIN = 152;

export type FocusState = "ok" | "away" | "noface";

type Pose = { yaw: number; pitch: number };

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export class FocusTracker {
  private landmarker: FaceLandmarker | null = null;
  private timer: number | null = null;
  private center: Pose | null = null;
  private lastPitchDown = false;
  private offSince: number | null = null;
  private inEpisode = false;
  private episodes = 0;
  private totalMs = 0;

  constructor(private video: HTMLVideoElement) {}

  /** Lazy-loads MediaPipe only when exam mode actually starts. */
  async load() {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.3,
      minFacePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
  }

  private pose(): Pose | null {
    if (!this.landmarker || this.video.readyState < 2) return null;
    const result = this.landmarker.detectForVideo(this.video, performance.now());
    const lm = result.faceLandmarks[0];
    if (!lm) return null;
    const nose = lm[NOSE_TIP];
    const l = lm[EYE_OUTER_L];
    const r = lm[EYE_OUTER_R];
    const chin = lm[CHIN];
    const eyeY = (l.y + r.y) / 2;
    return {
      yaw: (nose.x - l.x) / (r.x - l.x || 1e-6),
      pitch: (nose.y - eyeY) / (chin.y - eyeY || 1e-6),
    };
  }

  /** Student looks at the screen for `ms`; the median pose becomes "center". */
  async calibrate(ms = 3000): Promise<boolean> {
    const samples: Pose[] = [];
    const end = performance.now() + ms;
    while (performance.now() < end) {
      const p = this.pose();
      if (p) samples.push(p);
      await new Promise((r) => setTimeout(r, 100));
    }
    if (samples.length < 5) return false;
    this.center = { yaw: median(samples.map((s) => s.yaw)), pitch: median(samples.map((s) => s.pitch)) };
    return true;
  }

  private state(): FocusState {
    const p = this.pose();
    if (!p || !this.center) {
      // A face lost while bending over the notebook is still "focused".
      return this.lastPitchDown ? "ok" : "noface";
    }
    this.lastPitchDown = p.pitch - this.center.pitch > PITCH_DOWN;
    return Math.abs(p.yaw - this.center.yaw) > YAW_THRESHOLD ? "away" : "ok";
  }

  /** Calls `onChange(state, alert)` on every tick; alert = off-screen for more than 5 s. */
  start(onChange: (state: FocusState, alert: boolean) => void) {
    this.stopLoop();
    this.timer = window.setInterval(() => {
      const now = performance.now();
      const s = this.state();
      if (s === "ok") {
        if (this.inEpisode && this.offSince !== null) this.totalMs += now - this.offSince;
        this.inEpisode = false;
        this.offSince = null;
      } else {
        this.offSince ??= now;
        if (!this.inEpisode && now - this.offSince >= EPISODE_AFTER_MS) {
          this.inEpisode = true;
          this.episodes++;
        }
      }
      onChange(s, this.inEpisode);
    }, TICK_MS);
  }

  /** Only counts leave the device: number of episodes and their total length. */
  summary(): FocusSummary {
    const ongoing = this.inEpisode && this.offSince !== null ? performance.now() - this.offSince : 0;
    return { episodes: this.episodes, totalSeconds: Math.round((this.totalMs + ongoing) / 1000) };
  }

  private stopLoop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  dispose() {
    this.stopLoop();
    this.landmarker?.close();
    this.landmarker = null;
  }
}
