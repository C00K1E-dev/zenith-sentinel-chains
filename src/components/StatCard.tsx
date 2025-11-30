import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  delay?: number;
}

const StatCard = memo(({ title, value, icon: Icon, description }: StatCardProps) => {
  return (
    <div className="glass-card-hover p-4 sm:p-5 md:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Icon size={20} className="sm:w-6 sm:h-6 text-primary" />
        </div>
      </div>

      <h3 className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{title}</h3>
      <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1 break-words">{value}</p>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
