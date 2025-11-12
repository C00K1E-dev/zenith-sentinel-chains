import { ArrowLeft, Calendar, Rocket, Handshake, Globe, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';

interface NewsItem {
  id: number;
  title: string;
  date: string;
  content: string;
  emoji?: string;
}

const News = () => {
  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: 'SmartSentinels x Studio Blockchain Partnership Announcement',
      date: 'November 12, 2025',
      emoji: null,
      content: `SmartSentinels x Studio Blockchain Partnership Announcement

We're proud to announce a strategic partnership between SmartSentinels and Studio Blockchain!

Both projects share a bold vision — merging AI and Blockchain to create real, measurable utility in the decentralized world.

Through this collaboration, Studio Blockchain's intelligent agents will soon join our Proof of Useful Work (PoUW) network. Each time their agents perform useful work, SSTL tokens will be minted and distributed to NFT holders from the related agent collections.

This partnership strengthens the foundation of our ecosystem — uniting AI innovation, transparency, and tokenized value creation.

Together, we're building the future of decentralized AI infrastructure.`
    }
  ];

  return (
    <>
      <MetaTags 
        title="News & Announcements | SmartSentinels"
        description="Stay updated with the latest news and announcements from SmartSentinels"
        path="/news"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-x-hidden overflow-y-auto">
        {/* Optimized Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Static Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="absolute inset-0 bg-gradient-to-tl from-accent/5 via-transparent to-primary/5" />

          {/* Circuit Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="20" height="20" fill="none"/>
                  <circle cx="10" cy="10" r="1" fill="rgba(248, 244, 66, 0.2)"/>
                  <line x1="10" y1="10" x2="20" y2="10" stroke="rgba(248, 244, 66, 0.1)" strokeWidth="0.5"/>
                  <line x1="10" y1="10" x2="10" y2="0" stroke="rgba(248, 244, 66, 0.1)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#circuit)"/>
            </svg>
          </div>

          {/* Reduced Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-secondary/2 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent/2 rounded-full blur-3xl" />
        </div>

        <Navbar />

        {/* News Content */}
        <section className="relative z-10 min-h-[calc(100vh-180px)] pt-24 sm:pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12">
              <Link to="/">
                <Button 
                  variant="outline" 
                  className="mb-6 gap-2 border-primary/30 hover:border-primary/60 text-primary hover:text-primary"
                >
                  <ArrowLeft size={16} />
                  <span className="text-xs sm:text-sm">Back to Home</span>
                </Button>
              </Link>
              
              <div className="glass-card p-6 sm:p-8 md:p-10 neon-border">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 neon-glow">
                  News & Announcements
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Stay informed about the latest updates and partnerships from SmartSentinels
                </p>
              </div>
            </div>

            {/* News Items */}
            <div className="space-y-8">
              {newsItems.map((item) => (
                <div 
                  key={item.id}
                  className="glass-card p-6 sm:p-8 md:p-10 neon-border hover:shadow-[0_0_30px_rgba(248,244,66,0.3)] transition-all duration-300"
                >
                  {/* News Item Header */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary" />
                          <time className="text-sm text-muted-foreground">
                            {item.date}
                          </time>
                        </div>
                        <div className="flex items-center gap-3">
                          <Rocket size={24} className="text-primary" />
                          <Handshake size={24} className="text-primary" />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-orbitron font-bold neon-glow mb-6">
                      {item.title}
                    </h2>

                    {/* Partnership Logos */}
                    {item.id === 1 && (
                      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 py-6 border-b border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/ss-icon.svg" 
                            alt="SmartSentinels Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">SmartSentinels</span>
                        </div>
                        
                        <div className="text-primary font-bold text-2xl sm:text-3xl">×</div>
                        
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/assets/studio.png" 
                            alt="Studio Blockchain Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">Studio Blockchain</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* News Item Content */}
                  <div className="prose prose-invert max-w-none">
                    <div className="text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap font-light">
                      {item.content}
                      {item.id === 1 && (
                        <span className="inline-flex items-center gap-2 ml-2 text-primary">
                          <Globe size={20} />
                          <Zap size={20} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* News Item Footer */}
                  <div className="mt-8 pt-6 border-t border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      For more information, visit our <Link to="/hub" className="text-primary hover:text-primary/80 font-semibold transition-colors">Hub</Link> or connect with us on social media.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-16 glass-card p-8 sm:p-10 text-center neon-border">
              <h3 className="text-2xl sm:text-3xl font-orbitron font-bold mb-4 neon-glow">
                Join Our Community
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Be part of the revolution. Explore SmartSentinels and discover what's possible.
              </p>
              <Link to="/hub/airdrop" target="_blank" rel="noopener noreferrer">
                <Button variant="hero" size="lg" className="text-sm sm:text-base">
                  Explore Now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default News;
