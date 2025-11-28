import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, ShieldCheck } from 'lucide-react';
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
const TICKER_STORAGE_KEY = 'security_ticker_dismissed';

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

// Animated scrolling security ticker - positioned at bottom
const SecurityTicker = () => {
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    if (sessionStorage.getItem(TICKER_STORAGE_KEY)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(TICKER_STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  const tickerText = "🛡️ SECURITY NOTICE: Make sure you're on the official SmartSentinels website → Check your URL bar shows smartsentinels.net ← Always verify before connecting your wallet. Beware of fake sites like .xyz .io .org .com — Only trust smartsentinels.net";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-green-950 via-green-900 to-green-950 border-t border-green-500/30"
    >
      <div className="flex items-center h-8 sm:h-9 overflow-hidden">
        {/* Shield icon - fixed */}
        <div className="flex-shrink-0 bg-green-800/50 px-3 h-full flex items-center gap-2 border-r border-green-500/30">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs font-bold hidden sm:inline">VERIFIED</span>
        </div>
        
        {/* Scrolling text container */}
        <div className="flex-1 overflow-hidden relative">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: ['0%', '-50%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {/* Duplicate the text for seamless loop */}
            <span className="text-green-100 text-xs sm:text-sm px-4 inline-flex items-center">
              {tickerText}
            </span>
            <span className="text-green-100 text-xs sm:text-sm px-4 inline-flex items-center">
              {tickerText}
            </span>
          </motion.div>
        </div>
        
        {/* Close button - fixed */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 px-3 h-full flex items-center text-green-400 hover:text-white hover:bg-green-800/50 transition-colors border-l border-green-500/30"
          aria-label="Dismiss security notice"
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

    // Method 1: Check current referrer
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
          return;
        }
      } catch (e) {
        // Invalid referrer URL
      }
    }

    // Method 2: Check if opened from another window (for new tabs with noreferrer)
    // Check opener's location if accessible
    if (window.opener) {
      try {
        // Try to access opener location (will fail if cross-origin)
        const openerLocation = window.opener.location.hostname.toLowerCase();
        const isSuspicious = SUSPICIOUS_DOMAINS.some(
          suspicious => openerLocation === suspicious || openerLocation.endsWith('.' + suspicious)
        );
        
        if (isSuspicious) {
          sessionStorage.setItem(SUSPICIOUS_REFERRER_KEY, openerLocation);
          setReferrerDomain(openerLocation);
          setShowWarning(true);
          console.warn(`[SECURITY] Opened from suspicious domain: ${openerLocation}`);
          return;
        }
      } catch (e) {
        // Cross-origin opener - can't access location
        // But the fact that there IS an opener from a different origin is suspicious
        // when combined with being on the hub page
        console.log('[SECURITY] Cross-origin opener detected');
      }
    }

    // Method 3: Check current domain - if we're NOT on the official domain, show warning
    const currentDomain = window.location.hostname.toLowerCase();
    if (currentDomain !== OFFICIAL_DOMAIN && currentDomain !== 'localhost' && currentDomain !== '127.0.0.1') {
      const isSuspicious = SUSPICIOUS_DOMAINS.some(
        suspicious => currentDomain === suspicious || currentDomain.endsWith('.' + suspicious)
      );
      
      if (isSuspicious) {
        sessionStorage.setItem(SUSPICIOUS_REFERRER_KEY, currentDomain);
        setReferrerDomain(currentDomain);
        setShowWarning(true);
        console.warn(`[SECURITY] Running on suspicious domain: ${currentDomain}`);
        return;
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
      {/* Animated scrolling security ticker at bottom */}
      <SecurityTicker />
      
      {/* Red warning modal if user came from scam site */}
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
