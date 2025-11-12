import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Megaphone } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Roadmap', path: '#roadmap' },
    { name: 'Team', path: '#team' },
    { name: 'Documents', path: '/documents' },
    { name: 'Hub', path: '/hub' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('#')) {
      return location.hash === path;
    }
    return location.pathname === path;
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (path.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Update URL hash without triggering navigation
        window.history.pushState(null, '', path);
      }
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b neon-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/ss-icon.svg" 
              alt="SmartSentinels Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
            <span className="font-orbitron font-bold text-base sm:text-lg lg:text-xl text-foreground neon-glow">
              SmartSentinels
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navLinks.map((link) => {
              if (link.name === 'Hub') {
                return (
                  <div key={link.name} className="flex items-center gap-3">
                    {/* News Icon Button */}
                    <Link
                      to="/news"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-primary hover:text-primary hover:bg-primary/10 neon-glow shadow-[0_0_15px_rgba(248,244,66,0.3)] hover:shadow-[0_0_25px_rgba(248,244,66,0.5)]"
                      title="News & Announcements"
                    >
                      <Megaphone size={20} />
                    </Link>
                    <Link
                      to={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(248,244,66,0.5)] hover:shadow-[0_0_30px_rgba(248,244,66,0.7)] font-orbitron font-bold transition-all duration-200"
                    >
                      <span className="text-primary-foreground font-orbitron font-bold text-xs lg:text-sm neon-glow">
                        {link.name}
                      </span>
                    </Link>
                  </div>
                );
              }

              if (link.path.startsWith('#')) {
                return (
                  <a
                    key={link.name}
                    href={link.path}
                    onClick={(e) => handleNavClick(link.path, e)}
                    className="transition-colors duration-200 text-primary hover:text-primary neon-glow text-sm lg:text-base"
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className="transition-colors duration-200 text-primary hover:text-primary neon-glow text-sm lg:text-base"
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/news"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-primary hover:text-primary hover:bg-primary/10 neon-glow shadow-[0_0_15px_rgba(248,244,66,0.3)] hover:shadow-[0_0_25px_rgba(248,244,66,0.5)]"
              title="News & Announcements"
            >
              <Megaphone size={20} />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg glass-card"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-card border-t border-white/10">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => {
              if (link.name === 'Hub') {
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors duration-200"
                  >
                    <span className="text-primary-foreground font-orbitron font-bold text-sm neon-glow">
                      {link.name}
                    </span>
                  </Link>
                );
              }

              if (link.path.startsWith('#')) {
                return (
                  <a
                    key={link.name}
                    href={link.path}
                    onClick={(e) => handleNavClick(link.path, e)}
                    className="block px-4 py-2.5 rounded-lg transition-colors text-primary hover:bg-white/5 neon-glow text-sm text-center"
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  target={link.name === 'Hub' ? '_blank' : undefined}
                  rel={link.name === 'Hub' ? 'noopener noreferrer' : undefined}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 rounded-lg transition-colors text-primary hover:bg-white/5 neon-glow text-sm text-center"
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
