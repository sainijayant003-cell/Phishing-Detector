import { useEffect, useRef } from 'react'

export default function MatrixRain({ enabled = true }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const characters = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'
    const fontSize = 14
    const columns = Math.floor(width / fontSize)
    const drops = new Array(columns).fill(1)

    function handleResize() {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    let lastDraw = 0
    function draw(timestamp) {
      if (timestamp - lastDraw > 45) { // Throttle ~22fps for retro hacker feel and low CPU
        lastDraw = timestamp
        ctx.fillStyle = 'rgba(7, 17, 31, 0.15)'
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = '#00ff88'
        ctx.font = `${fontSize}px 'DM Mono', monospace`

        for (let i = 0; i < drops.length; i++) {
          const text = characters.charAt(Math.floor(Math.random() * characters.length))
          ctx.fillText(text, i * fontSize, drops[i] * fontSize)

          if (drops[i] * fontSize > height && Math.random() > 0.975) {
            drops[i] = 0
          }
          drops[i]++
        }
      }
      animationFrameId = requestAnimationFrame(draw)
    }

    animationFrameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.12,
      }}
    />
  )
}
