import { motion } from 'framer-motion';
import { memo } from 'react';

const PoweredBy = memo(() => {
  const technologies = [
    { name: 'BNB Chain', logo: '/assets/bnb-chain-logo.svg' },
    { name: 'NVIDIA', logo: '/assets/nvidia-logo.svg' },
    { name: 'Thirdweb', logo: '/assets/thirdweb-logo.svg' },
    { name: 'Google Cloud', logo: '/assets/google-cloud-logo.svg' },
    { name: 'AMD', logo: '/assets/amd-seeklogo.png' },
    { name: 'MetaMask', logo: '/assets/MetaMask-icon-fox.svg' },
    { name: 'C15T', logo: '/assets/c15t-logo.png' },
  ];

  const partners = [
    { name: 'theMiracle', logo: '/assets/miracle.svg', link: 'https://www.themiracle.io/' },
    { name: 'Studio Blockchain', logo: '/assets/studio.png', link: 'https://studio-blockchain.com/' },
    { name: 'Micro3', logo: '/assets/micro3.png', link: 'https://micro3.io/' },
    { name: 'NFT Calendar', logo: '/assets/nftcalendar-500x500.png', link: 'https://nftcalendar.io/' },
    { name: 'Get featured here', logo: '', isText: true },
    { name: 'Get featured here', logo: '', isText: true },
    { name: 'Get featured here', logo: '', isText: true },
  ] as Array<{ name: string; logo: string; isText?: boolean; link?: string }>;

  const Marquee = ({ items, direction = 'left', isPartners = false }: { items: Array<{ name: string; logo: string; isText?: boolean; link?: string }>; direction?: 'left' | 'right'; isPartners?: boolean }) => {
    const duplicatedItems = [...items, ...items, ...items]; // Triple for seamless loop
    return (
      <div className="relative overflow-hidden py-4">
        <motion.div
          className="flex items-center gap-8"
          animate={{
            x: direction === 'left' ? [-100 * items.length, 0] : [0, -100 * items.length]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30, // Increased from 20 to 30 for better performance
              ease: "linear",
            },
          }}
        >
          {duplicatedItems.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center min-w-[120px]">
              {item.isText ? (
                <div className="h-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-semibold text-primary">{item.name}</span>
                </div>
              ) : (
                <>
                  {isPartners && item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:opacity-80 transition-opacity">
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="h-16 w-16 object-contain mb-2"
                      />
                    </a>
                  ) : (
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="h-16 w-16 object-contain mb-2"
                    />
                  )}
                </>
              )}
              {!item.isText && <span className="text-xs text-muted-foreground font-medium">{item.name}</span>}
            </div>
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <section className="py-12">
      <h2 className="text-center text-3xl md:text-4xl font-orbitron font-bold mb-6">
        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Powered By
        </span>
      </h2>
      <Marquee items={technologies} direction="left" />
      <h3 className="text-center text-3xl md:text-4xl font-orbitron font-bold mt-10 mb-4">
        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Partners
        </span>
      </h3>
      <Marquee items={partners} direction="right" isPartners={true} />
    </section>
  );
});

PoweredBy.displayName = 'PoweredBy';

export default PoweredBy;
