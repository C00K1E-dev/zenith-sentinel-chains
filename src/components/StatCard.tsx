import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  delay?: number;
  iconColor?: 'primary' | 'secondary' | 'accent';
}

const StatCard = memo(({ title, value, icon: Icon, description, iconColor = 'primary' }: StatCardProps) => {
  // Map icon colors to background and text colors
  const colorMap = {
    primary: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary' },
    secondary: { bg: 'bg-secondary/10', border: 'border-secondary/20', text: 'text-secondary' },
    accent: { bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent' },
  };
  
  const colors = colorMap[iconColor];
  
  return (
    <div className="glass-card-hover p-4 sm:p-5 md:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon size={20} className={`sm:w-6 sm:h-6 ${colors.text}`} />
        </div>
      </div>

      <h3 className="text-xs sm:text-sm text-foreground mb-1 sm:mb-2">{title}</h3>
      <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1 break-words">{value}</p>

      {description && (
        <p className="text-xs text-foreground">{description}</p>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
