// All sound is synthesised with WebAudio: short oscillator blips and filtered
// noise, no audio files and no network. Created lazily on the first user
// gesture so browsers allow it; every call is safe before that too.

let context = null;
let master = null;

function audioContext() {
  if (context) return context;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  context = new Audio();
  master = context.createGain();
  master.gain.value = 0.16;
  master.connect(context.destination);
  return context;
}

/** Unlock audio from a user gesture (click / key press). */
export function unlockAudio() {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(frequency, duration, type, slideTo) {
  const ctx = audioContext();
  if (!ctx || !master) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type || 'sine';
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.9, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration + 0.02);
}

function noiseBurst(duration, filterFrequency) {
  const ctx = audioContext();
  if (!ctx || !master) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFrequency;
  source.connect(filter);
  filter.connect(master);
  source.start();
}

/** A named sound effect. Unknown names are silent. */
export function playSound(name) {
  switch (name) {
    case 'pickup':
      tone(520, 0.08, 'triangle', 760);
      break;
    case 'chop':
      noiseBurst(0.07, 1800);
      tone(180, 0.06, 'square', 120);
      break;
    case 'chop-done':
      tone(660, 0.09, 'triangle');
      tone(880, 0.12, 'triangle');
      break;
    case 'sizzle':
      noiseBurst(0.25, 4200);
      break;
    case 'cooked':
      tone(740, 0.1, 'sine', 990);
      break;
    case 'plate':
      tone(420, 0.07, 'triangle', 560);
      break;
    case 'serve':
      tone(660, 0.1, 'sine');
      setTimeout(() => tone(880, 0.14, 'sine'), 90);
      setTimeout(() => tone(1320, 0.18, 'sine'), 180);
      break;
    case 'error':
      tone(220, 0.16, 'sawtooth', 160);
      break;
    case 'expired':
      tone(330, 0.2, 'sawtooth', 180);
      setTimeout(() => tone(260, 0.25, 'sawtooth', 140), 160);
      break;
    case 'new-order':
      tone(880, 0.08, 'triangle');
      setTimeout(() => tone(1174, 0.1, 'triangle'), 80);
      break;
    case 'click':
      tone(600, 0.05, 'square', 700);
      break;
    case 'win':
      [523, 659, 784, 1046].forEach((frequency, index) => {
        setTimeout(() => tone(frequency, 0.22, 'triangle'), index * 130);
      });
      break;
    case 'lose':
      [392, 330, 262].forEach((frequency, index) => {
        setTimeout(() => tone(frequency, 0.25, 'sine'), index * 160);
      });
      break;
    default:
      break;
  }
}
