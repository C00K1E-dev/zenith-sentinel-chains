import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Cpu, Zap, Brain, Rocket, Settings, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import StatCard from '@/components/StatCard';

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
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showModelFile, setShowModelFile] = useState(false);
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
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
              <Settings size={20} className="text-secondary" />
            </div>
            Choose AI Model
          </h3>
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
    </div>
  );
};

export default SidebarCreateAgent;