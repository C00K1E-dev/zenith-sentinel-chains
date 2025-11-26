import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// List of known copycat/scam domains
const SUSPICIOUS_DOMAINS = [
  'smartsentinels.xyz',
  'smartsentinel.xyz',
  'smartsentinels.io',
  'smartsentinel.io',
  'smart-sentinels.com',
  'smartsentinels.org',
];

const OFFICIAL_DOMAIN = 'smartsentinels.net';
const WARNING_STORAGE_KEY = 'scam_warning_dismissed';
const SUSPICIOUS_REFERRER_KEY = 'suspicious_referrer';
const BANNER_STORAGE_KEY = 'official_banner_dismissed';

// Big red warning modal for users coming from scam sites
const ScamWarningModal = ({ referrerDomain, onDismiss }: { referrerDomain: string; onDismiss: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-red-950 border-2 border-red-500 rounded-xl p-6 max-w-lg mx-4 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Security Warning
            </h2>
            <p className="text-white mb-3">
              You were redirected from a <strong className="text-red-400">suspicious website</strong>:
            </p>
            <code className="block bg-red-900/50 px-3 py-2 rounded text-red-300 mb-4 break-all">
              {referrerDomain}
            </code>
            <p className="text-gray-300 mb-4">
              This is <strong>NOT</strong> an official SmartSentinels website. 
              It may be a scam attempting to steal your funds or information.
            </p>
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 mb-4">
              <p className="text-green-400 text-sm">
                ✅ The only official website is: <strong>smartsentinels.net</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                I Understand
              </button>
              <a
                href="https://smartsentinels.net"
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg text-center transition-colors"
              >
                Go to Official Site
              </a>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Green banner shown to ALL users
const OfficialSiteBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    if (sessionStorage.getItem(BANNER_STORAGE_KEY)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(BANNER_STORAGE_KEY, 'true');
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
  const [showWarning, setShowWarning] = useState(false);
  const [referrerDomain, setReferrerDomain] = useState('');

  useEffect(() => {
    // Check if warning was already dismissed
    if (sessionStorage.getItem(WARNING_STORAGE_KEY)) {
      return;
    }

    // Check for stored suspicious referrer
    const storedReferrer = sessionStorage.getItem(SUSPICIOUS_REFERRER_KEY);
    if (storedReferrer) {
      setReferrerDomain(storedReferrer);
      setShowWarning(true);
      return;
    }

    // Check current referrer
    const referrer = document.referrer;
    if (referrer) {
      try {
        const url = new URL(referrer);
        const domain = url.hostname.toLowerCase();
        
        const isSuspicious = SUSPICIOUS_DOMAINS.some(
          suspicious => domain === suspicious || domain.endsWith('.' + suspicious)
        );
        
        if (isSuspicious) {
          sessionStorage.setItem(SUSPICIOUS_REFERRER_KEY, domain);
          setReferrerDomain(domain);
          setShowWarning(true);
          console.warn(`[SECURITY] User arrived from suspicious domain: ${domain}`);
        }
      } catch (e) {
        // Invalid referrer URL
      }
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(WARNING_STORAGE_KEY, 'true');
    sessionStorage.removeItem(SUSPICIOUS_REFERRER_KEY);
    setShowWarning(false);
  };

  return (
    <>
      {/* Always show green banner to educate users */}
      <OfficialSiteBanner />
      
      {/* Show red warning if user came from scam site */}
      <AnimatePresence>
        {showWarning && (
          <ScamWarningModal 
            referrerDomain={referrerDomain} 
            onDismiss={handleDismiss} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ScamWarning;
