import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { memo } from 'react';
import founder_data from '@/data/team';

const Team = memo(() => {
  return (
    <section id="team" className="py-12 sm:py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-bold mb-3 sm:mb-4 neon-glow">
            Our Team
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Meet the visionaries driving SmartSentinels forward - experts in AI, blockchain, and decentralized systems
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
          {founder_data.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="w-full max-w-sm"
            >
              <div className="glass-card-hover p-4 sm:p-6 text-center group">
                {/* Profile Image */}
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/30 group-hover:border-primary/50 transition-all duration-300">
                    <img
                      src={member.thumb}
                      alt={`${member.title} - ${member.designasion}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Member Info */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-orbitron font-bold text-foreground neon-glow">
                    {member.title}
                  </h3>
                  <p className="text-primary font-semibold text-xs sm:text-sm md:text-base">
                    {member.designasion}
                  </p>

                  {/* Social Links */}
                  <div className="flex justify-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card-hover p-2 rounded-full text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                        aria-label={`${member.title} LinkedIn`}
                      >
                        <Linkedin size={18} className="sm:w-5 sm:h-5" />
                      </a>
                    )}
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card-hover p-2 rounded-full text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                        aria-label={`${member.title} Twitter`}
                      >
                        <FontAwesomeIcon icon={faXTwitter} className="text-lg sm:text-xl" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Join Team CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12 sm:mt-16"
        >
          <div className="glass-card-hover p-6 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-orbitron font-bold text-foreground mb-3 sm:mb-4 neon-glow">
              Join Our Mission
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
              We're always looking for talented individuals who share our vision of decentralized AI. If you're passionate about blockchain, AI, or Web3, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="mailto:team@smartsentinels.ai"
                className="glass-card-hover px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary/20 text-primary font-orbitron font-bold hover:bg-primary/30 transition-all duration-300 text-sm sm:text-base"
              >
                Contact Us
              </a>
              <Link
                to="/hub"
                className="glass-card-hover px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-primary/30 text-primary font-orbitron font-bold hover:bg-primary/10 transition-all duration-300 text-sm sm:text-base"
              >
                Explore Opportunities
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default Team;