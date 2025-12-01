import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, Rocket } from 'lucide-react';
import { memo } from 'react';
import road_map_data from '@/data/roadmap';

const Roadmap = memo(() => {
  const getStatusIcon = (index: number) => {
    if (index === 0) return <Clock size={16} className="text-primary" />;
    if (index < 3) return <Rocket size={16} className="text-primary" />;
    return <CheckCircle size={16} className="text-muted-foreground" />;
  };

  const getStatusColor = (index: number) => {
    if (index === 0) return 'border-primary bg-primary/5';
    if (index < 3) return 'border-primary/50 bg-primary/5';
    return 'border-muted-foreground/20 bg-muted/5';
  };

  return (
    <section id="roadmap" className="py-12 sm:py-16">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Our strategic journey to revolutionize decentralized AI infrastructure
          </p>
        </motion.div>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {road_map_data.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="h-full"
            >
              <div className={`glass-card-hover p-4 sm:p-6 h-full flex flex-col border-2 ${getStatusColor(index)} transition-all duration-300 hover:shadow-lg hover:shadow-primary/10`}>
                {/* Status Icon & Quarter */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(index)}
                    <span className="text-xs font-display font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {item.sub_title}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Phase {index + 1}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-display font-semibold text-foreground mb-2 sm:mb-3 leading-tight flex-grow">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-grow">
                  {item.desc}
                </p>

                {/* Progress Indicator */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${index === 0 ? 'text-primary' : index < 3 ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      {index === 0 ? 'In Progress' : index < 3 ? 'Upcoming' : 'Planned'}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i <= index ? 'bg-primary' : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-8 sm:mt-12"
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            Stay updated with our latest developments
          </p>
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary">
            <Clock size={14} />
            <span>Last updated: October 2025</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default Roadmap;