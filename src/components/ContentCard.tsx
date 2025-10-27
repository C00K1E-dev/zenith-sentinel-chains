import { motion } from 'framer-motion';
import { ReactNode, memo } from 'react';

interface ContentCardProps {
  title: string;
  content: string;
  delay?: number;
  icon?: ReactNode;
}

const ContentCard = memo(({ title, content, delay = 0, icon }: ContentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
      className="glass-card-hover p-5 sm:p-6 md:p-8"
    >
      {icon && (
        <div className="mb-3 sm:mb-4 text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-lg sm:text-xl md:text-2xl font-orbitron font-bold text-foreground mb-3 sm:mb-4 neon-glow">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {content}
      </p>
    </motion.div>
  );
});

ContentCard.displayName = 'ContentCard';

export default ContentCard;
