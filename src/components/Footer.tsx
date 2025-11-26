import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTiktok, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Github, Linkedin } from 'lucide-react';
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
  const socialLinks = [
    { icon: TwitterIcon, label: 'X (Twitter)', href: 'https://x.com/SmartSentinels_' },
    { icon: TelegramIcon, label: 'Telegram', href: 'https://t.me/SmartSentinelsCommunity' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/smartsentinels/' },
    { icon: TikTokIcon, label: 'TikTok', href: 'https://www.tiktok.com/@smartsentinels_official' },
  ];

  return (
    <footer className="glass-card border-t neon-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <div className="flex items-center space-x-2 mb-3 sm:mb-2">
              <img src={ssIcon} alt="SmartSentinels" className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="font-orbitron font-bold text-foreground text-sm sm:text-base">SmartSentinels</span>
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
                  href="/documents/SmartSentinels - Intellectual Property Rights.pdf"
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
                  className="glass-card-hover p-2 sm:p-3 rounded-lg"
                >
                  <Icon size={18} className="sm:w-5 sm:h-5 text-muted-foreground hover:text-primary transition-colors" />
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
