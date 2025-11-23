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
			<div className="min-h-screen gradient-animate relative">
			{/* Blockchain & AI Themed Background Elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				{/* Circuit Board Pattern */}
				<div className="absolute inset-0 opacity-10">
					<svg
						className="w-full h-full"
						viewBox="0 0 100 100"
						xmlns="http://www.w3.org/2000/svg"
					>
						<defs>
							<pattern
								id="docs-circuit"
								x="0"
								y="0"
								width="20"
								height="20"
								patternUnits="userSpaceOnUse"
							>
								<rect x="0" y="0" width="20" height="20" fill="none" />
								<circle
									cx="10"
									cy="10"
									r="1"
									fill="rgba(248, 244, 66, 0.3)"
								/>
								<line
									x1="10"
									y1="10"
									x2="20"
									y2="10"
									stroke="rgba(248, 244, 66, 0.2)"
									strokeWidth="0.5"
								/>
								<line
									x1="10"
									y1="10"
									x2="10"
									y2="0"
									stroke="rgba(248, 244, 66, 0.2)"
									strokeWidth="0.5"
								/>
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#docs-circuit)" />
					</svg>
				</div>

				{/* Large Background Glows */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/3 to-transparent rounded-full blur-3xl animate-pulse" />
				<div
					className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-primary/4 to-transparent rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: '3s' }}
				/>
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
									className="inline-flex items-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(248,244,66,0.5)] hover:shadow-[0_0_30px_rgba(248,244,66,0.7)] font-orbitron font-bold transition-all duration-200 text-sm sm:text-base"
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