import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// List of known copycat/scam domains
const SUSPICIOUS_DOMAINS = [
  'smartsentinels.xyz',
  'smartsentinel.xyz',
  'smartsentinels.io',
  'smartsentinel.io',
  'smart-sentinels.com',
  'smartsentinels.org',
  // Add more as you discover them
];

const OFFICIAL_DOMAIN = 'smartsentinels.net';

const ScamWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [referrerDomain, setReferrerDomain] = useState('');

  useEffect(() => {
    // Check referrer
    const referrer = document.referrer;
    if (referrer) {
      try {
        const url = new URL(referrer);
        const domain = url.hostname.toLowerCase();
        
        // Check if referrer is from a suspicious domain
        const isSuspicious = SUSPICIOUS_DOMAINS.some(
          suspicious => domain === suspicious || domain.endsWith('.' + suspicious)
        );
        
        if (isSuspicious) {
          setReferrerDomain(domain);
          setShowWarning(true);
          
          // Log for analytics (optional)
          console.warn(`[SECURITY] User arrived from suspicious domain: ${domain}`);
        }
      } catch (e) {
        // Invalid referrer URL, ignore
      }
    }

    // Also check if we're NOT on the official domain (in case of proxying)
    const currentDomain = window.location.hostname.toLowerCase();
    if (currentDomain !== OFFICIAL_DOMAIN && 
        currentDomain !== 'localhost' && 
        !currentDomain.endsWith('.vercel.app')) {
      setReferrerDomain(currentDomain);
      setShowWarning(true);
    }
  }, []);

  if (!showWarning) return null;

  return (
    <AnimatePresence>
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
                  onClick={() => setShowWarning(false)}
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
              onClick={() => setShowWarning(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScamWarning;
