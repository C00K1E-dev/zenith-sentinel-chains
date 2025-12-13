import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Cpu, Zap, Brain, Rocket, Settings, FileText, ChevronDown, ChevronUp, MessageCircle, Clock, Users, TrendingUp, Check, Wallet, ExternalLink } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import CreateAITelegramAgent from './createAITelegramAgent';

const AIModelCard = ({ 
  name, 
  description, 
  icon: Icon, 
  capabilities, 
  isSelected, 
  onSelect 
}: {
  name: string;
  description: string;
  icon: any;
  capabilities: string[];
  isSelected: boolean;
  onSelect: () => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card p-6 cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${
          isSelected 
            ? 'bg-gradient-to-br from-primary/20 to-primary/10' 
            : 'bg-gradient-to-br from-muted/20 to-muted/10'
        }`}>
          <Icon size={24} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <div className="flex flex-wrap gap-1">
            {capabilities.map((cap, index) => (
              <span key={index} className="text-xs bg-muted px-2 py-1 rounded-full">
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SidebarCreateAgent = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showModelFile, setShowModelFile] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showWalletWarning, setShowWalletWarning] = useState(false);
  const [modelFileContent, setModelFileContent] = useState(`# Modelfile for AI Agent
FROM gpt-4

# System prompt
SYSTEM """
You are an AI assistant specialized in smart contract auditing and blockchain security.
Your role is to analyze smart contracts for vulnerabilities, provide detailed reports,
and suggest improvements for secure blockchain development.
"""

# Parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER max_tokens 4096

# Additional capabilities
PARAMETER enable_code_execution true
PARAMETER enable_web_search true
PARAMETER enable_file_analysis true

# Custom instructions
PARAMETER custom_instructions """
- Always provide detailed explanations
- Include code examples when relevant
- Suggest best practices for security
- Be thorough but concise
"""`);

  // Update model file when selected model changes
  useEffect(() => {
    if (selectedModel) {
      const modelName = aiModels.find(m => m.id === selectedModel)?.name || selectedModel;
      setModelFileContent(prev => prev.replace(/FROM .*/, `FROM ${modelName}`));
    }
  }, [selectedModel]);

  // Agent types available
  const agentTypes = [
    {
      id: 'telegram',
      name: 'Telegram AI Agent',
      icon: MessageCircle,
      description: 'Intelligent Telegram agent powered by Google Gemini and SmartSentinels for managing community, answering questions, and engaging members',
      status: 'available',
      pricing: 'From $99/month',
      setupTime: '5-10 minutes',
      features: [
        'AI-powered responses',
        'Community management',
        'Member engagement',
        'Analytics & insights'
      ],
      component: null // Will be rendered separately
    }
  ];

  const aiModels = [
    {
      id: 'gpt-4',
      name: 'GPT-4 Turbo',
      description: 'Advanced language model with superior reasoning and coding capabilities',
      icon: Brain,
      capabilities: ['Code Generation', 'Natural Language', 'Reasoning', 'Multi-modal']
    },
    {
      id: 'claude-3',
      name: 'Claude 3 Opus',
      description: 'Anthropic\'s most powerful model for complex analysis and creative tasks',
      icon: Cpu,
      capabilities: ['Analysis', 'Creative Writing', 'Research', 'Safety']
    },
    {
      id: 'gemini',
      name: 'Gemini Ultra',
      description: 'Google\'s multimodal model combining text, images, and real-time data',
      icon: Zap,
      capabilities: ['Multimodal', 'Real-time Data', 'Vision', 'Integration']
    },
    {
      id: 'llama-3',
      name: 'Llama 3 70B',
      description: 'Meta\'s open-source model optimized for efficiency and performance',
      icon: Bot,
      capabilities: ['Open Source', 'Efficient', 'Customizable', 'Research']
    }
  ];

  return (
    <div>
      {/* Show Telegram Agent Form if Selected */}
      {selectedAgent === 'telegram' && (
        <>
          <button
            onClick={() => setSelectedAgent(null)}
            className="mb-8 text-primary hover:text-primary/80 transition flex items-center gap-2 text-sm font-medium"
          >
            <span>←</span>
            <span>Back to Agent Selection</span>
          </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CreateAITelegramAgent />
          </motion.div>
        </>
      )}

      {/* Agent Selection View */}
      {!selectedAgent && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Bot size={24} className="text-primary" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Create Agent
                </span>
              </h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* New Agent Types Section */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                  <MessageCircle size={20} className="text-blue-500" />
                </div>
                Deploy Your Telegram AI Agent
              </h3>
              <p className="text-muted-foreground mb-6">
                Launch a powerful Telegram AI agent powered by Google Gemini, trained on your project data. Available now with flexible pricing and enterprise-grade features.
              </p>

              <div className="w-full">
                {agentTypes.map((agent) => {
                  const IconComponent = agent.icon;
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full rounded-lg border-2 overflow-hidden relative ${
                        agent.status === 'available'
                          ? 'border-blue-500/30 bg-blue-500/5'
                          : 'border-muted/50 bg-muted/5'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                        {/* Left Column - Content (3/5 width) */}
                        <div className="lg:col-span-3 p-6 lg:p-8">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <IconComponent size={24} className="text-blue-500" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xl text-foreground mb-1">{agent.name}</h4>
                                {agent.status === 'available' && (
                                  <span className="text-xs bg-green-500/20 text-green-600 px-2.5 py-1 rounded-full font-semibold">
                                    Available Now
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {agent.description}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-blue-500/20">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Pricing</p>
                              <p className="font-bold text-primary text-lg">{agent.pricing}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Setup Time</p>
                              <p className="font-bold text-foreground text-lg">{agent.setupTime}</p>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="mb-6">
                            <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Key Features</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {agent.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check size={12} className="text-green-500" />
                                  </div>
                                  <span className="text-sm text-foreground">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CTA Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <motion.button
                              onClick={() => {
                                if (!isConnected) {
                                  setShowWalletWarning(true);
                                  setTimeout(() => setShowWalletWarning(false), 5000);
                                } else {
                                  setSelectedAgent(agent.id);
                                }
                              }}
                              className="flex-1 sm:flex-none px-8 py-3 rounded-lg transition font-bold shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-xl"
                            >
                              {!isConnected ? <Wallet size={18} /> : <Rocket size={18} />}
                              {!isConnected ? 'Connect Wallet First' : 'Deploy Agent Now'}
                            </motion.button>
                            
                            <motion.a
                              href="https://t.me/SmartSentinelsCommunity"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-none px-8 py-3 rounded-lg transition font-bold shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 hover:shadow-xl"
                            >
                              <ExternalLink size={18} />
                              Live Demo
                            </motion.a>
                          </div>
                          
                          {/* Wallet Warning */}
                          {showWalletWarning && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-start gap-3"
                            >
                              <Wallet size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-yellow-600 text-sm font-semibold mb-1">Wallet Connection Required</p>
                                <p className="text-yellow-600/90 text-xs">
                                  Please connect your wallet using the button in the top-right corner to deploy your AI agent. Payment is required to activate your agent.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Right Column - Image (2/5 width) */}
                        <div className="hidden lg:flex lg:col-span-2 items-center justify-center p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
                          <img
                            src="/assets/telegramSentinel.svg"
                            alt="Telegram Sentinel AI Agent"
                            className="w-full h-auto object-contain max-h-[400px] opacity-90 hover:opacity-100 transition-opacity duration-300"
                          />
                        </div>
                      </div>

                      {/* Mobile Image Section */}
                      <div className="lg:hidden px-6 pb-6 pt-0">
                        <div className="rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-6">
                          <img
                            src="/assets/telegramSentinel.svg"
                            alt="Telegram Sentinel AI Agent"
                            className="w-full max-h-64 object-contain opacity-90"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Traditional AI Models Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                    <Settings size={20} className="text-secondary" />
                  </div>
                  Custom AI Models
                </h3>
                <span className="px-3 py-1 text-xs font-orbitron font-bold bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full text-primary">
                  SOON
                </span>
              </div>
              <div className="glass-card p-4 mb-4 bg-blue-500/5 border-blue-500/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold text-blue-400">Preview Mode:</span> These are example AI models showing how this feature will look like. Custom AI model deployment will be available in Q2/Q3 2026. Subject to change in accordance to development.
                </p>
              </div>
              <p className="text-muted-foreground mb-6">
                Select the AI model that best fits your agent's requirements. Each model has unique capabilities and performance characteristics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {aiModels.map((model) => (
                  <AIModelCard
                    key={model.id}
                    name={model.name}
                    description={model.description}
                    icon={model.icon}
                    capabilities={model.capabilities}
                    isSelected={selectedModel === model.id}
                    onSelect={() => setSelectedModel(model.id)}
                  />
                ))}
              </div>

              {/* Model File Editor */}
              {selectedModel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <button
                    onClick={() => setShowModelFile(!showModelFile)}
                    className="flex items-center gap-2 w-full p-4 glass-card hover:border-primary/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                      <FileText size={18} className="text-accent" />
                    </div>
                    <span className="font-medium">Customize Model File</span>
                    {showModelFile ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {showModelFile && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <textarea
                        value={modelFileContent}
                        onChange={(e) => setModelFileContent(e.target.value)}
                        className="w-full h-64 p-4 glass-card resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter your model file configuration..."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Modify the model file to customize your AI agent's behavior, parameters, and capabilities.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              <div className="flex justify-center">
                <button
                  className="flex items-center gap-2 px-8 py-3 bg-muted text-muted-foreground cursor-not-allowed rounded-lg font-medium"
                  disabled
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-muted/30 to-muted/20 flex items-center justify-center">
                    <Rocket size={18} className="text-secondary" />
                  </div>
                  Deploy Agent (Coming Soon)
                </button>
              </div>
            </div>

            {selectedModel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 border-primary/50"
              >
                <h4 className="text-lg font-semibold mb-2">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Selected Model</span>
                </h4>
                <p className="text-muted-foreground">
                  {aiModels.find(m => m.id === selectedModel)?.name} - Ready for deployment
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SidebarCreateAgent;