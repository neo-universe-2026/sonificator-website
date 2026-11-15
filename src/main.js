import init, { WasmSonificator } from "../wasm/pkg/sonificator_wasm.js";
import { animate, inView, stagger } from "motion";
import "./style.css";

const video = document.querySelector("#video");
const videoWrap = document.querySelector(".primary-video");
const canvas = document.querySelector("#canvas");
const context = canvas.getContext("2d", { willReadFrequently: true });
const startButton = document.querySelector("#start-button");
const sessionState = document.querySelector("#session-state");
const sourceName = document.querySelector("#source-name");
const sourceCaption = document.querySelector("#source-caption");
const timecode = document.querySelector("#timecode");
const sampleRateLabel = document.querySelector("#sample-rate");
const playToggle = document.querySelector("#play-toggle");
const progress = document.querySelector("#progress");
const durationLabel = document.querySelector("#duration");
const statPulse = document.querySelector("#stat-pulse");
const statX = document.querySelector("#stat-x");
const statY = document.querySelector("#stat-y");
const statDispersion = document.querySelector("#stat-dispersion");
const sourceButtons = [...document.querySelectorAll(".source-option")];

const CAPTURE_WIDTH = 128;
const CAPTURE_HEIGHT = 72;
canvas.width = CAPTURE_WIDTH;
canvas.height = CAPTURE_HEIGHT;

let wasm;
let engine;
let audioContext;
let processor;
let running = false;
let audioReady = false;
let lastFrame = -1;
let rafId = 0;
let isScrubbing = false;

function setupAnimations() {
  animate(".topbar", { opacity: [0, 1], y: [-14, 0] }, { duration: 0.7, ease: "easeOut" });
  animate(".rail-label", { opacity: [0, 1], x: [-18, 0] }, { duration: 0.6, delay: 0.15, ease: "easeOut" });
  animate(".intro h1", { opacity: [0, 1], y: [28, 0] }, { duration: 0.9, delay: 0.25, ease: "easeOut" });
  animate(".intro-bottom", { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, delay: 0.55, ease: "easeOut" });
  animate(".hero-block", { opacity: [0, 1], scale: [0.86, 1], x: [35, 0] }, { duration: 1.1, delay: 0.2, ease: "easeOut" });
  animate(".hero-signal span", { scaleY: [0, 1] }, { duration: 0.7, delay: stagger(0.08, { startDelay: 0.65 }), ease: "easeOut" });

  inView(".studio-grid", ({ target }) => {
    animate(target.querySelectorAll("[data-motion='rise']"), { opacity: [0, 1], y: [30, 0] }, {
      duration: 0.75,
      delay: stagger(0.12),
      ease: "easeOut",
    });
  }, { amount: 0.2, once: true });

  inView(".video-footer, .stats-grid, .mapping-card", ({ target }) => {
    animate(target, { opacity: [0, 1], y: [18, 0] }, { duration: 0.6, ease: "easeOut" });
  }, { amount: 0.25, once: true });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function updateStats() {
  if (!engine) {
    statPulse.textContent = "0.00";
    statX.textContent = "0.50";
    statY.textContent = "0.50";
    statDispersion.textContent = "0.00";
    return;
  }
  const pulse = engine.pulse();
  statPulse.textContent = pulse.toFixed(2);
  statX.textContent = engine.pulse_x().toFixed(2);
  statY.textContent = engine.pulse_y().toFixed(2);
  statDispersion.textContent = engine.pulse_dispersion().toFixed(2);
}

function stopCaptureLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function startCaptureLoop() {
  stopCaptureLoop();
  rafId = requestAnimationFrame(captureFrame);
}

async function resetSession() {
  running = false;
  stopCaptureLoop();
  lastFrame = -1;
  video.pause();
  if (audioContext?.state === "running") await audioContext.suspend();
  if (audioContext) engine = new WasmSonificator(audioContext.sampleRate);
  video.currentTime = 0;
  progress.value = "0";
  timecode.textContent = "00:00";
  updateStats();
  updatePlaybackUi();
  sessionState.textContent = "Ready for the selected source.";
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function pushCurrentFrame() {
  if (!engine || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
  context.drawImage(video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
  engine.push_frame(context.getImageData(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT).data, CAPTURE_WIDTH, CAPTURE_HEIGHT);
  updateStats();
}

function captureFrame() {
  if (!running) {
    rafId = 0;
    return;
  }
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && engine) {
    if (video.currentTime !== lastFrame) {
      lastFrame = video.currentTime;
      pushCurrentFrame();
    }
    timecode.textContent = formatTime(video.currentTime);
    if (!isScrubbing && Number.isFinite(video.duration) && video.duration > 0) {
      progress.value = String((video.currentTime / video.duration) * 100);
    }
  }
  rafId = requestAnimationFrame(captureFrame);
}

function setupAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioCtx();
  engine = new WasmSonificator(audioContext.sampleRate);
  // 1 input channel ensures cross-browser ScriptProcessorNode compatibility
  processor = audioContext.createScriptProcessor(1024, 1, 2);
  processor.onaudioprocess = (event) => {
    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    if (!running || !engine || video.paused) {
      left.fill(0);
      right.fill(0);
      return;
    }
    const samples = engine.render(event.outputBuffer.length);
    for (let i = 0; i < left.length; i += 1) {
      left[i] = samples[i * 2] ?? 0;
      right[i] = samples[i * 2 + 1] ?? 0;
    }
  };
  processor.connect(audioContext.destination);
  audioReady = true;
  sampleRateLabel.textContent = `${audioContext.sampleRate.toLocaleString()} HZ / STEREO`;
}

function updatePlaybackUi() {
  const icon = running ? "Ⅱ" : "▶";
  playToggle.textContent = icon;
  playToggle.setAttribute("aria-label", running ? "Pause session" : "Play session");
  startButton.querySelector(".play-icon").textContent = running ? "Ⅱ" : "▶";
  startButton.querySelector("span:last-child").textContent = running ? "PAUSE SESSION" : "START SESSION";
  startButton.classList.toggle("active", running);
  videoWrap.classList.toggle("is-playing", running);
}

async function startSession() {
  if (!wasm) return;
  try {
    if (!audioReady) setupAudio();
    if (running) {
      running = false;
      stopCaptureLoop();
      video.pause();
      if (audioContext?.state === "running") await audioContext.suspend();
      sessionState.textContent = "Session paused.";
      updatePlaybackUi();
      return;
    }

    if (video.ended) video.currentTime = 0;
    await audioContext.resume();
    await video.play();
    running = true;
    lastFrame = -1;
    sessionState.textContent = "Listening to the frame.";
    updatePlaybackUi();
    startCaptureLoop();
  } catch (error) {
    console.error(error);
    running = false;
    stopCaptureLoop();
    video.pause();
    if (audioContext?.state === "running") {
      await audioContext.suspend().catch(() => {});
    }
    updatePlaybackUi();
    sessionState.textContent = "Could not start playback. Check browser audio or video support.";
  }
}

sourceButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (button.classList.contains("active") && video.getAttribute("src") === button.dataset.src) {
      return;
    }
    animate(".video-wall", { opacity: [1, 0], scale: [1, 0.98] }, { duration: 0.18, ease: "easeIn" });
    window.setTimeout(() => {
      animate(".video-wall", { opacity: [0, 1], scale: [0.98, 1] }, { duration: 0.35, ease: "easeOut" });
    }, 180);
    await resetSession();
    sourceButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    video.src = button.dataset.src;
    sourceName.textContent = button.dataset.name;
    if (sourceCaption) {
      sourceCaption.textContent = button.dataset.caption || "";
    }
    video.load();
  });
});

