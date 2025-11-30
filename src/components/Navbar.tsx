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
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-all" />
              <img 
                src="/ss-icon.svg" 
                alt="SmartSentinels Logo" 
                className="relative w-10 h-10 sm:w-12 sm:h-12"
              />
            </div>
            <span className="font-display font-bold text-xl lg:text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SmartSentinels
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (link.name === 'Hub') {
                return (
                  <div key={link.name} className="flex items-center gap-4">
                    {/* News Icon Button */}
                    <Link
                      to="/news"
                      className="flex items-center justify-center p-2.5 rounded-xl transition-all duration-300 text-primary hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30"
                      title="News & Announcements"
                    >
                      <Megaphone size={20} />
                    </Link>
                    <Link
                      to={link.path}
                      className="flex items-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-display font-semibold shadow-lg hover:shadow-primary/25 transition-all duration-300"
                    >
                      {link.name}
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
                    className="text-foreground/80 hover:text-primary font-medium transition-colors duration-300 relative group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                  </a>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-foreground/80 hover:text-primary font-medium transition-colors duration-300 relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <Link
              to="/news"
              className="flex items-center justify-center p-2 rounded-xl transition-all duration-300 text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30"
              title="News & Announcements"
            >
              <Megaphone size={20} />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl backdrop-blur-sm bg-card/50 border border-border/30 hover:border-primary/30 transition-all"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden backdrop-blur-xl bg-background/95 border-t border-border/50">
          <div className="px-6 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => {
              if (link.name === 'Hub') {
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-display font-semibold shadow-lg transition-all duration-300"
                  >
                    {link.name}
                  </Link>
                );
              }

              if (link.path.startsWith('#')) {
                return (
                  <a
                    key={link.name}
                    href={link.path}
                    onClick={(e) => handleNavClick(link.path, e)}
                    className="block px-6 py-3 rounded-xl text-foreground hover:text-primary hover:bg-primary/5 font-medium transition-all text-center border border-transparent hover:border-primary/20"
                  >
                    {link.name}
                  </a>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-6 py-3 rounded-xl text-foreground hover:text-primary hover:bg-primary/5 font-medium transition-all text-center border border-transparent hover:border-primary/20"
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
