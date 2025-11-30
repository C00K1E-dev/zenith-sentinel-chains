import { motion } from 'framer-motion';
import { Zap, Phone, Calendar, Bell, AlertTriangle, MessageSquare, ExternalLink } from 'lucide-react';
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
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Our Vision
          </span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          We plan to launch specialized AI agents across key industries
        </p>
      </motion.div>

      <div className="glass-card p-4 sm:p-6 md:p-8 lg:p-12 neon-border">
        {/* Main Section - Content & Image Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center mb-12 md:mb-16">
          {/* Left - Rich Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-6 md:space-y-8"
          >
            {/* Main Title */}
            <div className="flex items-start gap-4">
              <Zap className="text-primary flex-shrink-0 mt-1" size={32} />
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2 leading-tight">
                  End-to-End AI Agent Infrastructure
                </h3>
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  Enterprise-Ready Autonomous Intelligence
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                A robust, enterprise-ready solution delivering cutting-edge capabilities for building, managing, and optimizing intelligent AI agents across any scale.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Empower teams to create, deploy, and refine next-generation autonomous agents with unmatched precision and industry-specific expertise.
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm text-foreground">Multi-chain deployment across major blockchains</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                <span className="text-sm text-foreground">Real-time monitoring and autonomous optimization</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span className="text-sm text-foreground">Industry-specific customization & fine-tuning</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm text-foreground">Decentralized governance and community control</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Large Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center relative"
          >
            <div className="w-full max-w-full h-96 sm:h-[480px] md:h-[500px] lg:h-[550px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 rounded-2xl blur-2xl z-0" />
              <img
                src="/assets/pouwGlobe.png"
                alt="Global Vision"
                className="relative w-full h-full object-contain animate-float drop-shadow-xl z-10 rounded-2xl"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Industries + Trained By with Divider */}
        <div className="border-t border-primary/20 pt-10 md:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {/* Industries Column */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <h4 className="text-lg md:text-xl font-orbitron font-bold mb-6 md:mb-8 text-primary uppercase tracking-wider flex items-center gap-3">
                <span className="text-2xl">🎯</span> Target Industries
              </h4>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 relative"
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
                      className={`group p-3 md:p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                        isHealthcare
                          ? 'bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 border-emerald-500/60 hover:border-emerald-400 hover:from-emerald-900/50 hover:to-emerald-800/40 ring-2 ring-emerald-500/40 animate-pulse-subtle shadow-lg shadow-emerald-500/20'
                          : 'bg-gradient-to-br from-muted/60 to-muted/40 border-primary/30 hover:border-primary/70 hover:from-primary/15 hover:to-primary/10 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 min-h-14 md:min-h-16">
                        {isHealthcare && (
                          <span className="absolute -top-2 -right-2 flex h-5 w-5 md:h-6 md:w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 md:h-6 md:w-6 bg-emerald-500 items-center justify-center">
                              <span className="text-[10px] md:text-xs text-white font-bold">!</span>
                            </span>
                          </span>
                        )}
                        <span className={`text-xs md:text-sm font-semibold transition-colors line-clamp-2 text-center ${isHealthcare ? 'text-emerald-300 group-hover:text-emerald-200' : 'text-foreground group-hover:text-primary'}`}>
                          {industry}
                        </span>
                        {isHealthcare && (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs md:text-xs font-medium text-emerald-400 uppercase tracking-wider">
                              Live Demo
                            </span>
                            <span className="text-[10px] text-emerald-500/70">Click to preview</span>
                          </div>
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
                        onMouseEnter={() => setHoveredIndustry(industry)}
                        onMouseLeave={() => setHoveredIndustry(null)}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 z-50 max-[425px]:left-0 max-[425px]:translate-x-0 max-[425px]:-translate-x-1/4"
                      >
                        <div className="bg-[#1a1a1a] p-3 sm:p-5 rounded-xl border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 w-64 sm:w-80">
                          {/* Header */}
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 pb-3 border-b border-emerald-500/20">
                            <img
                              src={aidaLogo}
                              alt="AIDA Logo"
                              className="w-16 h-16 sm:w-28 sm:h-28 object-contain"
                            />
                            <div>
                              <h4 className="font-orbitron font-bold text-sm sm:text-lg text-emerald-400">
                                AIDA
                              </h4>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                AI for Doctors & Assistants
                              </p>
                            </div>
                          </div>
                          
                          {/* Features */}
                          <div className="space-y-1.5 sm:space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-[11px] sm:text-sm">
                              <Phone size={12} className="text-emerald-400 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                              <span className="text-muted-foreground">24/7 Reception</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-sm">
                              <Calendar size={12} className="text-emerald-400 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                              <span className="text-muted-foreground">Smart Appointments</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-sm">
                              <Bell size={12} className="text-emerald-400 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                              <span className="text-muted-foreground">Auto Reminders</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-sm">
                              <AlertTriangle size={12} className="text-orange-400 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                              <span className="text-muted-foreground">Emergency Triage</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-sm">
                              <MessageSquare size={12} className="text-emerald-400 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                              <span className="text-muted-foreground">WhatsApp Integration</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <div className="bg-emerald-500/10 rounded-lg p-1.5 sm:p-2 text-center">
                              <div className="text-xs sm:text-base font-bold text-emerald-400">24/7</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Availability</div>
                            </div>
                            <div className="bg-emerald-500/10 rounded-lg p-1.5 sm:p-2 text-center">
                              <div className="text-xs sm:text-base font-bold text-emerald-400">80%</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Task Automation</div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-lg border border-emerald-500/30 mb-2 sm:mb-3">
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-emerald-400">Alpha Testing • Romania</span>
                          </div>

                          {/* Demo Button */}
                          <a 
                            href="https://aida-lac.vercel.app/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 sm:py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold rounded-lg transition-colors"
                          >
                            <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]" />
                            See Live Demo
                          </a>
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
            className="lg:col-span-3"
          >
            <div className="space-y-6 md:space-y-8">

              {/* Trained By Box */}
              <div className="p-5 md:p-6 bg-gradient-to-br from-accent/15 via-accent/5 to-primary/10 border border-accent/40 rounded-lg col-span-full">
                <p className="text-xs font-semibold text-accent mb-2 uppercase tracking-widest">
                  Trained by
                </p>
                <p className="text-xl md:text-2xl font-orbitron font-bold text-foreground mb-3">
                  SmartSentinels
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Industry-specific AI agents powered by our decentralized intelligence network and real-time optimization protocols.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default Vision;
