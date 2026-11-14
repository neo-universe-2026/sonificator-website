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

let wasm;
let engine;
let audioContext;
let processor;
let source;
let running = false;
let audioReady = false;
let lastFrame = 0;

function setupAnimations() {
  animate(".topbar", { opacity: [0, 1], y: [-14, 0] }, { duration: 0.7, ease: "easeOut" });
  animate(".intro-kicker", { opacity: [0, 1], x: [-18, 0] }, { duration: 0.6, delay: 0.15, ease: "easeOut" });
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

  document.querySelectorAll(".source-option").forEach((button) => {
    button.addEventListener("mouseenter", () => animate(button, { x: 8 }, { duration: 0.25, ease: "easeOut" }));
    button.addEventListener("mouseleave", () => animate(button, { x: 0 }, { duration: 0.3, ease: "easeOut" }));
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function updateStats() {
  if (!engine) return;
  const pulse = engine.orange_pulse();
  statPulse.textContent = pulse.toFixed(2);
  statX.textContent = engine.pulse_x().toFixed(2);
  statY.textContent = engine.pulse_y().toFixed(2);
  statDispersion.textContent = engine.pulse_dispersion().toFixed(2);
}

async function resetSession() {
  running = false;
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
  return `00:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;
}

function captureFrame() {
  if (!running || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
  const width = 128;
  const height = 72;
  canvas.width = width;
  canvas.height = height;
  context.drawImage(video, 0, 0, width, height);
  engine.push_frame(context.getImageData(0, 0, width, height).data, width, height);
  timecode.textContent = formatTime(video.currentTime);
  if (Number.isFinite(video.duration) && video.duration > 0) {
    progress.value = String((video.currentTime / video.duration) * 100);
  }
  requestAnimationFrame(captureFrame);
}

function setupAudio() {
  audioContext = new AudioContext();
  engine = new WasmSonificator(audioContext.sampleRate);
  source = audioContext.createMediaElementSource(video);
  processor = audioContext.createScriptProcessor(1024, 0, 2);
  processor.onaudioprocess = (event) => {
    const samples = engine.render(event.outputBuffer.length);
    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    for (let i = 0; i < left.length; i += 1) {
      left[i] = samples[i * 2];
      right[i] = samples[i * 2 + 1];
    }
    updateStats();
  };
  source.connect(processor);
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
  if (!audioReady) setupAudio();
  if (running) {
    running = false;
    video.pause();
    await audioContext.suspend();
    sessionState.textContent = "Session paused.";
    updatePlaybackUi();
    return;
  }

  if (video.ended) video.currentTime = 0;
  await audioContext.resume();
  await video.play();
  running = true;
  sessionState.textContent = "Listening to the frame.";
  updatePlaybackUi();
  requestAnimationFrame(captureFrame);
}

sourceButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    animate(".video-wall", { opacity: [1, 0], scale: [1, 0.98] }, { duration: 0.18, ease: "easeIn" });
    window.setTimeout(() => {
      animate(".video-wall", { opacity: [0, 1], scale: [0.98, 1] }, { duration: 0.35, ease: "easeOut" });
    }, 180);
    await resetSession();
    sourceButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    video.src = button.dataset.src;
    sourceName.textContent = button.dataset.name;
    video.load();
  });
});

startButton.addEventListener("click", startSession);
playToggle.addEventListener("click", startSession);
progress.addEventListener("input", () => {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  video.currentTime = (Number(progress.value) / 100) * video.duration;
});
video.addEventListener("loadedmetadata", () => {
  durationLabel.textContent = formatTime(video.duration);
});
video.addEventListener("timeupdate", () => {
  timecode.textContent = formatTime(video.currentTime);
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
