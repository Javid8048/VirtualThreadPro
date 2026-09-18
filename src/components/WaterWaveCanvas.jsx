import React, { useEffect, useRef } from 'react';

/**
 * High-performance interactive water wave & fluid ripple canvas.
 * Renders multiple layered undulating water waves with soft caustics,
 * refractive gradients, and interactive ripple dynamics.
 */
export function WaterWaveCanvas({ theme = 'dark' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || 600;
    };

    window.addEventListener('resize', handleResize);

    // Interactive mouse ripples
    const ripples = [];
    const maxRipples = 6;

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        if (ripples.length > maxRipples) ripples.shift();
        ripples.push({
          x,
          y,
          radius: 10,
          maxRadius: Math.min(width, height) * 0.35,
          alpha: 0.35,
          speed: 2.8
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let time = 0;

    // Wave layer configurations
    const waveLayers = [
      {
        amplitude: 28,
        frequency: 0.0035,
        speed: 0.015,
        phase: 0,
        colorDark: 'rgba(53, 72, 184, 0.18)',
        colorLight: 'rgba(99, 102, 241, 0.12)',
        crestDark: 'rgba(0, 240, 255, 0.25)',
        crestLight: 'rgba(56, 189, 248, 0.20)',
        verticalOffset: 0.48
      },
      {
        amplitude: 36,
        frequency: 0.0028,
        speed: -0.012,
        phase: 2.1,
        colorDark: 'rgba(66, 88, 216, 0.14)',
        colorLight: 'rgba(129, 140, 248, 0.10)',
        crestDark: 'rgba(99, 102, 241, 0.30)',
        crestLight: 'rgba(168, 85, 247, 0.18)',
        verticalOffset: 0.55
      },
      {
        amplitude: 22,
        frequency: 0.0052,
        speed: 0.022,
        phase: 4.3,
        colorDark: 'rgba(0, 240, 255, 0.12)',
        colorLight: 'rgba(14, 165, 233, 0.14)',
        crestDark: 'rgba(255, 255, 255, 0.35)',
        crestLight: 'rgba(255, 255, 255, 0.45)',
        verticalOffset: 0.62
      },
      {
        amplitude: 16,
        frequency: 0.0075,
        speed: -0.018,
        phase: 1.2,
        colorDark: 'rgba(147, 51, 234, 0.10)',
        colorLight: 'rgba(216, 180, 254, 0.12)',
        crestDark: 'rgba(0, 240, 255, 0.40)',
        crestLight: 'rgba(59, 130, 246, 0.25)',
        verticalOffset: 0.70
      }
    ];

    const isDark = theme === 'dark';

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw each fluid water wave layer
      waveLayers.forEach((layer) => {
        ctx.save();
        ctx.beginPath();

        const baseHeight = height * layer.verticalOffset;
        ctx.moveTo(0, height);

        // Calculate wave curve points across canvas width
        for (let x = 0; x <= width; x += 6) {
          // Compound sinusoidal water harmonic
          const wave1 = Math.sin(x * layer.frequency + time * layer.speed + layer.phase) * layer.amplitude;
          const wave2 = Math.cos(x * (layer.frequency * 0.65) - time * (layer.speed * 0.8)) * (layer.amplitude * 0.45);
          const wave3 = Math.sin((x * 0.001) + time * 0.008) * 12;

          let y = baseHeight + wave1 + wave2 + wave3;

          // Apply mouse ripple perturbations to the water surface
          for (let i = 0; i < ripples.length; i++) {
            const rip = ripples[i];
            const dist = Math.abs(x - rip.x);
            if (dist < rip.radius) {
              const rippleFactor = Math.cos((dist / rip.radius) * Math.PI * 0.5);
              y += Math.sin((dist * 0.12) - rip.radius * 0.15) * 14 * rip.alpha * rippleFactor;
            }
          }

          if (x === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Liquid depth gradient
        const grad = ctx.createLinearGradient(0, baseHeight - layer.amplitude, 0, height);
        grad.addColorStop(0, isDark ? layer.crestDark : layer.crestLight);
        grad.addColorStop(0.2, isDark ? layer.colorDark : layer.colorLight);
        grad.addColorStop(1, isDark ? 'rgba(9, 11, 16, 0.0)' : 'rgba(248, 249, 252, 0.0)');

        ctx.fillStyle = grad;
        ctx.fill();

        // Glowing water crest line highlight
        ctx.strokeStyle = isDark ? layer.crestDark : layer.crestLight;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      });

      // 2. Render expanding interactive ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.alpha *= 0.965;

        if (rip.alpha > 0.02 && rip.radius < rip.maxRadius) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? `rgba(0, 240, 255, ${rip.alpha * 0.6})`
            : `rgba(56, 189, 248, ${rip.alpha * 0.7})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Secondary inner concentric echo ring
          if (rip.radius > 20) {
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, rip.radius * 0.65, 0, Math.PI * 2);
            ctx.strokeStyle = isDark
              ? `rgba(66, 88, 216, ${rip.alpha * 0.4})`
              : `rgba(99, 102, 241, ${rip.alpha * 0.45})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          ctx.restore();
        } else {
          ripples.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0 opacity-85 transition-opacity duration-700"
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
    />
  );
}
