import { motion } from 'framer-motion';
import { HardDrive, Sparkles, Cpu, Monitor, Cloud, Settings, Plus, Play, Pause, Square } from 'lucide-react';
import StatCard from '@/components/StatCard';

interface DeviceCardProps {
  name: string;
  type: string;
  status: 'running' | 'idle' | 'stopped';
  earnings: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
}

const DeviceCard = ({ name, type, status, earnings, icon: Icon }: DeviceCardProps) => {
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
            <h3 className="font-orbitron font-semibold text-sm">{name}</h3>
            <p className="text-xs text-foreground">{type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor}`}>
          <StatusIcon size={12} className={config.color} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-foreground">Earnings (24h)</span>
        <span className="text-sm font-orbitron font-bold text-primary">{earnings}</span>
      </div>
      <div className="flex gap-2">
        <button
          disabled
          className="flex-1 px-3 py-2 bg-primary/20 text-primary/60 border border-primary/30 rounded-lg font-orbitron text-xs cursor-not-allowed"
        >
          Manage
        </button>
        <button
          disabled
          className="px-3 py-2 bg-muted/20 text-muted-foreground/60 border border-muted/30 rounded-lg cursor-not-allowed"
        >
          <Settings size={14} />
        </button>
      </div>
    </motion.div>
  );
};

const SidebarMyDevices = () => {
  const myDevices = [
    {
      name: 'Gaming Rig Alpha',
      type: 'AMD Ryzen 9 7950X + RTX 4090',
      status: 'running' as const,
      earnings: '45 SSTL',
      icon: Monitor
    },
    {
      name: 'Jetson Orin NX',
      type: 'NVIDIA Edge AI Device',
      status: 'idle' as const,
      earnings: '12 SSTL',
      icon: Cpu
    },
    {
      name: 'Cloud Instance Beta',
      type: 'AWS EC2 P4d (A100)',
      status: 'running' as const,
      earnings: '89 SSTL',
      icon: Cloud
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
            <HardDrive size={24} className="text-secondary" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-orbitron font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">My Devices</span>
            </h2>
            <span className="px-3 py-1 text-xs font-orbitron font-bold bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full text-primary">
              SOON
            </span>
          </div>
        </div>
        <div className="glass-card p-4 mb-6 bg-blue-500/5 border-blue-500/20">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-blue-400">Preview Mode:</span> These are example devices showing how this feature will look like. Device registration and management will be available in Q2/Q3 2026. Subject to change in accordance to development.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <StatCard
              title="Registered Devices"
              value="3"
              icon={HardDrive}
              description="Active devices"
              iconColor="secondary"
              delay={0.1}
            />
          </div>
          <div>
            <StatCard
              title="Total Earnings"
              value="146 SSTL"
              icon={Sparkles}
              description="Last 24 hours"
              iconColor="primary"
              delay={0.2}
            />
          </div>
          <div>
            <StatCard
              title="Active Now"
              value="2"
              icon={Play}
              description="Running devices"
              iconColor="primary"
              delay={0.3}
            />
          </div>
          <div>
            <StatCard
              title="Avg. Uptime"
              value="94%"
              icon={Cpu}
              description="This month"
              iconColor="accent"
              delay={0.4}
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-orbitron font-semibold text-foreground">
            Device Management
          </h3>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary/60 border border-primary/30 rounded-lg font-orbitron text-sm cursor-not-allowed"
          >
            <Plus size={16} />
            Add Device
          </button>
        </div>

        <div className="grid gap-4">
          {myDevices.map((device, index) => (
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-card p-6 text-center cursor-not-allowed"
        >
          <h3 className="font-orbitron font-bold text-lg mb-2 text-foreground">
            Device Registration
          </h3>
          <p className="text-foreground text-sm mb-4">
            Register and manage your devices to run AI agents, earn rewards through Proof of Useful Work (PoUW), and contribute to network security.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                <HardDrive size={16} className="text-secondary" />
              </div>
              <span className="text-sm text-foreground">Device Mining</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">PoUW Rewards</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">Coming Q2/Q3 2026</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SidebarMyDevices;