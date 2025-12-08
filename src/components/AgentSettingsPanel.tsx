import { useState, useEffect } from 'react';
import { Save, X, Loader2, Bot, Mail } from 'lucide-react';
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
  personality: string;
  custom_personality: string | null;
  temperature: number;
  trigger_keywords: string[];
  custom_faqs: string;
  additional_info: string;
  pricing_tier: string;
}

export default function AgentSettingsPanel({ agentId, onClose, onSaved }: AgentSettingsPanelProps) {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');

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
        personality: data.personality || 'professional',
        custom_personality: data.custom_personality || null,
        temperature: data.temperature || 0.3,
        trigger_keywords: data.trigger_keywords || [],
        custom_faqs: data.custom_faqs || '',
        additional_info: data.additional_info || '',
        pricing_tier: data.pricing_tier
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
          personality: settings.personality,
          custom_personality: settings.custom_personality,
          temperature: settings.temperature,
          trigger_keywords: settings.trigger_keywords,
          custom_faqs: settings.custom_faqs,
          additional_info: settings.additional_info
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
      trigger_keywords: [...settings.trigger_keywords, newTrigger.trim()]
    });
    setNewTrigger('');
  };

  const removeTrigger = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      trigger_keywords: settings.trigger_keywords.filter((_, i) => i !== index)
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

              {/* Personality */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Personality Style
                  <span className="text-muted-foreground font-normal ml-2">
                    (Defines how your agent communicates)
                  </span>
                </label>
                <select
                  value={settings.personality}
                  onChange={(e) => setSettings({ ...settings, personality: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="professional">Professional - Formal and business-like</option>
                  <option value="funny">Funny - Witty and entertaining</option>
                  <option value="technical">Technical - Precise and detailed</option>
                  <option value="casual">Casual - Friendly and relaxed</option>
                  <option value="custom">Custom - Define your own</option>
                </select>
                {settings.personality === 'custom' && (
                  <textarea
                    value={settings.custom_personality || ''}
                    onChange={(e) => setSettings({ ...settings, custom_personality: e.target.value })}
                    rows={4}
                    className="w-full mt-3 px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe your custom personality..."
                  />
                )}
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

              {/* Additional Info */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Additional Information
                  <span className="text-muted-foreground font-normal ml-2">
                    (Extra context about your project)
                  </span>
                </label>
                <textarea
                  value={settings.additional_info}
                  onChange={(e) => setSettings({ ...settings, additional_info: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional project details..."
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
                  {settings.trigger_keywords.map((trigger, index) => (
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
                    (Use Q: and A: format for each FAQ)
                  </span>
                </label>
                <textarea
                  value={settings.custom_faqs}
                  onChange={(e) => setSettings({ ...settings, custom_faqs: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder="Q: What is your project?&#10;A: We are building...&#10;&#10;Q: How do I get started?&#10;A: First, you need to..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Format: Start each question with "Q:" and each answer with "A:", separated by blank lines
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <a
                href="mailto:office@smartsentinels.net"
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                <Mail size={16} />
                <span>Contact Support</span>
              </a>
              <div className="flex items-center gap-3">
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
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