function syncDuration() {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    durationLabel.textContent = formatTime(video.duration);
  }
}

startButton.addEventListener("click", startSession);
playToggle.addEventListener("click", startSession);
progress.addEventListener("pointerdown", () => { isScrubbing = true; });
window.addEventListener("pointerup", () => { isScrubbing = false; });
window.addEventListener("pointercancel", () => { isScrubbing = false; });
progress.addEventListener("change", () => { isScrubbing = false; });
progress.addEventListener("input", () => {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const targetTime = (Number(progress.value) / 100) * video.duration;
  video.currentTime = targetTime;
  timecode.textContent = formatTime(targetTime);
});
video.addEventListener("loadedmetadata", syncDuration);
if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
  syncDuration();
}
video.addEventListener("timeupdate", () => {
  timecode.textContent = formatTime(video.currentTime);
  if (!isScrubbing && Number.isFinite(video.duration) && video.duration > 0) {
    progress.value = String((video.currentTime / video.duration) * 100);
  }
});
video.addEventListener("seeked", () => {
  lastFrame = -1;
  timecode.textContent = formatTime(video.currentTime);
  pushCurrentFrame();
});
video.addEventListener("error", () => {
  running = false;
  stopCaptureLoop();
  updatePlaybackUi();
  sessionState.textContent = "Could not load the selected video source.";
});

async function initialize() {
  try {
    wasm = await init();
    setupAnimations();
  } catch (error) {
    console.error(error);
    sessionState.textContent = "Could not load the WASM engine.";
    startButton.disabled = true;
  }
}

initialize();
