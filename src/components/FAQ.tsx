import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { memo } from 'react';
import faq_data from '@/data/faq';

const FAQ = memo(() => {
  const [activeTab, setActiveTab] = useState('home_1');

  // Filter FAQs by active tab
  const filteredFaqs = faq_data.filter(faq => faq.page === activeTab);

  const tabs = [
    { id: 'home_1', label: 'Token & Technology', description: 'Learn about SSTL tokens, PoUW, and AI agents' },
    { id: 'home_2', label: 'Getting Started', description: 'Basics about SmartSentinels and participation' }
  ];

  return (
    <>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-bold mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Everything you need to know about SmartSentinels, SSTL tokens, and Proof of Useful Work
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10 md:mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'glass-card-hover border-primary/50 bg-primary/5'
                  : 'glass-card hover:bg-white/5'
              }`}
            >
              <div className="text-center">
                <h3 className={`text-base sm:text-lg md:text-xl font-orbitron font-bold mb-1 sm:mb-2 ${
                  activeTab === tab.id ? 'text-primary neon-glow' : 'text-foreground'
                }`}>
                  {tab.label}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {tab.description}
                </p>
              </div>
            </button>
          ))}
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          key={activeTab} // Re-animate when tab changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${faq.id}`}
                className="glass-card-hover border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden"
              >
                <AccordionTrigger className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 text-left hover:no-underline group">
                  <div className="flex items-start gap-3 sm:gap-4 w-full">
                    <HelpCircle size={20} className="sm:w-6 sm:h-6 text-primary mt-0.5 sm:mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-orbitron font-bold text-foreground group-hover:text-primary transition-colors pr-3 sm:pr-4">
                        {faq.title}
                      </h3>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                  <div className="ml-7 sm:ml-9 md:ml-10">
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                      {faq.desc}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 sm:mt-12 md:mt-16"
        >
          <div className="glass-card-hover p-8 sm:p-10 md:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="relative space-y-6">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-orbitron font-bold mb-4">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Still Have Questions?
                </span>
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our community and team are here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a
                  href="https://t.me/SmartSentinelsCommunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-orbitron font-bold shadow-lg hover:shadow-primary/25 transition-all duration-300 text-base sm:text-lg"
                >
                  Join Telegram
                </a>
                <a
                  href="mailto:support@smartsentinels.ai"
                  className="px-8 py-4 rounded-xl border-2 border-primary/30 hover:border-primary/50 text-foreground font-orbitron font-bold hover:bg-primary/10 transition-all duration-300 text-base sm:text-lg"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </motion.div>
    </>
  );
});

export default FAQ;