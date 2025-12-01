import { motion } from 'framer-motion';
import { useState } from 'react';
import { FileText, Download, ExternalLink, File } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';

const doc_data = [
	{ name: 'Pitch Deck', file: '/PitchDeck.html', type: 'html' },
	{ name: 'Whitepaper', file: '/documents/SmartSentinelsWhitepaper v0.2.pdf', type: 'pdf' },
	{ name: 'Litepaper', file: '/documents/LightpaperV0.2.pdf', type: 'pdf' },
	{ name: 'OnePager', file: '/documents/SmartSentinelsOnePager.pdf', type: 'pdf' },
	{ name: 'Terms and Conditions', file: '/documents/Terms and Conditions.pdf', type: 'pdf' },
	{ name: 'Privacy Policy', file: '/documents/Privacy Policy.pdf', type: 'pdf' },
	{ name: 'Disclaimer', file: '/documents/Disclaimer.pdf', type: 'pdf' },
	{ name: 'Token Sale Terms', file: '/documents/TokenSaleTerms.pdf', type: 'pdf' },
];

const Documents = () => {
	const [downloading, setDownloading] = useState<string | null>(null);

	const handleDownload = async (
		fileName: string,
		filePath: string,
		fileType: string
	) => {
		try {
			setDownloading(fileName);

			// Create a temporary link element to trigger download or open
			const link = document.createElement('a');
			link.href = filePath;
			link.target = '_blank';

			// Only set download for PDF files
			if (fileType === 'pdf') {
				link.download = fileName.toLowerCase().replace(/\s+/g, '-') + '.pdf';
			}

			// Append to body, click, and remove
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Reset downloading state after a short delay
			setTimeout(() => {
				setDownloading(null);
			}, 1000);
		} catch (error) {
			console.error('Action failed:', error);
			setDownloading(null);
		}
	};

	return (
		<>
			<MetaTags 
				title="Documents | SmartSentinels"
				description="Download official SmartSentinels documents: whitepaper, litepaper, pitch deck, and legal resources for the decentralized AI platform."
				path="/documents"
			/>
			<div className="min-h-screen bg-background relative overflow-hidden">
			{/* Premium Animated Background */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
				{/* Multi-layer Gradient Background */}
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
				<div className="absolute inset-0 bg-gradient-to-tl from-accent/3 via-transparent to-primary/3" />
				
				{/* Modern Grid Pattern */}
				<div className="absolute inset-0 opacity-[0.03]">
					<svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
								<path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />
					</svg>
				</div>

				{/* Animated Grid Dots - Aligned to 60px grid */}
				<div className="absolute inset-0">
					{/* Horizontal moving dots - LEFT TO RIGHT - Blue */}
					<div className="absolute left-0 w-2 h-2 bg-primary rounded-full animate-grid-horizontal opacity-60 grid-dot-trail text-primary" style={{ top: '120px' }} />
					<div className="absolute left-0 w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal-slow opacity-50 grid-dot-trail text-primary" style={{ top: '540px', animationDelay: '5s' }} />
					<div className="absolute left-0 w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail text-primary" style={{ top: '300px', animationDelay: '18s' }} />
					
					{/* Horizontal moving dots - RIGHT TO LEFT - Purple */}
					<div className="absolute w-2 h-2 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-60 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '420px', right: '0' }} />
					<div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '180px', right: '0', animationDelay: '10s' }} />
					<div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-55 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '600px', right: '0', animationDelay: '14s' }} />
					<div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '360px', right: '0', animationDelay: '7s' }} />
					
					{/* Horizontal moving dots - LEFT TO RIGHT - Teal */}
					<div className="absolute left-0 w-1 h-1 bg-accent rounded-full animate-grid-horizontal-slow opacity-40 grid-dot-trail text-accent" style={{ top: '660px', animationDelay: '15s' }} />
					<div className="absolute left-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal opacity-50 grid-dot-trail text-accent" style={{ top: '240px', animationDelay: '20s' }} />
					
					{/* Vertical moving dots - TOP TO BOTTOM - Teal */}
					<div className="absolute top-0 w-2 h-2 bg-accent rounded-full animate-grid-vertical opacity-60 grid-dot-trail-vertical text-accent" style={{ left: '240px' }} />
					<div className="absolute top-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical-slow opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '960px', animationDelay: '8s' }} />
					<div className="absolute top-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-55 grid-dot-trail-vertical text-accent" style={{ left: '1200px', animationDelay: '16s' }} />
					<div className="absolute top-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '1560px', animationDelay: '13s' }} />
					
					{/* Vertical moving dots - BOTTOM TO TOP - Blue */}
					<div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-primary" style={{ left: '600px', bottom: '0' }} />
					<div className="absolute w-1 h-1 bg-primary rounded-full animate-grid-vertical-reverse opacity-45 grid-dot-trail-vertical-reverse text-primary" style={{ left: '780px', bottom: '0', animationDelay: '12s' }} />
					<div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '1080px', bottom: '0', animationDelay: '9s' }} />
					<div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '1440px', bottom: '0', animationDelay: '4s' }} />
					
					{/* Vertical moving dots - TOP TO BOTTOM - Purple */}
					<div className="absolute top-0 w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '480px', animationDelay: '6s' }} />
					<div className="absolute top-0 w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical-slow opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '1320px', animationDelay: '11s' }} />
					
					{/* Vertical moving dots - BOTTOM TO TOP - Purple */}
					<div className="absolute w-1 h-1 bg-secondary rounded-full animate-grid-vertical-reverse opacity-45 grid-dot-trail-vertical-reverse text-secondary" style={{ left: '360px', bottom: '0', animationDelay: '17s' }} />
					
					{/* Additional dots for coverage */}
					<div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-accent" style={{ left: '1680px', bottom: '0', animationDelay: '3s' }} />
					<div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '1800px', bottom: '0', animationDelay: '8s' }} />
				</div>

				{/* Floating Orbs */}
				<div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
				<div className="absolute bottom-20 right-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-3xl animate-float-delayed" />
				<div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/6 rounded-full blur-3xl animate-float-slow" />
			</div>

			<Navbar />

			<div className="relative z-10 min-h-screen flex flex-col">
				<div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-20">
					<div className="max-w-4xl mx-auto w-full">
						{/* Header */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="text-center mb-10 sm:mb-12 md:mb-16"
						>
							<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-bold mb-3 sm:mb-4 neon-glow">
								Project Documents
							</h1>
							<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
								Access our comprehensive documentation, whitepapers, and project
								materials
							</p>
						</motion.div>

						{/* Documents Grid */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
						>
							{doc_data.map((doc, index) => (
								<motion.div
									key={doc.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.1 * index }}
									className="glass-card-hover p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-primary/30 transition-all duration-300"
								>
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
											<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
												{doc.type === 'html' ? (
													<FileText size={20} className="sm:w-6 sm:h-6 text-primary" />
												) : (
													<File size={20} className="sm:w-6 sm:h-6 text-primary" />
												)}
											</div>
											<div className="min-w-0">
												<h3 className="text-sm sm:text-base md:text-lg font-orbitron font-bold text-foreground mb-0.5 sm:mb-1 truncate">
													{doc.name}
												</h3>
												<p className="text-xs sm:text-sm text-muted-foreground">
													{doc.type === 'pdf' ? 'PDF Document' : 'Web Page'}
												</p>
											</div>
										</div>

										<div className="flex space-x-1.5 sm:space-x-2 flex-shrink-0">
											<button
												onClick={() => window.open(doc.file, '_blank')}
												className="p-1.5 sm:p-2 rounded-lg glass-card-hover hover:bg-primary/10 transition-all duration-200"
												title="Open in new tab"
											>
												<ExternalLink size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
											</button>

											{doc.type === 'pdf' && (
												<button
													className="p-1.5 sm:p-2 rounded-lg glass-card-hover hover:bg-primary/10 transition-all duration-200 disabled:opacity-50"
													onClick={() =>
														handleDownload(doc.name, doc.file, doc.type)
													}
													disabled={downloading === doc.name}
													title={
														downloading === doc.name
															? 'Downloading...'
															: 'Download PDF'
													}
												>
													{downloading === doc.name ? (
														<div className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full" />
													) : (
														<Download size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
													)}
												</button>
											)}
										</div>
									</div>
								</motion.div>
							))}
						</motion.div>

						{/* Call to Action */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.8 }}
							className="text-center mt-10 sm:mt-12 md:mt-16"
						>
							<div className="glass-card-hover p-6 sm:p-8 max-w-2xl mx-auto">
								<h3 className="text-lg sm:text-xl md:text-2xl font-orbitron font-bold text-foreground mb-3 sm:mb-4">
									Ready to Get Started?
								</h3>
								<p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
									Join the SmartSentinels community and be part of the
									decentralized AI revolution.
								</p>
								<a
									href="/hub"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-primary/25 font-orbitron font-bold transition-all duration-200 text-sm sm:text-base"
								>
									<span>Access Hub</span>
									<ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]" />
								</a>
							</div>
						</motion.div>
					</div>
				</div>
				<Footer />
			</div>
		</div>
		</>
	);
};

export default Documents;