// Synthesized Web Audio API sound effects for PhishGuard Tactical HUD
// No external audio files needed!

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Master audio switch (persisted in localStorage)
export function isAudioEnabled() {
  try {
    return localStorage.getItem('phishguard-sound') !== 'disabled'
  } catch {
    return true
  }
}

export function setAudioEnabled(enabled) {
  try {
    localStorage.setItem('phishguard-sound', enabled ? 'enabled' : 'disabled')
  } catch {}
}

export function playKeyClick() {
  if (!isAudioEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime)
    gain.gain.setValueAtTime(0.015, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  } catch {}
}

export function playScanStart() {
  if (!isAudioEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25)

    gain.gain.setValueAtTime(0.03, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.28)
  } catch {}
}

export function playSafeChime() {
  if (!isAudioEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)

      gain.gain.setValueAtTime(0.035, now + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.3)
    })
  } catch {}
}

export function playThreatAlert() {
  if (!isAudioEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    // Pulse klaxon
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      const start = now + i * 0.14
      osc.frequency.setValueAtTime(880, start)
      osc.frequency.setValueAtTime(440, start + 0.07)

      gain.gain.setValueAtTime(0.045, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.13)
    }
  } catch {}
}

export function playSuspiciousWarning() {
  if (!isAudioEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.setValueAtTime(349.23, now + 0.1)

    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch {}
}
