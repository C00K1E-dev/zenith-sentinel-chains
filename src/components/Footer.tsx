import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTiktok, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Github, Linkedin } from 'lucide-react';
import { useState, useEffect } from 'react';
const ssIcon = "/ss-icon.svg";

// Twitter Icon Component
const TwitterIcon = ({ size, className }: { size?: number; className?: string }) => (
  <FontAwesomeIcon icon={faXTwitter} className={className} />
);

// TikTok Icon Component
const TikTokIcon = ({ size, className }: { size?: number; className?: string }) => (
  <FontAwesomeIcon icon={faTiktok} className={className} />
);

// Telegram Icon Component
const TelegramIcon = ({ size, className }: { size?: number; className?: string }) => (
  <FontAwesomeIcon icon={faTelegram} className={className} />
);

const Footer = () => {
  const [tickerDismissed, setTickerDismissed] = useState(false);
  
  useEffect(() => {
    // Listen for custom event when ticker is dismissed
    const handleTickerDismissed = () => {
      console.log('[FOOTER] Received ticker dismissed event');
      setTickerDismissed(true);
    };
    
    window.addEventListener('securityTickerDismissed', handleTickerDismissed);
    console.log('[FOOTER] Event listener added');
    
    return () => {
      window.removeEventListener('securityTickerDismissed', handleTickerDismissed);
    };
  }, []);
  
  const socialLinks = [
    { icon: TwitterIcon, label: 'X (Twitter)', href: 'https://x.com/SmartSentinels_' },
    { icon: TelegramIcon, label: 'Telegram', href: 'https://t.me/SmartSentinelsCommunity' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/smartsentinels/' },
    { icon: TikTokIcon, label: 'TikTok', href: 'https://www.tiktok.com/@smartsentinels_official' },
  ];

  return (
    <footer 
      className="backdrop-blur-xl bg-card/60 border-t border-border/50 mt-20 transition-all duration-300"
      style={{ marginBottom: tickerDismissed ? '0' : '2.2rem' }}
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
                <img src={ssIcon} alt="SmartSentinels" className="relative w-9 h-9 sm:w-10 sm:h-10" />
              </div>
              <span className="font-display font-bold text-foreground text-base sm:text-lg">SmartSentinels</span>
            </div>
            <div className="flex flex-col items-center md:items-start space-y-3 md:space-y-2 w-full">
              <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
                © SmartSentinels 2025 — All Rights Reserved
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6 flex-wrap justify-center md:justify-start">
                <a
                  href="/documents/Terms and Conditions.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  Terms and Conditions
                </a>
                <a
                  href="/documents/Privacy Policy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  Privacy Policy
                </a>
                <a
                  href="/documents/Disclaimer.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  Disclaimer
                </a>
                <a
                  href="/documents/License.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  IP Rights
                </a>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card-hover p-3 rounded-xl hover:scale-110 transition-all duration-300"
                >
                  <Icon size={20} className="text-muted-foreground hover:text-primary transition-colors" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
