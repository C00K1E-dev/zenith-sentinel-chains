import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const VisionVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      time += 0.01;

      // Create flowing gradient mesh using Perlin-like noise simulation
      const noiseGrid: number[][] = [];
      const gridSize = 6;
      const cellWidth = canvas.offsetWidth / gridSize;
      const cellHeight = canvas.offsetHeight / gridSize;

      // Generate noise values
      for (let i = 0; i <= gridSize; i++) {
        noiseGrid[i] = [];
        for (let j = 0; j <= gridSize; j++) {
          const angle = (i + j + time * 0.5) * 0.5;
          const wave1 = Math.sin(angle) * 0.5;
          const wave2 = Math.cos(angle * 0.7) * 0.5;
          noiseGrid[i][j] = (wave1 + wave2) * cellHeight * 0.2;
        }
      }

      // Draw mesh with gradient
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x1 = i * cellWidth;
          const y1 = j * cellHeight;
          const x2 = (i + 1) * cellWidth;
          const y2 = (j + 1) * cellHeight;

          // Calculate displacement
          const offset1 = noiseGrid[i][j];
          const offset2 = noiseGrid[i + 1][j];
          const offset3 = noiseGrid[i][j + 1];
          const offset4 = noiseGrid[i + 1][j + 1];

          // Color gradient based on position and time
          const hue1 = (220 + (i / gridSize) * 60 + time * 10) % 360;
          const sat = 70 + Math.sin(time * 0.3) * 20;
          const light = 50 + Math.sin((i + j) * 0.5 + time * 0.2) * 10;

          // Create gradient for this cell
          const cellGradient = ctx.createLinearGradient(
            x1 + offset1,
            y1,
            x2 + offset2,
            y2
          );

          cellGradient.addColorStop(
            0,
            `hsl(${hue1}, ${sat}%, ${light}%)`
          );
          cellGradient.addColorStop(
            0.5,
            `hsl(${(hue1 + 60) % 360}, ${sat}%, ${light + 5}%)`
          );
          cellGradient.addColorStop(
            1,
            `hsl(${(hue1 + 120) % 360}, ${sat}%, ${light}%)`
          );

          // Draw filled mesh
          ctx.fillStyle = cellGradient;
          ctx.beginPath();
          ctx.moveTo(x1 + offset1, y1 + offset1);
          ctx.lineTo(x2 + offset2, y2 + offset3);
          ctx.lineTo(x2 + offset4, y2 + offset4);
          ctx.lineTo(x1 + offset3, y1 + offset2);
          ctx.closePath();
          ctx.fill();

          // Draw mesh lines
          ctx.strokeStyle = `rgba(99, 179, 237, ${0.2 + Math.sin(time + i + j) * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Add flowing light effect
      const lightX = (canvas.offsetWidth / 2) + Math.sin(time * 0.5) * (canvas.offsetWidth * 0.2);
      const lightY = (canvas.offsetHeight / 2) + Math.cos(time * 0.3) * (canvas.offsetHeight * 0.2);

      const lightGradient = ctx.createRadialGradient(
        lightX,
        lightY,
        0,
        lightX,
        lightY,
        Math.max(canvas.offsetWidth, canvas.offsetHeight) * 0.5
      );

      lightGradient.addColorStop(0, 'rgba(99, 179, 237, 0.2)');
      lightGradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.1)');
      lightGradient.addColorStop(1, 'rgba(45, 212, 191, 0)');

      ctx.fillStyle = lightGradient;
      ctx.beginPath();
      ctx.arc(lightX, lightY, Math.max(canvas.offsetWidth, canvas.offsetHeight) * 0.5, 0, Math.PI * 2);
      ctx.fill();

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-full"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
};

export default VisionVisualization;
