import { useEffect, useRef } from 'react';
import './YukotoVoiceCharacter.css';

export type YukotoVoiceMode = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

type Props = {
  mode: YukotoVoiceMode;
  level?: number;
  reducedMotion?: boolean;
};

type Particle = { x: number; lane: number; depth: number; speed: number; phase: number; size: number; drift: number };

/** Yukoto's voice character. Idle states use a CSS 3D cube; AI speech uses an audio-reactive particle field. */
export function YukotoVoiceCharacter({ mode, level = 0, reducedMotion = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(level);
  const active = mode === 'speaking';

  useEffect(() => { levelRef.current = level; }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    const motionOff = reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles: Particle[] = Array.from({ length: 390 }, () => ({
      x: Math.random(), lane: Math.random() * Math.PI * 2, depth: 0.2 + Math.random() * 0.8,
      speed: 0.025 + Math.random() * 0.12, phase: Math.random() * Math.PI * 2,
      size: 0.45 + Math.random() * 1.8, drift: 0.3 + Math.random() * 1.5,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (time: number) => {
      frame = window.requestAnimationFrame(draw);
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
      lastTime = time;
      const amplitude = motionOff ? 0.12 : Math.max(0.1, Math.min(levelRef.current, 1));
      context.fillStyle = '#070b14';
      context.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.52;
      const t = motionOff ? 0 : time * 0.00035;
      // A faint perspective grid makes the particle field feel three-dimensional without a heavy 3D dependency.
      context.save();
      context.strokeStyle = 'rgba(91, 165, 210, 0.075)';
      context.lineWidth = 0.6;
      for (let i = 0; i < 9; i += 1) {
        const y = height * (0.25 + i * 0.075);
        context.beginPath();
        context.moveTo(width * 0.12, y);
        context.quadraticCurveTo(cx, y - height * 0.035, width * 0.88, y);
        context.stroke();
      }
      context.restore();

      for (const p of particles) {
        if (!motionOff) p.x += dt * p.speed * (0.42 + amplitude * 2.6);
        if (p.x > 1.08) p.x = -0.08;
        const perspective = 0.35 + p.depth * 1.2;
        const flowX = (p.x - 0.5) * width * 0.9;
        const waveA = Math.sin(p.x * 13 + p.lane + t * p.drift) * height * (0.035 + amplitude * 0.045);
        const waveB = Math.cos(p.x * 6.2 - p.phase + t * 1.4) * height * 0.028;
        const x = cx + flowX * perspective;
        const y = cy + waveA * perspective + waveB + Math.sin(p.lane + t * 1.7) * height * 0.035;
        const radius = p.size * perspective * (0.72 + amplitude * 0.6);
        const hue = (p.lane * 45 + p.x * 70 + time * 0.012) % 360;
        context.beginPath();
        context.fillStyle = `hsla(${180 + (hue % 65)}, 94%, ${66 + p.depth * 20}%, ${0.25 + p.depth * 0.65})`;
        context.shadowColor = `hsla(${190 + (hue % 50)}, 100%, 65%, 0.8)`;
        context.shadowBlur = 3 + radius * 3;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;

      const wash = context.createRadialGradient(cx, cy, 4, cx, cy, width * 0.42);
      wash.addColorStop(0, `rgba(16, 128, 191, ${0.035 + amplitude * 0.09})`);
      wash.addColorStop(1, 'rgba(7, 11, 20, 0)');
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active, reducedMotion]);

  if (active) {
    return (
      <div className="yukoto-character yukoto-character--speaking" aria-label="Yukoto is speaking" role="img">
        <canvas className="yukoto-sand-canvas" ref={canvasRef} />
        <div className="yukoto-sand-label"><span className="yukoto-live-dot" /> 正在说话 · SPEAKING</div>
      </div>
    );
  }

  return (
    <div className={`yukoto-character yukoto-character--${mode}`} aria-label={mode === 'listening' ? 'Yukoto is listening' : 'Yukoto is waiting'} role="img">
      <div className="yukoto-cube-scene">
        <div className={`yukoto-cube ${mode === 'connecting' || mode === 'thinking' ? 'is-thinking' : ''}`}>
          <div className="yukoto-cube-face yukoto-cube-front">
            <div className="yukoto-robot-eyes" aria-hidden="true">
              <span className="yukoto-robot-eye" />
              <span className="yukoto-robot-eye" />
            </div>
            <span className="yukoto-cube-mouth" />
          </div>
          <div className="yukoto-cube-face yukoto-cube-back" />
          <div className="yukoto-cube-face yukoto-cube-left" />
          <div className="yukoto-cube-face yukoto-cube-right" />
          <div className="yukoto-cube-face yukoto-cube-top" />
          <div className="yukoto-cube-face yukoto-cube-bottom" />
        </div>
      </div>
      <div className="yukoto-cube-ground" />
    </div>
  );
}
