import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import aidaLogo from '@/assets/aida.svg';

const Vision = () => {
  const [hoveredIndustry, setHoveredIndustry] = useState<string | null>(null);

  const industries = [
    'Financial Services',
    'Telecommunications',
    'Healthcare',
    'Travel & Hospitality',
    'Media',
    'Retail',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="relative z-10 mb-16 sm:mb-20">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 neon-glow">
          Our Vision
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          We plan to launch specialized AI agents across key industries
        </p>
      </motion.div>

      <div className="glass-card p-4 sm:p-6 md:p-8 lg:p-12 neon-border">
        {/* Top Section - Title & Image Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-start mb-8 sm:mb-10 md:mb-12">
          {/* Left - Title & Description */}
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Zap className="text-primary flex-shrink-0 mt-1" size={24} sm-size={28} md-size={32} />
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-orbitron font-bold mb-2 sm:mb-3">
                  End-to-End AI Agent Infrastructure
                </h3>
                <p className="text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground leading-relaxed">
                  A robust, enterprise-ready solution delivering cutting-edge capabilities for building, managing, and optimizing intelligent AI agents across any scale. Empower teams to create, deploy, and refine next-generation autonomous agents with unmatched precision.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center order-1 lg:order-2"
          >
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl">
              <img
                src="/assets/vision.png"
                alt="Our Vision"
                className="w-full h-auto object-contain drop-shadow-2xl rounded-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Industries + Trained By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Industries Column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="sm:col-span-2 lg:col-span-2"
          >
            <h4 className="text-base sm:text-lg md:text-xl font-orbitron font-bold mb-4 sm:mb-5 md:mb-6 text-primary uppercase tracking-wide">
              🎯 Target Industries
            </h4>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 relative"
            >
              {industries.map((industry, index) => {
                const isHealthcare = industry === 'Healthcare';
                const isHovered = hoveredIndustry === industry;

                return (
                  <div key={index} className="relative">
                    <motion.div
                      variants={itemVariants}
                      onMouseEnter={() => isHealthcare && setHoveredIndustry(industry)}
                      onMouseLeave={() => setHoveredIndustry(null)}
                      className={`group p-2 sm:p-3 md:p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                        isHealthcare
                          ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/50 hover:border-emerald-400 hover:from-emerald-900/40 hover:to-emerald-800/30 ring-2 ring-emerald-500/30'
                          : 'bg-gradient-to-br from-muted/50 to-muted/30 border-primary/20 hover:border-primary/60 hover:from-primary/10 hover:to-primary/5'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2 min-h-12">
                        <span className="text-xs sm:text-sm md:text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {industry}
                        </span>
                        {isHealthcare && (
                          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                            In Development
                          </span>
                        )}
                      </div>
                    </motion.div>

                    {/* Popup on Hover */}
                    {isHealthcare && isHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
                      >
                        <div className="glass-card p-4 sm:p-6 rounded-lg border border-emerald-500/50 shadow-2xl w-max max-w-xs sm:max-w-sm">
                          <div className="flex flex-col items-center gap-3">
                            <img
                              src={aidaLogo}
                              alt="AIDA Logo"
                              className="w-32 h-32 sm:w-48 sm:h-48 object-contain"
                            />
                            <div className="text-center">
                              <h4 className="font-orbitron font-bold text-sm sm:text-base text-emerald-400 mb-1">
                                AIDA
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Artificial Intelligence for Doctors and Assistants
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Trained By Column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <div className="p-3 sm:p-4 md:p-5 lg:p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 border border-primary/40 rounded-lg h-full flex flex-col justify-center">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-widest">
                Trained by
              </p>
              <p className="text-base sm:text-lg md:text-xl lg:text-xl font-orbitron font-bold text-foreground mb-2">
                SmartSentinels
              </p>
              <p className="text-xs sm:text-xs md:text-sm lg:text-xs text-muted-foreground leading-relaxed">
                Industry-specific AI agents powered by our decentralized intelligence network
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Vision;
