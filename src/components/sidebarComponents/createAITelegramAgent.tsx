import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Upload, AlertCircle, Check, Loader, ChevronRight, Copy, Rocket, FileText, Palette, DollarSign, Eye, Wallet, ExternalLink } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useActiveAccount, useSendTransaction, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { getContract, prepareContractCall, createThirdwebClient } from 'thirdweb';
import { useNavigate } from 'react-router-dom';
import { parseUnits } from 'viem';
import { bsc } from 'wagmi/chains';
import { bsc as bscThirdweb } from 'thirdweb/chains';
import {
  USDT_CONTRACT_ADDRESS,
  TREASURY_WALLET,
  ERC20_ABI,
  PRICING_TIERS,
  getPaymentAmount,
  PaymentStep,
  getPaymentStepMessage,
  getBSCScanLink
} from '@/lib/blockchain';
import {
  getOrCreateUser,
  updateUserEmail,
  createAgent,
  createSubscription,
  supabase
} from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';

// Initialize thirdweb client for mobile wallet support
const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

interface AgentConfig {
  email: string;
  projectName: string;
  websiteUrl: string;
  whitepaper: File | null;
  botToken: string;
  additionalInfo?: string;
  personality: 'funny' | 'professional' | 'technical' | 'casual' | 'custom';
  customPersonality?: string;
  temperature: number; // 0.0-1.0, lower = more factual
  customFaqs: string;
  triggers: string[];
  pricingTier: 'starter' | 'pro' | 'enterprise';
}

interface PricingOption {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  rpm: string;
  rpd: string;
  features: string[];
  color: string;
}

/**
 * Extract and process whitepaper PDF content using pdfjs-dist (browser-compatible)
 */
