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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-8 group"
    >
      {icon && (
        <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}
      <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-4">
        {title}
      </h3>
      <p className="text-base text-muted-foreground leading-relaxed">
        {content}
      </p>
    </motion.div>
  );
});

ContentCard.displayName = 'ContentCard';

export default ContentCard;
