import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Node {
  x: number;
  y: number;
  size: number;
  pulseDelay: number;
  glowIntensity: number;
}

interface Connection {
  from: Node;
  to: Node;
  delay: number;
}

const WorldMap = () => {
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

    // Accurate world map coordinates (latitude/longitude converted to screen coordinates)
    const worldDots: { x: number; y: number }[] = [];
    
    // Major landmass polygons (simplified but geographically accurate)
    const continents = [
      // North America
      [
        [-170, 65], [-140, 70], [-100, 70], [-80, 75], [-70, 60], [-80, 50],
        [-125, 50], [-130, 55], [-140, 60], [-160, 65], [-170, 65],
        [-100, 45], [-80, 45], [-70, 40], [-75, 30], [-85, 25], [-95, 30],
        [-105, 35], [-115, 40], [-120, 45], [-100, 45],
        [-110, 20], [-100, 15], [-85, 15], [-80, 20], [-90, 25], [-110, 20]
      ],
      // South America
      [
        [-80, 10], [-70, 10], [-60, 5], [-50, -5], [-45, -10], [-40, -20],
        [-50, -30], [-60, -40], [-70, -50], [-75, -45], [-80, -30], [-85, -10], [-80, 10]
      ],
      // Europe
      [
        [-10, 60], [0, 60], [10, 55], [20, 55], [30, 60], [40, 55], [30, 50],
        [20, 45], [10, 40], [0, 40], [-10, 45], [-10, 60]
      ],
      // Africa
      [
        [-20, 35], [0, 35], [10, 30], [30, 30], [40, 20], [50, 10], [40, 0],
        [40, -10], [35, -20], [25, -30], [15, -35], [10, -30], [5, -20],
        [0, -10], [-10, 0], [-15, 10], [-20, 20], [-20, 35]
      ],
      // Asia
      [
        [40, 70], [60, 75], [80, 75], [100, 70], [120, 60], [140, 50], [145, 40],
        [135, 30], [125, 20], [115, 10], [100, 5], [80, 10], [70, 15], [60, 20],
        [50, 30], [40, 40], [40, 55], [40, 70]
      ],
      // Australia
      [
        [115, -10], [130, -10], [140, -20], [145, -30], [140, -40], [130, -35],
        [120, -30], [115, -20], [115, -10]
      ]
    ];

    // Convert lat/long to screen coordinates and generate dots
    const latToY = (lat: number) => ((90 - lat) / 180) * canvas.offsetHeight;
    const lonToX = (lon: number) => ((lon + 180) / 360) * canvas.offsetWidth;

    // Helper function to check if point is inside polygon
    const isPointInPolygon = (x: number, y: number, polygon: number[][]) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = lonToX(polygon[i][0]), yi = latToY(polygon[i][1]);
        const xj = lonToX(polygon[j][0]), yj = latToY(polygon[j][1]);
        const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Generate dots for each continent
    const dotDensity = 6;
    for (let x = 0; x < canvas.offsetWidth; x += dotDensity) {
      for (let y = 0; y < canvas.offsetHeight; y += dotDensity) {
        const isLand = continents.some(continent => isPointInPolygon(x, y, continent));
        if (isLand && Math.random() > 0.25) {
          worldDots.push({ x, y });
        }
      }
    }

    // AI Agent nodes (major cities with accurate coordinates)
    const cityNodes = [
      { lat: 37.7749, lon: -122.4194, name: "San Francisco", size: 8 }, // SF
      { lat: 40.7128, lon: -74.0060, name: "New York", size: 7 }, // NYC
      { lat: 51.5074, lon: -0.1278, name: "London", size: 7 }, // London
      { lat: 48.8566, lon: 2.3522, name: "Paris", size: 6 }, // Paris
      { lat: 35.6762, lon: 139.6503, name: "Tokyo", size: 9 }, // Tokyo
      { lat: 1.3521, lon: 103.8198, name: "Singapore", size: 7 }, // Singapore
      { lat: -33.8688, lon: 151.2093, name: "Sydney", size: 6 }, // Sydney
      { lat: 19.4326, lon: -99.1332, name: "Mexico City", size: 5 }, // Mexico City
      { lat: -23.5505, lon: -46.6333, name: "São Paulo", size: 6 }, // São Paulo
      { lat: 55.7558, lon: 37.6173, name: "Moscow", size: 6 }, // Moscow
      { lat: 25.2048, lon: 55.2708, name: "Dubai", size: 6 }, // Dubai
      { lat: 31.2304, lon: 121.4737, name: "Shanghai", size: 8 }, // Shanghai
    ];

    const nodes: Node[] = cityNodes.map((city, i) => ({
      x: lonToX(city.lon),
      y: latToY(city.lat),
      size: city.size,
      pulseDelay: i * 0.3,
      glowIntensity: city.size / 10,
    }));

    // Create connections between nodes
    const connections: Connection[] = [];
    nodes.forEach((node, i) => {
      // Connect to 2-3 nearest nodes
      const distances = nodes
        .map((n, idx) => ({
          node: n,
          distance: Math.hypot(node.x - n.x, node.y - n.y),
          index: idx,
        }))
        .filter(d => d.index !== i)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, Math.floor(Math.random() * 2) + 2);

      distances.forEach((d, idx) => {
        connections.push({
          from: node,
          to: d.node,
          delay: i * 0.2 + idx * 0.3,
        });
      });
    });

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      time += 0.016; // ~60fps

      // Draw world dots with gradient
      worldDots.forEach((dot) => {
        const distance = Math.hypot(dot.x - canvas.offsetWidth / 2, dot.y - canvas.offsetHeight / 2);
        const maxDistance = Math.hypot(canvas.offsetWidth / 2, canvas.offsetHeight / 2);
        const normalizedDistance = distance / maxDistance;
        
        // Create gradient effect
        const hue = 220 + (normalizedDistance * 60); // From blue to teal
        const alpha = 0.2 + (1 - normalizedDistance) * 0.3;
        
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections with animated flow
      connections.forEach((conn) => {
        const progress = ((time * 0.3 + conn.delay) % 2) / 2;
        
        // Connection line
        const gradient = ctx.createLinearGradient(conn.from.x, conn.from.y, conn.to.x, conn.to.y);
        gradient.addColorStop(0, 'rgba(99, 179, 237, 0.1)');
        gradient.addColorStop(0.5, 'rgba(99, 179, 237, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 179, 237, 0.1)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(conn.from.x, conn.from.y);
        ctx.lineTo(conn.to.x, conn.to.y);
        ctx.stroke();

        // Animated data packet
        const packetX = conn.from.x + (conn.to.x - conn.from.x) * progress;
        const packetY = conn.from.y + (conn.to.y - conn.from.y) * progress;
        
        // Glow effect for packet
        const glowGradient = ctx.createRadialGradient(packetX, packetY, 0, packetX, packetY, 8);
        glowGradient.addColorStop(0, 'rgba(99, 179, 237, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(99, 179, 237, 0.3)');
        glowGradient.addColorStop(1, 'rgba(99, 179, 237, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(packetX, packetY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Packet core
        ctx.fillStyle = 'rgba(99, 179, 237, 1)';
        ctx.beginPath();
        ctx.arc(packetX, packetY, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes with pulse effect
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulseDelay * Math.PI) * 0.3 + 0.7;
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 3);
        glowGradient.addColorStop(0, `rgba(167, 139, 250, ${0.6 * pulse * node.glowIntensity})`);
        glowGradient.addColorStop(0.5, `rgba(99, 179, 237, ${0.3 * pulse * node.glowIntensity})`);
        glowGradient.addColorStop(1, 'rgba(99, 179, 237, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Node gradient
        const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size);
        nodeGradient.addColorStop(0, 'rgba(99, 179, 237, 1)');
        nodeGradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.9)');
        nodeGradient.addColorStop(1, 'rgba(45, 212, 191, 0.8)');
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Node border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
        ctx.stroke();
      });

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
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none" />
    </motion.div>
  );
};

export default WorldMap;
