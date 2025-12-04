import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Upload, AlertCircle, Check, Loader, ChevronRight, Copy, Rocket, FileText, Palette, DollarSign, Eye } from 'lucide-react';

interface AgentConfig {
  projectName: string;
  websiteUrl: string;
  whitepaper: File | null;
  botToken: string;
  additionalInfo?: string;
  personality: 'funny' | 'professional' | 'technical' | 'casual' | 'custom';
  customPersonality?: string;
  customFaqs: string;
  triggers: string[];
  pricingTier: 'starter' | 'pro' | 'enterprise';
}

interface PricingOption {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  rpm: string;
  rpd: string;
  features: string[];
  color: string;
}

const CreateAITelegramAgent = () => {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState(1);
  const [config, setConfig] = useState<AgentConfig>({
    projectName: '',
    websiteUrl: '',
    whitepaper: null,
    botToken: '',
    additionalInfo: '',
    personality: 'funny',
    customFaqs: 'Q: What is your project?\nA: We are building innovative solutions for blockchain',
    triggers: ['hello', 'help', 'features'],
    pricingTier: 'starter',
  });

  const [loading, setLoading] = useState(false);
  const [deployedBotToken, setDeployedBotToken] = useState<string | null>(null);
  const [triggerInput, setTriggerInput] = useState('');

  const pricingOptions: PricingOption[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$99/month',
      rpm: '15 RPM',
      rpd: '1,000 RPD',
      features: ['1 bot', 'Basic personality', '500 interactions/day', 'Email support'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$249/month',
      rpm: '15 RPM',
      rpd: '1,000 RPD',
      features: ['3 bots', 'Custom personality', '2,000 interactions/day', '24h support'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$599/month',
      rpm: '15 RPM',
      rpd: '1,000 RPD',
      features: ['Unlimited bots', 'White-label', 'Unlimited interactions', 'Same-day support'],
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const personalityStyles = [
    { id: 'funny', label: 'Funny & Engaging', desc: 'Crypto slang, memes, jokes' },
    { id: 'professional', label: 'Professional', desc: 'Formal, detailed, informative' },
    { id: 'technical', label: 'Technical', desc: 'Code-focused, detailed specs' },
    { id: 'casual', label: 'Casual & Friendly', desc: 'Approachable, conversational' },
    { id: 'custom', label: 'Custom', desc: 'Define your own personality' }
  ];

  const handleAddTrigger = () => {
    if (triggerInput.trim() && !config.triggers.includes(triggerInput.trim())) {
      setConfig({
        ...config,
        triggers: [...config.triggers, triggerInput.trim()]
      });
      setTriggerInput('');
    }
  };

  const handleRemoveTrigger = (trigger: string) => {
    setConfig({
      ...config,
      triggers: config.triggers.filter(t => t !== trigger)
    });
  };

  const handleCreateBot = async () => {
    setLoading(true);
    try {
      // Call your backend API to create the bot
      const response = await fetch('/api/create-telegram-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const data = await response.json();
        setDeployedBotToken(data.botInfo.username);

        // Save agent to localStorage
        const existingAgents = JSON.parse(localStorage.getItem('telegramAgents') || '[]');
        const newAgent = {
          projectName: config.projectName,
          botHandle: data.botInfo.username,
          website: config.websiteUrl,
          personality: config.personality,
          triggers: config.triggers,
          pricingTier: config.pricingTier,
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        existingAgents.push(newAgent);
        localStorage.setItem('telegramAgents', JSON.stringify(existingAgents));

        setStep(4); // Success step
      } else {
        alert('Failed to create bot. Please try again.');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      alert('Error creating bot: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Project Information
  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Project Name</label>
        <input
          type="text"
          value={config.projectName}
          onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
          placeholder="e.g., MyProject"
          className="w-full px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Website URL</label>
        <input
          type="url"
          value={config.websiteUrl}
          onChange={(e) => setConfig({ ...config, websiteUrl: e.target.value })}
          placeholder="https://yourproject.com"
          className="w-full px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
        <p className="text-xs text-muted-foreground mt-1.5">We'll extract project information from your website to train the AI agent</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Whitepaper (PDF)</label>
        <label htmlFor="whitepaper-upload" className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition block">
          <Upload size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {config.whitepaper ? config.whitepaper.name : 'Click to upload or drag & drop'}
          </p>
          <p className="text-xs text-muted-foreground">PDF only (optional)</p>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setConfig({ ...config, whitepaper: e.target.files?.[0] || null })}
            className="hidden"
            id="whitepaper-upload"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Telegram Bot Token</label>
        <input
          type="password"
          value={config.botToken}
          onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
          placeholder="Get from @BotFather on Telegram"
          className="w-full px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Don't have a bot? <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Create one at @BotFather</a>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Additional Information <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          value={config.additionalInfo || ''}
          onChange={(e) => setConfig({ ...config, additionalInfo: e.target.value })}
          placeholder="Add any relevant context about your project, industry, target audience, or special instructions for the agent..."
          rows={4}
          className="w-full px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1.5">This helps the AI agent better understand your project context and provide more relevant responses</p>
      </div>
    </motion.div>
  );

  // Step 2: Personality & Customization
  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-4 text-foreground">Personality Style</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {personalityStyles.map((style: any) => (
            <button
              key={style.id}
              onClick={() => setConfig({ ...config, personality: style.id })}
              className={`p-4 rounded-lg border-2 transition ${
                config.personality === style.id
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <p className="font-semibold text-sm text-foreground text-left">{style.label}</p>
              <p className="text-xs text-muted-foreground text-left mt-1">{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {config.personality === 'custom' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <label className="block text-sm font-semibold mb-2.5 text-foreground">Custom Personality Description</label>
          <textarea
            value={config.customPersonality || ''}
            onChange={(e) => setConfig({ ...config, customPersonality: e.target.value })}
            placeholder="Describe how you want your bot to behave and speak..."
            className="w-full h-32 px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none transition"
          />
          <p className="text-xs text-muted-foreground mt-1.5">Provide specific instructions for how the agent should interact with your community</p>
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Custom FAQs (Optional)</label>
        <textarea
          value={config.customFaqs}
          onChange={(e) => setConfig({ ...config, customFaqs: e.target.value })}
          placeholder="Q: What is your project?&#10;A: We are building..."
          className="w-full h-24 px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm transition"
        />
        <p className="text-xs text-muted-foreground mt-1.5">Format: Q: [question] A: [answer]. One Q&A per line.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Custom Trigger Keywords (Optional)</label>
        <div className="flex gap-2 mb-3 flex-col sm:flex-row">
          <input
            type="text"
            value={triggerInput}
            onChange={(e) => setTriggerInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTrigger()}
            placeholder="Add trigger keywords (press Enter)"
            className="flex-1 px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition"
          />
          <button
            onClick={handleAddTrigger}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium whitespace-nowrap"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.triggers.map((trigger) => (
            <span key={trigger} className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs flex items-center gap-2 font-medium">
              {trigger}
              <button
                onClick={() => handleRemoveTrigger(trigger)}
                className="ml-1 text-primary hover:text-primary/80 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {config.triggers.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">Keywords that automatically trigger specific responses</p>
        )}
      </div>
    </motion.div>
  );

  // Step 3: Pricing Selection
  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">Choose your pricing tier. You can upgrade or downgrade anytime. All tiers include the same API rate limits.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {pricingOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setConfig({ ...config, pricingTier: option.id })}
            className={`p-6 rounded-lg border-2 transition text-left h-full ${
              config.pricingTier === option.id
                ? 'border-primary bg-primary/10 shadow-lg lg:scale-105'
                : 'border-muted hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <div className={`bg-gradient-to-r ${option.color} text-white p-2.5 rounded w-fit mb-4`}>
              <p className="font-bold text-sm">{option.name}</p>
            </div>
            <p className="text-3xl font-bold mb-1">{option.price}</p>
            <p className="text-xs text-muted-foreground mb-4">/month</p>
            <div className="space-y-2 mb-6 text-sm text-muted-foreground">
              <p>📊 {option.rpm}</p>
              <p>📈 {option.rpd}</p>
            </div>
            <ul className="space-y-2.5 text-xs">
              {option.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check size={16} className="text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </motion.div>
  );

  // Step 4: Success
  const renderStep4 = () => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-500/20 mx-auto flex items-center justify-center"
      >
        <Check size={40} className="text-green-500" />
      </motion.div>
      <div>
        <h3 className="text-3xl font-bold mb-3">Deployment Complete! 🎉</h3>
        <p className="text-muted-foreground text-base">Your AI Community Agent is now live and ready to manage your community.</p>
      </div>

      {deployedBotToken && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 p-6 rounded-lg border border-muted"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Bot Handle</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <code className="font-mono text-lg font-bold text-primary bg-muted/50 px-4 py-2 rounded">@{deployedBotToken}</code>
            <button
              onClick={() => navigator.clipboard.writeText(`@${deployedBotToken}`)}
              className="p-2.5 hover:bg-primary/10 rounded-lg transition"
              title="Copy bot handle"
            >
              <Copy size={18} className="text-primary" />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-lg text-left"
      >
        <div className="flex gap-3 mb-4">
          <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-500 mb-3">Next Steps:</p>
            <ul className="text-blue-600 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">1</span>
                <span>Add the agent to your Telegram group</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">2</span>
                <span>Grant admin permissions (optional, for better functionality)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">3</span>
                <span>Start testing the agent with questions</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">4</span>
                <span>Monitor analytics in your dashboard</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="pt-2 space-y-3">
        <button
          onClick={() => {
            setStep(1);
            setConfig({
              projectName: '',
              websiteUrl: '',
              whitepaper: null,
              botToken: '',
              personality: 'funny',
              customFaqs: '',
              triggers: [],
              pricingTier: 'starter',
            });
            setDeployedBotToken(null);
          }}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold"
        >
          Create Another Agent
        </button>
        <button
          className="w-full px-6 py-3 border border-muted text-foreground rounded-lg hover:border-primary/50 hover:bg-muted/30 transition font-medium"
        >
          View Dashboard
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full">
      {/* Dev Preview Toggle */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-600 border border-amber-500/50 rounded hover:bg-amber-500/30 transition font-medium flex items-center gap-1.5"
        >
          <Eye size={14} />
          {showPreview ? 'Hide Preview' : 'Dev Preview'}
        </button>
      </div>

      {!showPreview ? (
        // NORMAL MODE - Step by step wizard
        <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                <MessageCircle size={28} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-3xl font-orbitron font-bold">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Deploy Your Telegram AI Agent
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Powered by Google Gemini • SmartSentinels
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              {[
                { num: 1, label: 'Project Info' },
                { num: 2, label: 'Personality' },
                { num: 3, label: 'Pricing' },
                { num: 4, label: 'Success' }
              ].map((item) => (
                <div key={item.num} className="flex flex-col items-center flex-1">
                  <motion.div
                    animate={{
                      scale: step >= item.num ? 1 : 0.9,
                      opacity: step >= item.num ? 1 : 0.5
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                      step >= item.num
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > item.num ? <Check size={18} /> : item.num}
                  </motion.div>
                  <span className="text-xs font-semibold text-muted-foreground hidden md:block">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full"
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 sm:p-8 mb-8 min-h-96"
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </motion.div>

          {/* Navigation */}
          {step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 px-6 py-3 border border-muted rounded-lg hover:border-primary/50 hover:bg-muted/30 transition font-semibold text-foreground"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={step === 3 ? handleCreateBot : () => setStep(step + 1)}
                disabled={
                  loading ||
                  (step === 1 && (!config.projectName || !config.websiteUrl || !config.botToken)) ||
                  (step === 2 && config.personality === 'custom' && !config.customPersonality)
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Deploying...
                  </>
                ) : step === 3 ? (
                  <>
                    <Rocket size={18} />
                    Deploy Agent
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </>
      ) : (
        // PREVIEW MODE - Interactive step navigator
        <div className="space-y-8">
          <div className="flex gap-2 flex-wrap mb-8">
            {[1, 2, 3, 4].map((s) => {
              const icons = [<FileText key="icon" size={16} />, <Palette key="icon" size={16} />, <DollarSign key="icon" size={16} />, <Rocket key="icon" size={16} />];
              return (
                <button
                  key={s}
                  onClick={() => setPreviewStep(s)}
                  className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    previewStep === s
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {icons[s - 1]} Step {s}
                </button>
              );
            })}
          </div>

          {/* Step 1: Project Info */}
          {previewStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2"><FileText size={20} /> Step 1: Project Info</h3>
              <div className="glass-card p-6 sm:p-8">
                {renderStep1()}
              </div>
            </motion.div>
          )}

          {/* Step 2: Personality */}
          {previewStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2"><Palette size={20} /> Step 2: Personality</h3>
              <div className="glass-card p-6 sm:p-8">
                {renderStep2()}
              </div>
            </motion.div>
          )}

          {/* Step 3: Pricing */}
          {previewStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2"><DollarSign size={20} /> Step 3: Pricing</h3>
              <div className="glass-card p-6 sm:p-8">
                {renderStep3()}
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {previewStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2"><Rocket size={20} /> Step 4: Success</h3>
              <div className="glass-card p-6 sm:p-8">
                {renderStep4()}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateAITelegramAgent;
