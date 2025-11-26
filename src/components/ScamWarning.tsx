import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OFFICIAL_DOMAIN = 'smartsentinels.net';

// Permanent banner shown to ALL users (non-intrusive)
const OfficialSiteBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('official_banner_dismissed')) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('official_banner_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r from-green-900/95 to-emerald-900/95 backdrop-blur-sm border-b border-green-500/30 px-4 py-2"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-green-100">
            <strong className="text-green-400">Official Website:</strong> You are on <strong>smartsentinels.net</strong> - the only legitimate SmartSentinels site.
          </span>
          <span className="text-yellow-400 text-xs hidden sm:inline">
            ⚠️ Beware of copycat sites like .xyz or .io
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-green-300 hover:text-white transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const ScamWarning = () => {
  // Only show the official site banner
  // This tells users they're on the real site, regardless of how they got here
  return <OfficialSiteBanner />;
};

export default ScamWarning;
