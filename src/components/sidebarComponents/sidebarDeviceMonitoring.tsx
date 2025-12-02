import { motion } from 'framer-motion';
import { HardDrive, Cpu, Cloud, Monitor, Play, Pause, Square } from 'lucide-react';
import StatCard from '@/components/StatCard';

interface DeviceCardProps {
  name: string;
  type: string;
  status: 'running' | 'idle' | 'stopped';
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  info?: string;
}

const DeviceCard = ({ name, type, status, icon: Icon, info }: DeviceCardProps) => {
  const statusConfig = {
    running: { color: 'text-green-400', bgColor: 'bg-green-400/20', icon: Play, label: 'Running' },
    idle: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', icon: Pause, label: 'Idle' },
    stopped: { color: 'text-red-400', bgColor: 'bg-red-400/20', icon: Square, label: 'Stopped' }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-4 cursor-not-allowed"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-primary" />
          <div>
            <h3 className="font-orbitron font-semibold text-sm text-foreground">{name}</h3>
            <p className="text-xs text-foreground">{type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor}`}>
          <StatusIcon size={12} className={config.color} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>
      {info && (
        <div className="text-xs text-foreground bg-primary/10 p-2 rounded border border-primary/20">
          {info}
        </div>
      )}
    </motion.div>
  );
};

const SidebarDeviceMonitoring = () => {
  const devices = [
    {
      name: 'Google Cloud A100',
      type: 'Cloud AI Server',
      status: 'running' as const,
      icon: Cloud,
      info: 'SmartSentinels AI is running and deployed on Google Cloud'
    },
    {
      name: 'Jetson Orin NX',
      type: 'NVIDIA Edge AI',
      status: 'stopped' as const,
      icon: Cpu
    },
    {
      name: 'AWS EC2 P4d',
      type: 'Cloud GPU Server',
      status: 'stopped' as const,
      icon: Cloud
    },
    {
      name: 'AMD Ryzen 9 7950X',
      type: 'AMD PC with NPU',
      status: 'stopped' as const,
      icon: Monitor
    }
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
            <Monitor size={24} className="text-secondary" />
          </div>
          <h2 className="text-2xl font-orbitron font-bold">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Device Monitoring
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <StatCard
              title="Total Devices"
              value="4"
              icon={HardDrive}
              iconColor="secondary"
            />
          </div>
          <div>
            <StatCard
              title="Active Devices"
              value="1"
              icon={Play}
              iconColor="primary"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-orbitron font-semibold mb-4 text-foreground">
          Device Fleet
        </h3>
        <div className="grid gap-4">
          {devices.map((device, index) => (
            <motion.div
              key={device.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <DeviceCard {...device} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SidebarDeviceMonitoring;