import React, { useRef, useEffect } from 'react';

interface CanvasBackgroundProps {
  showFireworks?: boolean;
}

const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ showFireworks = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Firework particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }> = [];

    // Colors for fireworks
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];

    // Create firework burst
    const createFirework = (x: number, y: number) => {
      const particleCount = 15;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = Math.random() * 3 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: 60 + Math.random() * 40
        });
      }
    };

    // Draw cake
    const drawCake = (x: number, y: number, scale: number = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Cake base (chocolate)
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-30, -10, 60, 30);

      // Cake layer (vanilla)
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(-30, -25, 60, 15);

      // Frosting
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect(-30, -30, 60, 5);

      // Candles
      for (let i = 0; i < 3; i++) {
        const candleX = -15 + i * 15;
        // Candle stick
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(candleX - 1, -45, 2, 15);
        
        // Flame
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(candleX, -47, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Animation loop
    let animationId: number;
    let lastFireworkTime = 0;
    const fireworkInterval = 2000; // 2 seconds

    const animate = (currentTime: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw decorative cakes at corners
      drawCake(80, canvas.height - 80, 0.6);
      drawCake(canvas.width - 80, canvas.height - 80, 0.6);
      drawCake(80, 80, 0.4);
      drawCake(canvas.width - 80, 80, 0.4);

      // Create fireworks periodically
      if (showFireworks && currentTime - lastFireworkTime > fireworkInterval) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.5) + 50;
        createFirework(x, y);
        lastFireworkTime = currentTime;
      }

      // Update and draw firework particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.life++;
        particle.alpha = 1 - (particle.life / particle.maxLife);

        // Remove dead particles
        if (particle.life >= particle.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [showFireworks]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

export default CanvasBackground;