async function processWhitepaper(file: File): Promise<string> {
  try {
    console.log('[WHITEPAPER] Processing PDF...', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Dynamically import pdfjs-dist (browser library)
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker - use CDN for worker script
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    console.log('[WHITEPAPER] Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log('[WHITEPAPER] PDF loaded. Pages:', pdf.numPages);
    
    // Extract text from all pages
    let rawText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      rawText += pageText + '\n';
      
      // Progress logging for large PDFs
      if (pageNum % 10 === 0) {
        console.log(`[WHITEPAPER] Processed ${pageNum}/${pdf.numPages} pages...`);
      }
    }
    
    console.log('[WHITEPAPER] Extracted', rawText.length, 'characters from', pdf.numPages, 'pages');
    
    // Limit text to avoid token limits (10K chars should be enough)
    const limitedText = rawText.slice(0, 10000);
    
    // Use Gemini to extract and structure key information
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const prompt = `Analyze this whitepaper and extract key information in JSON format:

${limitedText}

Extract and return ONLY a JSON object with these fields:
{
  "overview": "brief 2-3 sentence summary of the project",
  "problem": "what problem does it solve",
  "solution": "the proposed solution",
  "tokenomics": {
    "supply": "total supply",
    "distribution": "how tokens are distributed",
    "utility": "token use cases"
  },
  "technology": "tech stack and architecture",
  "roadmap": ["key milestone 1", "key milestone 2", "key milestone 3"],
  "team": "team information",
  "partnerships": "key partners or advisors",
  "competitive_advantage": "what makes this unique"
}

Focus on extracting factual information. If a field is not mentioned, use "Not specified in whitepaper".`;

    const result = await model.generateContent(prompt);
    const jsonText = result.response.text()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    console.log('[WHITEPAPER] Successfully processed and structured PDF content');
    return jsonText;
  } catch (error) {
    console.error('[WHITEPAPER] Error processing PDF:', error);
    // Return empty object if processing fails
    return JSON.stringify({
      overview: "Whitepaper uploaded but processing failed",
      note: "Bot will rely on website content and custom FAQs for information",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, null, 2);
  }
}

/**
 * Build knowledge base by fetching and parsing website content via server-side API
 * This avoids CORS issues that would block client-side fetching
 */
async function buildKnowledgeBase(
  websiteUrl: string,
  projectName: string,
  customFaqs: string,
  additionalInfo?: string
): Promise<Record<string, any>> {
  try {
    console.log(`[KNOWLEDGE_BASE] Starting server-side scrape of ${websiteUrl}`);
    
    // Use server-side API to avoid CORS issues
    const response = await fetch('/api/scrape-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: websiteUrl,
        projectName: projectName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[KNOWLEDGE_BASE] Server scrape failed:', errorData);
      throw new Error(errorData.error || 'Failed to scrape website');
    }

    const data = await response.json();
    console.log(`[KNOWLEDGE_BASE] Scraped ${data.stats?.textChars || 0} characters from website`);
    
    // Merge with custom data
    const knowledgeBase = data.structured || { rawContent: data.content };
    
    // Add custom FAQs and additional info
    if (customFaqs) {
      knowledgeBase.customFaqs = customFaqs;
    }
    if (additionalInfo) {
      knowledgeBase.additionalInfo = additionalInfo;
    }
    
    knowledgeBase.websiteUrl = websiteUrl;
    knowledgeBase.lastUpdated = new Date().toISOString();
    
    return knowledgeBase;
  } catch (error) {
    console.error('Error building knowledge base:', error);
    // Return basic structure on failure
    return {
      description: `AI assistant for ${projectName}`,
      websiteUrl,
      customFaqs,
      additionalInfo,
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to scrape website'
    };
  }
}

const CreateAITelegramAgent = () => {
  const navigate = useNavigate();
  
  // Thirdweb wallet connection - using connection status hook for more reliable detection
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const thirdwebConnected = connectionStatus === 'connected' && !!account;
  const thirdwebAddress = account?.address;
  
  // Wagmi wallet connection (fallback for desktop wallets not using thirdweb)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  
  // Combined wallet state - prioritize thirdweb, fallback to wagmi
  const isWalletConnected = thirdwebConnected || wagmiConnected;
  const walletAddress = thirdwebAddress || wagmiAddress;
  
  // Debug: Log wallet state on every render
  console.log('[WALLET_RENDER]', {
    connectionStatus,
    account: account ? account.address : null,
    thirdwebConnected,
    wagmiConnected,
    isWalletConnected,
    walletAddress
  });
  
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState(1);
  const [config, setConfig] = useState<AgentConfig>({
    email: '',
    projectName: '',
    websiteUrl: '',
    whitepaper: null,
    botToken: '',
    additionalInfo: '',
    personality: 'funny',
    temperature: 0.3, // Default: more factual, less hallucination
    customFaqs: 'Q: What is your project?\nA: We are building innovative solutions for blockchain',
    triggers: ['hello', 'help', 'features'],
    pricingTier: 'starter',
  });

  const [loading, setLoading] = useState(false);
  const [deployedBotToken, setDeployedBotToken] = useState<string | null>(null);
  const [triggerInput, setTriggerInput] = useState('');
  
  // Payment states
  const [paymentStep, setPaymentStep] = useState<PaymentStep>(PaymentStep.IDLE);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Wagmi hooks for payment (desktop wallets)
  const { writeContract, data: hash, isPending: isTransferring } = useWriteContract();
  const { isSuccess: isTransferConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}` | undefined,
    chainId: bsc.id,
  });

  // Thirdweb hooks for payment (mobile wallets)
  const { mutateAsync: sendThirdwebTx, data: thirdwebTxResult, isPending: isThirdwebPending } = useSendTransaction();
  const [thirdwebTxHash, setThirdwebTxHash] = useState<string | null>(null);
  const [isThirdwebConfirmed, setIsThirdwebConfirmed] = useState(false);

  const pricingOptions: PricingOption[] = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 99,
      annualPrice: 950, // 20% off: 99 * 12 * 0.8 = 950.4
      rpm: '1K RPM',
      rpd: 'Unlimited',
      features: ['1,000 requests/min', 'Standard response speed', 'Email support', 'Basic analytics'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 249,
      annualPrice: 2390, // 20% off: 249 * 12 * 0.8 = 2390.4
      rpm: '2K RPM',
      rpd: 'Unlimited',
      features: ['2,000 requests/min', 'Faster response speed', 'Email support (48h)', 'Advanced analytics', 'Custom knowledge base'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 499,
      annualPrice: 4790, // 20% off: 499 * 12 * 0.8 = 4790.4
      rpm: '4K RPM',
      rpd: 'Unlimited',
      features: ['4,000 requests/min (max capacity)', 'Fastest response speed', 'Same-day support', 'Real-time analytics', 'Premium knowledge base'],
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

  /**
   * Reset payment state for retry
   */
  const resetPaymentState = () => {
    setPaymentStep(PaymentStep.IDLE);
    setPaymentError(null);
    setTxHash(null);
  };

  /**
   * Handle USDT payment - THE GATEKEEPER
   * This is the critical payment flow that gates agent deployment
   * Supports both wagmi (desktop) and thirdweb (mobile) wallet connections
   */
  const handlePayment = async () => {
    if (!isWalletConnected || !walletAddress) {
      setPaymentError('Please connect your wallet first');
      return;
    }

    try {
      setPaymentError(null);
      setTxHash(null);
      setThirdwebTxHash(null);
      setIsThirdwebConfirmed(false);
      setPaymentStep(PaymentStep.TRANSFERRING);

      // Get payment amount for selected tier and billing cycle
      const amountUSDT = PRICING_TIERS[config.pricingTier].usd.toString();
      const amountWei = parseUnits(amountUSDT, 18);

      console.log('[PAYMENT] Initiating transfer:', { 
        amountUSDT, 
        billingCycle, 
        amountWei: amountWei.toString(), 
        treasury: TREASURY_WALLET,
        wallet: thirdwebConnected ? 'thirdweb' : 'wagmi',
        thirdweb_connected: thirdwebConnected,
        wagmi_connected: wagmiConnected
      });

      // Prioritize thirdweb (works on mobile & desktop with WalletConnect)
      if (thirdwebConnected && account) {
        console.log('[PAYMENT] Using thirdweb transaction (mobile/WalletConnect)');
        
        const usdtContract = getContract({
          client: thirdwebClient,
          chain: bscThirdweb,
          address: USDT_CONTRACT_ADDRESS,
        });

        const transferTx = prepareContractCall({
          contract: usdtContract,
          method: 'function transfer(address,uint256) returns (bool)',
          params: [TREASURY_WALLET, amountWei],
        } as any);

        const result = await sendThirdwebTx(transferTx);
        console.log('[PAYMENT] Thirdweb transaction sent:', result.transactionHash);
        setThirdwebTxHash(result.transactionHash);
        setIsThirdwebConfirmed(true);
        setTxHash(result.transactionHash);
        
      } else {
        // Use wagmi transaction if connected via wagmi (desktop wallets)
        console.log('[PAYMENT] Using wagmi transaction (desktop/MetaMask)');
        writeContract({
          address: USDT_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [TREASURY_WALLET, amountWei],
          chain: bsc,
          account: walletAddress as `0x${string}`,
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setPaymentStep(PaymentStep.ERROR);
    }
  };

  /**
   * Listen for payment confirmation (wagmi or thirdweb) and create agent + subscription
   */
  React.useEffect(() => {
    // Check wagmi confirmation (desktop wallets)
    if (isTransferConfirmed && hash && walletAddress && paymentStep !== PaymentStep.TRANSFER_CONFIRMED) {
      console.log('[PAYMENT] Wagmi payment confirmed! Hash:', hash);
      handlePaymentConfirmed(hash);
    }
    
    // Check thirdweb confirmation (mobile wallets)
    if (isThirdwebConfirmed && thirdwebTxHash && walletAddress && paymentStep !== PaymentStep.TRANSFER_CONFIRMED) {
      console.log('[PAYMENT] Thirdweb payment confirmed! Hash:', thirdwebTxHash);
      handlePaymentConfirmed(thirdwebTxHash as `0x${string}`);
    }
  }, [isTransferConfirmed, hash, isThirdwebConfirmed, thirdwebTxHash, walletAddress, paymentStep]);

  /**
   * After payment confirmed, create agent and subscription
   * Works with both wagmi (desktop) and thirdweb (mobile) wallet addresses
   */
  const handlePaymentConfirmed = async (transactionHash: `0x${string}`) => {
    try {
      setPaymentStep(PaymentStep.TRANSFER_CONFIRMED);
      setTxHash(transactionHash);

      // Verify wallet address is available
      if (!walletAddress) {
        throw new Error('Wallet address not available. Please reconnect your wallet.');
      }

      console.log('[SUPABASE] Creating records for wallet:', walletAddress.substring(0, 10) + '...', 
                  'via', thirdwebConnected ? 'thirdweb' : 'wagmi');

      // 1. Get or create user in Supabase
      let user;
      try {
        user = await getOrCreateUser(walletAddress);
        if (!user) {
          throw new Error('Failed to create user account - RLS policy may be blocking. Check Supabase dashboard.');
        }
        console.log('[SUPABASE] User record confirmed:', user.id);
        
        // Update user email if provided
        if (config.email) {
          await updateUserEmail(user.id, config.email);
        }
      } catch (error: any) {
        if (error.message?.includes('row-level security')) {
          throw new Error('Database permission error: Row-Level Security is blocking user creation. Please disable RLS on the users table or add proper policies.');
        }
        throw error;
      }

      // 2. Fetch bot username from Telegram API
      let botUsername = '';
      try {
        console.log('[AGENT] Fetching bot info from Telegram...');
        const botInfoResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
        const botInfoData = await botInfoResponse.json();
        
        if (botInfoData.ok && botInfoData.result.username) {
          botUsername = botInfoData.result.username;
          console.log('[AGENT] Bot username:', botUsername);
        } else {
          throw new Error('Failed to get bot username from Telegram');
        }
      } catch (error: any) {
        console.error('[AGENT] Failed to fetch bot username:', error);
        // Fallback to bot ID if username fetch fails
        const botTokenPrefix = config.botToken.split(':')[0];
        botUsername = `bot_${botTokenPrefix}`;
      }

      // 3. Create telegram agent record (draft status)
      let agent;
      try {
        console.log('[AGENT] Creating agent with username:', botUsername);
        
        agent = await createAgent({
          user_id: user.id,
          project_name: config.projectName,
          bot_handle: botUsername, // Use actual Telegram @username
          bot_token: config.botToken,
          website_url: config.websiteUrl,
          whitepaper_url: config.whitepaper ? 'pending_upload' : undefined,
          personality: config.personality,
          custom_personality: config.customPersonality,
          temperature: config.temperature,
          trigger_keywords: config.triggers,
          custom_faqs: config.customFaqs,
          additional_info: config.additionalInfo,
          pricing_tier: config.pricingTier,
          deployment_status: 'draft'
        });

        if (!agent) {
          throw new Error('Failed to create agent record - no data returned');
        }
      } catch (error: any) {
        console.error('[AGENT] Agent creation error:', error);
        
        // If duplicate key error, the agent might already exist from a previous payment
        if (error.message?.includes('duplicate key')) {
          throw new Error('This bot token is already registered. Each bot can only be used once.');
        }
        
        throw new Error(`Agent creation failed: ${error.message || 'Unknown error'}`);
      }

      setAgentId(agent.id);

      // 4. Create subscription record
      const subscriptionCost = PRICING_TIERS[config.pricingTier].usd;
      
      let subscription;
      try {
        subscription = await createSubscription({
          user_id: user.id,
          agent_id: agent.id,
          subscription_tier: config.pricingTier,
          subscription_cost_usd: subscriptionCost,
          payment_status: 'confirmed',
          transaction_hash: transactionHash,
          transaction_date: new Date().toISOString(),
          expiry_date: billingCycle === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: true
        });

        if (!subscription) {
          throw new Error('Failed to create subscription record');
        }
        console.log('[SUPABASE] Subscription created:', subscription.id, 'expires:', subscription.expiry_date);
      } catch (error: any) {
        console.error('[SUBSCRIPTION] Error:', error);
        throw new Error(`Subscription creation failed: ${error.message || 'Unknown error'}`);
      }

      // 5. Build knowledge base from website (REQUIRED)
      console.log('[KNOWLEDGE] Fetching website content...');
      
      try {
        const knowledgeBase = await buildKnowledgeBase(
          config.websiteUrl,
          config.projectName,
          config.customFaqs,
          config.additionalInfo
        );
        
        // Update agent with knowledge base
        await supabase
          .from('telegram_agents')
          .update({ 
            knowledge_base: knowledgeBase,
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id);
          
        console.log('[KNOWLEDGE] Knowledge base built successfully');
      } catch (error) {
        console.error('[KNOWLEDGE] Failed to build knowledge base:', error);
        // Continue anyway - agent can still work without full knowledge base
      }

      // 6. Process whitepaper asynchronously (OPTIONAL - doesn't block deployment)
      if (config.whitepaper) {
        console.log('[WHITEPAPER] Processing PDF in background...');
        processWhitepaper(config.whitepaper)
          .then(async (whitepaperContent) => {
            console.log('[WHITEPAPER] PDF processed successfully');
            
            // Merge whitepaper into existing knowledge base
            const { data: currentAgent } = await supabase
              .from('telegram_agents')
              .select('knowledge_base')
              .eq('id', agent.id)
              .single();
            
            if (currentAgent) {
              const updatedKnowledgeBase = {
                ...currentAgent.knowledge_base,
                whitepaper: JSON.parse(whitepaperContent)
              };
              
              await supabase
                .from('telegram_agents')
                .update({ 
                  knowledge_base: updatedKnowledgeBase,
                  whitepaper_url: 'processed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', agent.id);
            }
          })
          .catch(error => {
            console.error('[WHITEPAPER] Failed to process PDF:', error);
            // Not critical - agent works fine without whitepaper
          });
      }

      // 5. Register webhook with Telegram
      console.log('[WEBHOOK] Registering webhook with Telegram...');
      try {
        const webhookUrl = `https://smartsentinels.net/api/agent-webhook?agentId=${agent.id}`;
        const webhookResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ['message', 'callback_query']
          })
        });

        const webhookData = await webhookResponse.json();
        if (!webhookData.ok) {
          throw new Error(`Webhook registration failed: ${webhookData.description}`);
        }

        // Update agent status to deployed (with retry for race conditions)
        console.log('[WEBHOOK] Updating agent deployment status to deployed for agent:', agent.id);
        
        let updateData;
        let deployError;
        let retries = 3;
        
        while (retries > 0) {
          const result = await supabase
            .from('telegram_agents')
            .update({ 
              deployment_status: 'active',
              telegram_webhook_url: webhookUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', agent.id)
            .select();
          
          updateData = result.data;
          deployError = result.error;
          
          if (!deployError && updateData && updateData.length > 0) {
            console.log('[WEBHOOK] Successfully updated deployment status');
            break;
          }
          
          retries--;
          if (retries > 0) {
            console.log(`[WEBHOOK] Retrying update... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }

        if (deployError) {
          console.error('[WEBHOOK] Failed to update deployment status after retries:', deployError);
          console.error('[WEBHOOK] Error details:', JSON.stringify(deployError, null, 2));
          throw new Error(`Failed to mark agent as active: ${deployError.message}. This may be a database permission issue. Please check Supabase RLS policies for telegram_agents table.`);
        }

        if (!updateData || updateData.length === 0) {
          console.error('[WEBHOOK] Update returned no data after retries - agent may not exist or RLS blocked the update');
          throw new Error('Failed to verify deployment status update. This may be a database permission issue (RLS). Please check Supabase dashboard.');
        }

        console.log('[WEBHOOK] Webhook registered successfully, agent marked as active:', updateData[0]);
      } catch (error) {
        console.error('[WEBHOOK] Failed to register webhook:', error);
        throw new Error('Failed to deploy bot. Please contact support.');
      }

      // Final verification: Confirm all database records were created successfully
      console.log('[SUPABASE] ✅ Deployment complete:', {
        user_id: user.id,
        agent_id: agent.id,
        subscription_id: subscription.id,
        wallet: walletAddress,
        tx_hash: transactionHash,
        wallet_type: thirdwebConnected ? 'thirdweb' : 'wagmi'
      });

      // 6. Move to Step 4 (success)
      setStep(4);
      toast.success('Agent created and deployed successfully!');

    } catch (error: any) {
      console.error('Post-payment error:', error);
      setPaymentError(error.message || 'Failed to process payment confirmation');
      setPaymentStep(PaymentStep.ERROR);
    }
  };

  /**
   * Deploy bot to Vercel after payment confirmed
   * NOTE: This function is no longer needed - webhook registration happens in handlePaymentConfirmed
   */
  const deployBot = async (agentId: string) => {
    // Deprecated - keeping for backwards compatibility
    console.log('[DEPLOY] Bot deployment now happens via webhook registration');
    setLoading(true);
    try {
      // Bot is already deployed via webhook registration
      setDeployedBotToken(config.projectName.toLowerCase().replace(/\s+/g, '_') + '_bot');
    } catch (error: any) {
      console.error('Deployment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    // This is now just a wrapper - actual deployment happens after payment
    await handlePayment();
  };

  // Step 1: Project Information
  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Email Address</label>
        <input
          type="email"
          value={config.email}
          onChange={(e) => setConfig({ ...config, email: e.target.value })}
          placeholder="your@email.com"
          className="w-full px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
          required
        />
        <p className="text-xs text-muted-foreground mt-1.5">For subscription updates and support</p>
      </div>

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
            {config.whitepaper ? (
              <>
                {config.whitepaper.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({(config.whitepaper.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </>
            ) : (
              'Click to upload or drag & drop'
            )}
          </p>
          <p className="text-xs text-muted-foreground">PDF only, max 20 MB (optional)</p>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (20 MB limit)
                const maxSize = 20 * 1024 * 1024; // 20 MB in bytes
                if (file.size > maxSize) {
                  toast.error(`File too large! Maximum size is 20 MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)} MB.`);
                  e.target.value = ''; // Reset input
                  return;
                }
                setConfig({ ...config, whitepaper: file });
              }
            }}
            className="hidden"
            id="whitepaper-upload"
          />
        </label>
        {config.whitepaper && config.whitepaper.size > 10 * 1024 * 1024 && (
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-600 flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Large file detected. Processing may take longer and could slow down your browser.</span>
          </div>
        )}
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
        <label className="block text-sm font-semibold mb-2.5 text-foreground">Additional Information <span className="text-xs text-muted-foreground font-normal">(recommended)</span></label>
        <textarea
          value={config.additionalInfo || ''}
          onChange={(e) => setConfig({ ...config, additionalInfo: e.target.value })}
          placeholder={`Add important info that may not be on your website:

• Presale dates: "January 1, 2026 at 08:00 UTC"
• Social links: Twitter @yourproject, t.me/yourgroup
• Token price: $0.01 in presale
• Any unique selling points or recent updates`}
          rows={5}
          className="w-full px-4 py-2.5 glass-card border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1.5">⚠️ Dynamic content (countdowns, JS-rendered data) may not be scraped. Add presale dates and social links here for accuracy.</p>
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

      {/* Temperature Control for Hallucination Prevention */}
      <div>
        <label className="block text-sm font-semibold mb-2.5 text-foreground">
          Response Accuracy Control
          <span className="ml-2 text-xs font-normal text-muted-foreground">(Lower = More Factual)</span>
        </label>
        <div className="p-4 glass-card border border-muted rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">More Creative</span>
            <span className="text-sm font-bold text-primary">{config.temperature.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">More Factual</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {config.temperature <= 0.3 && "🎯 Highly factual - Minimizes hallucinations (Recommended)"}
            {config.temperature > 0.3 && config.temperature <= 0.6 && "⚖️ Balanced - Mix of creativity and accuracy"}
            {config.temperature > 0.6 && "✨ Creative - More expressive but may add details"}
          </p>
        </div>
      </div>

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

  // Step 3: Pricing Selection + PAYMENT
  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">Choose your pricing tier based on your expected usage. Each tier provides different request capacity and support levels.</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 glass-card rounded-lg">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            billingCycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/30'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-6 py-2 rounded-lg font-semibold transition relative ${
            billingCycle === 'annual'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/30'
          }`}
        >
          Annual
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            -20%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {pricingOptions.map((option) => {
          const price = billingCycle === 'monthly' ? option.monthlyPrice : option.annualPrice;
          const displayPrice = billingCycle === 'monthly' ? `$${price}` : `$${price}`;
          const savings = billingCycle === 'annual' ? option.monthlyPrice * 12 - option.annualPrice : 0;

          return (
            <button
              key={option.id}
              onClick={() => setConfig({ ...config, pricingTier: option.id })}
              disabled={isTransferring || isConfirming}
              className={`p-6 rounded-lg border-2 transition text-left h-full ${
                config.pricingTier === option.id
                  ? 'border-primary bg-primary/10 shadow-lg lg:scale-105'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/30'
              } ${(isTransferring || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`bg-gradient-to-r ${option.color} text-white p-2.5 rounded w-fit mb-4`}>
                <p className="font-bold text-sm">{option.name}</p>
              </div>
              <p className="text-3xl font-bold mb-1">{displayPrice}</p>
              <p className="text-xs text-muted-foreground mb-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</p>
              {billingCycle === 'annual' && (
                <p className="text-xs text-green-500 font-semibold mb-4">Save ${savings}/year</p>
              )}
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
          );
        })}
      </div>

      {/* Payment Section */}
      <div className="mt-8 p-6 glass-card border-2 border-primary/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">Complete Payment</h3>
            <p className="text-sm text-muted-foreground">
              ${billingCycle === 'monthly' 
                ? pricingOptions.find(p => p.id === config.pricingTier)?.monthlyPrice 
                : pricingOptions.find(p => p.id === config.pricingTier)?.annualPrice
              } in USDT on BSC ({billingCycle === 'monthly' ? 'Monthly' : 'Annual'})
            </p>
          </div>
          {isWalletConnected && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet size={14} />
              <span className="font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
            </div>
          )}
        </div>

        {/* Payment Status Messages */}
        {paymentStep !== PaymentStep.IDLE && (
          <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
            paymentStep === PaymentStep.ERROR
              ? 'bg-red-500/20 border border-red-500/50'
              : paymentStep === PaymentStep.TRANSFER_CONFIRMED
              ? 'bg-green-500/20 border border-green-500/50'
              : 'bg-blue-500/20 border border-blue-500/50'
          }`}>
            {isTransferring || isConfirming ? (
              <Loader size={18} className="animate-spin text-blue-500 flex-shrink-0 mt-0.5" />
            ) : paymentStep === PaymentStep.TRANSFER_CONFIRMED ? (
              <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
            ) : paymentStep === PaymentStep.ERROR ? (
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            ) : null}
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-1 ${
                paymentStep === PaymentStep.ERROR ? 'text-red-600' :
                paymentStep === PaymentStep.TRANSFER_CONFIRMED ? 'text-green-600' :
                'text-blue-600'
              }`}>
                {getPaymentStepMessage(paymentStep)}
              </p>
              {txHash && (
                <a
                  href={getBSCScanLink(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                >
                  View transaction <ExternalLink size={12} />
                </a>
              )}
              {paymentError && (
                <p className="text-xs text-red-600 mt-1">{paymentError}</p>
              )}
            </div>
          </div>
        )}

        {/* Wallet Connection Status - Debug & User Info */}
        <div className="mb-3 p-3 bg-secondary/20 border border-border rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Wallet Status:</span>
            <div className="flex items-center gap-2">
              {isWalletConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-500">Not Connected</span>
                </>
              )}
            </div>
          </div>
          {/* Debug info - shows exactly what the hooks are returning */}
          <div className="text-[10px] text-muted-foreground mt-2 space-y-0.5 font-mono">
            <div>status: {connectionStatus}</div>
            <div>thirdweb: {thirdwebConnected ? '✅' : '❌'} {thirdwebAddress ? thirdwebAddress.slice(0, 8) + '...' : 'null'}</div>
            <div>wagmi: {wagmiConnected ? '✅' : '❌'} {wagmiAddress ? wagmiAddress.slice(0, 8) + '...' : 'null'}</div>
          </div>
          {walletAddress && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Wallet size={14} />
              <span className="font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded">
                {thirdwebConnected ? '📱 Thirdweb' : '🖥️ Wagmi'}
              </span>
            </div>
          )}
          {!isWalletConnected && (
            <p className="text-xs text-amber-500 mt-2">
              ⚠️ Please connect your wallet using the button in the sidebar
            </p>
          )}
        </div>

        {/* Payment Button */}
        <button
          onClick={paymentStep === PaymentStep.ERROR ? resetPaymentState : handlePayment}
          disabled={!isWalletConnected || isTransferring || isConfirming || isThirdwebPending || paymentStep === PaymentStep.TRANSFER_CONFIRMED}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isTransferring || isConfirming || isThirdwebPending ? (
            <>
              <Loader size={18} className="animate-spin" />
              {(isTransferring || isThirdwebPending) ? 'Confirm in Wallet...' : 'Confirming Payment...'}
            </>
          ) : paymentStep === PaymentStep.TRANSFER_CONFIRMED ? (
            <>
              <Check size={18} />
              Payment Confirmed ✅
            </>
          ) : paymentStep === PaymentStep.ERROR ? (
            <>
              <AlertCircle size={18} />
              Retry Payment
            </>
          ) : !isWalletConnected ? (
            <>
              <Wallet size={18} />
              Connect Wallet to Pay
            </>
          ) : (
            <>
              <Wallet size={18} />
              Pay with USDT
            </>
          )}
        </button>
        
        {/* Mobile Wallet Helper */}
        {!isWalletConnected && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            💡 On mobile? Use WalletConnect, MetaMask, Trust Wallet, or Coinbase Wallet
          </p>
        )}

        {/* Manual Verification Button - Show if stuck in "Confirming" for too long OR if transaction hash exists but not confirmed */}
        {(isConfirming && hash) && (
          <button
            onClick={() => {
              console.log('[PAYMENT] Manual confirmation triggered for hash:', hash);
              handlePaymentConfirmed(hash);
            }}
            className="w-full px-6 py-3 border-2 border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-500/10 transition font-semibold mt-2 flex items-center justify-center gap-2"
          >
            <AlertCircle size={18} />
            Payment stuck? Click here if transaction succeeded on BSCScan
          </button>
        )}

        <p className="text-xs text-center text-muted-foreground mt-3">
          Secure payment on BSC. No refunds after agent deployment.
        </p>
      </div>
    </motion.div>
  );

  // Complete: Success
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
              email: '',
              projectName: '',
              websiteUrl: '',
              whitepaper: null,
              botToken: '',
              additionalInfo: '',
              personality: 'funny',
              temperature: 0.3,
              customFaqs: 'Q: What is your project?\nA: We are building innovative solutions for blockchain',
              triggers: ['hello', 'help', 'features'],
              pricingTier: 'starter',
            });
            setDeployedBotToken(null);
          }}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold"
        >
          Create Another Agent
        </button>
        <button
          onClick={() => navigate('/hub/my-agents')}
          className="w-full px-6 py-3 border border-muted text-foreground rounded-lg hover:border-primary/50 hover:bg-muted/30 transition font-medium"
        >
          View Agent
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full">
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
                  disabled={isTransferring || isConfirming}
                  className="flex-1 px-6 py-3 border border-muted rounded-lg hover:border-primary/50 hover:bg-muted/30 transition font-semibold text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
              )}
              {step < 3 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && (!config.projectName || !config.websiteUrl || !config.botToken)) ||
                    (step === 2 && config.personality === 'custom' && !config.customPersonality)
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              )}
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

          {/* Complete: Success */}
          {previewStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2"><Rocket size={20} /> Complete: Success</h3>
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
