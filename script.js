const display = document.getElementById("display");
const statusText = document.getElementById("status");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const applyCustomBtn = document.getElementById("apply-custom");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const presetButtons = Array.from(document.querySelectorAll("[data-seconds]"));

let initialSeconds = 300;
let remainingSeconds = initialSeconds;
let intervalId = null;
let paused = false;

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const updateDisplay = () => {
  display.textContent = formatTime(remainingSeconds);
  display.classList.toggle("warning", remainingSeconds <= 10 && remainingSeconds > 0);
  display.classList.toggle("finished", remainingSeconds === 0);
};

const updateStatus = (text) => {
  statusText.textContent = text;
};

const stopRunningTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const setButtons = ({ running }) => {
  startBtn.disabled = running;
  pauseBtn.disabled = !running && !paused;
  pauseBtn.textContent = paused ? "Fortsetzen" : "Pause";
};

const beep = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + 0.35);
};

const applyNewTime = (seconds) => {
  stopRunningTimer();
  paused = false;
  initialSeconds = seconds;
  remainingSeconds = initialSeconds;
  updateDisplay();
  updateStatus("Bereit");
  setButtons({ running: false });
};

const tick = () => {
  if (remainingSeconds === 0) {
    stopRunningTimer();
    paused = false;
    setButtons({ running: false });
    updateStatus("Start!");
    beep();
    return;
  }

  remainingSeconds -= 1;
  updateDisplay();
};

startBtn.addEventListener("click", () => {
  if (remainingSeconds <= 0) {
    remainingSeconds = initialSeconds;
  }
  paused = false;
  setButtons({ running: true });
  updateStatus("Läuft");
  stopRunningTimer();
  intervalId = setInterval(tick, 1000);
});

pauseBtn.addEventListener("click", () => {
  if (intervalId) {
    stopRunningTimer();
    paused = true;
    setButtons({ running: false });
    updateStatus("Pausiert");
    return;
  }

  if (paused && remainingSeconds > 0) {
    paused = false;
    setButtons({ running: true });
    updateStatus("Läuft");
    intervalId = setInterval(tick, 1000);
  }
});

resetBtn.addEventListener("click", () => {
  applyNewTime(initialSeconds);
});

applyCustomBtn.addEventListener("click", () => {
  const mins = Math.max(0, Math.min(59, Number(minutesInput.value) || 0));
  const secs = Math.max(0, Math.min(59, Number(secondsInput.value) || 0));
  const total = mins * 60 + secs;
  applyNewTime(total > 0 ? total : 1);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = Number(button.dataset.seconds);
    if (Number.isFinite(value) && value > 0) {
      applyNewTime(value);
    }
  });
});

updateDisplay();
setButtons({ running: false });
