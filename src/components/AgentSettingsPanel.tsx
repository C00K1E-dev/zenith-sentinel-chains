import { useState, useEffect } from 'react';
import { Save, X, Loader2, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

interface AgentSettingsPanelProps {
  agentId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface AgentSettings {
  project_name: string;
  bot_handle: string;
  personality_prompt: string;
  temperature: number;
  triggers: string[];
  default_response: string;
  pricing_tier: string;
  google_api_key: string | null;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export default function AgentSettingsPanel({ agentId, onClose, onSaved }: AgentSettingsPanelProps) {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  useEffect(() => {
    loadSettings();
  }, [agentId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('telegram_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      setSettings({
        project_name: data.project_name,
        bot_handle: data.bot_handle,
        personality_prompt: data.personality_prompt || '',
        temperature: data.temperature || 0.3,
        triggers: data.triggers || [],
        default_response: data.default_response || '',
        pricing_tier: data.pricing_tier,
        google_api_key: data.google_api_key,
        faqs: data.faqs || []
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agent settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('telegram_agents')
        .update({
          personality_prompt: settings.personality_prompt,
          temperature: settings.temperature,
          triggers: settings.triggers,
          default_response: settings.default_response,
          faqs: settings.faqs,
          google_api_key: settings.google_api_key
        })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Agent settings saved successfully'
      });

      onSaved();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addTrigger = () => {
    if (!newTrigger.trim() || !settings) return;
    setSettings({
      ...settings,
      triggers: [...settings.triggers, newTrigger.trim()]
    });
    setNewTrigger('');
  };

  const removeTrigger = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      triggers: settings.triggers.filter((_, i) => i !== index)
    });
  };

  const addFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim() || !settings) return;
    setSettings({
      ...settings,
      faqs: [...settings.faqs, { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }]
    });
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const removeFaq = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      faqs: settings.faqs.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="glass-card p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" />
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-6 max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-orbitron font-bold">Agent Settings</h2>
                  <p className="text-sm text-muted-foreground">{settings.project_name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info (Read-only) */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Project Name</label>
                    <input
                      type="text"
                      value={settings.project_name}
                      disabled
                      className="w-full mt-1 px-4 py-2 bg-secondary/10 border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Bot Handle</label>
                    <input
                      type="text"
                      value={settings.bot_handle}
                      disabled
                      className="w-full mt-1 px-4 py-2 bg-secondary/10 border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Personality Prompt */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Personality Prompt
                  <span className="text-muted-foreground font-normal ml-2">
                    (Defines how your agent behaves and responds)
                  </span>
                </label>
                <textarea
                  value={settings.personality_prompt}
                  onChange={(e) => setSettings({ ...settings, personality_prompt: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="You are a helpful assistant that..."
                />
              </div>

              {/* Temperature Control */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Response Accuracy Control
                  <span className="text-muted-foreground font-normal ml-2">
                    (Lower = More Factual, prevents hallucinations)
                  </span>
                </label>
                <div className="p-4 bg-secondary/20 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">More Creative</span>
                    <span className="text-sm font-bold text-primary">{settings.temperature.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">More Factual</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {settings.temperature <= 0.3 && "🎯 Highly factual - Minimizes hallucinations (Recommended)"}
                    {settings.temperature > 0.3 && settings.temperature <= 0.6 && "⚖️ Balanced - Mix of creativity and accuracy"}
                    {settings.temperature > 0.6 && "✨ Creative - More expressive but may add details"}
                  </p>
                </div>
              </div>

              {/* Temperature Control */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Response Accuracy Control
                  <span className="text-muted-foreground font-normal ml-2">
                    (Lower = More Factual, prevents hallucinations)
                  </span>
                </label>
                <div className="p-4 bg-secondary/10 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">More Creative</span>
                    <span className="text-sm font-bold text-primary">{settings.temperature.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">More Factual</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {settings.temperature <= 0.3 && "🎯 Highly factual - Minimizes hallucinations (Recommended)"}
                    {settings.temperature > 0.3 && settings.temperature <= 0.6 && "⚖️ Balanced - Mix of creativity and accuracy"}
                    {settings.temperature > 0.6 && "✨ Creative - More expressive but may add details"}
                  </p>
                </div>
              </div>

              {/* Default Response */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Default Response
                  <span className="text-muted-foreground font-normal ml-2">
                    (Used when agent can't find a specific answer)
                  </span>
                </label>
                <textarea
                  value={settings.default_response}
                  onChange={(e) => setSettings({ ...settings, default_response: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="I'm not sure about that. Please contact support..."
                />
              </div>

              {/* Triggers */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Trigger Keywords
                  <span className="text-muted-foreground font-normal ml-2">
                    (Agent responds when these keywords are mentioned)
                  </span>
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTrigger()}
                    placeholder="Add trigger keyword..."
                    className="flex-1 px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={addTrigger}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.triggers.map((trigger, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full"
                    >
                      <span className="text-sm">{trigger}</span>
                      <button
                        onClick={() => removeTrigger(index)}
                        className="hover:text-red-500 transition"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Frequently Asked Questions
                  <span className="text-muted-foreground font-normal ml-2">
                    (Agent uses these for quick responses)
                  </span>
                </label>
                <div className="space-y-3 mb-3">
                  <input
                    type="text"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    placeholder="Question..."
                    className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <textarea
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    rows={2}
                    placeholder="Answer..."
                    className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={addFaq}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Add FAQ
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {settings.faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-secondary/10 border border-border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-sm">{faq.question}</p>
                        <button
                          onClick={() => removeFaq(index)}
                          className="text-red-500 hover:text-red-400 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Google API Key (Optional) */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Google API Key (Optional)
                  <span className="text-muted-foreground font-normal ml-2">
                    (For custom AI model access)
                  </span>
                </label>
                <input
                  type="password"
                  value={settings.google_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, google_api_key: e.target.value || null })}
                  placeholder="Leave empty to use default"
                  className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border rounded-lg hover:bg-secondary/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
