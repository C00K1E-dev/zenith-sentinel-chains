import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw, Check, X, ExternalLink, Copy, Bot } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TelegramAgentsDashboard from '@/components/TelegramAgentsDashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface PendingVerification {
  id: number;
  wallet_address: string;
  task_id: string;
  task_name: string;
  verification_type: string;
  twitter_username?: string;
  telegram_username?: string;
  telegram_user_id?: string;
  tweet_url?: string;
  tagged_friends?: string;
  points_to_award: number;
  status: string;
  submitted_at: string;
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [telegramVerifications, setTelegramVerifications] = useState<PendingVerification[]>([]);
  const [likeVerifications, setLikeVerifications] = useState<PendingVerification[]>([]);
  const [tagVerifications, setTagVerifications] = useState<PendingVerification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, uniqueTelegrams: 0, uniqueXHandles: 0 });
  const [activeTab, setActiveTab] = useState<'registrations' | 'verifications' | 'telegram' | 'likes' | 'tags' | 'telegram-agents' | 'referrals'>('registrations');
  const [resetWallet, setResetWallet] = useState('');
  const [deleteWallet, setDeleteWallet] = useState('');
  const [nftHolders, setNftHolders] = useState<any[]>([]);
  const [manualCheckWallet, setManualCheckWallet] = useState('');
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  const [isSyncingNFTs, setIsSyncingNFTs] = useState(false);
  
  // REFERRAL: State for referral management
  const [referralStats, setReferralStats] = useState<any>(null);
  const [newReferralCode, setNewReferralCode] = useState('');
  const [newReferralName, setNewReferralName] = useState('');
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);

  const fetchRegistrations = async () => {
    if (!adminKey) {
      alert('Please enter admin key');
      return;
    }

    // Simple admin key validation
    const validAdminKey = import.meta.env.VITE_ADMIN_KEY;
    if (!validAdminKey) {
      alert('Admin authentication not configured');
      return;
    }
    if (adminKey !== validAdminKey) {
      alert('Invalid admin key');
      return;
    }

    setIsLoading(true);
    setIsAuthenticated(true);
    
    try {
      // Fetch registrations
      const response = await fetch(`${API_BASE_URL}/admin/registrations?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        console.log('Fetched registrations:', data.data);
        
        // Transform data to match expected format
        const formattedRegistrations = data.data.map((reg: any) => ({
          wallet: reg.wallet_address,
          x: reg.x_handle,
          telegram: reg.telegram_handle,
          registered: reg.submitted_at || reg.registered_at || reg.created_at
        }));
        
        setRegistrations(formattedRegistrations);
        
        // Calculate stats
        setStats({
          total: formattedRegistrations.length,
          uniqueTelegrams: new Set(formattedRegistrations.map(r => r.telegram).filter(Boolean)).size,
          uniqueXHandles: new Set(formattedRegistrations.map(r => r.x).filter(Boolean)).size
        });
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch registrations:', data.error);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Fetch registrations error:', error);
      }
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive"
      });
    }
    
    // Fetch pending verifications
    await fetchPendingVerifications();
    await fetchTelegramVerifications();
    await fetchLikeVerifications();
    await fetchTagVerifications();
    await fetchNFTHolders();
    
    setIsLoading(false);
  };

  const fetchPendingVerifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-verifications?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        // Filter only Twitter verifications
        const twitterVerifications = data.data.filter((v: PendingVerification) => 
          v.task_id !== 'telegram-community'
        );
        setPendingVerifications(twitterVerifications);
      }
    } catch (error) {
      console.error('Fetch pending verifications error:', error);
    }
  };

  const fetchTelegramVerifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-verifications?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        // Filter only Telegram verifications
        const telegramVers = data.data.filter((v: PendingVerification) => 
          v.task_id === 'telegram-community'
        );
        setTelegramVerifications(telegramVers);
      }
    } catch (error) {
      console.error('Fetch telegram verifications error:', error);
    }
  };

  const fetchLikeVerifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-verifications?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        // Filter only Like Post verifications
        const likeVers = data.data.filter((v: PendingVerification) => 
          v.task_id === 'like-post'
        );
        setLikeVerifications(likeVers);
      }
    } catch (error) {
      console.error('Fetch like verifications error:', error);
    }
  };

  const fetchTagVerifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-verifications?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        // Filter only Tag Friends verifications
        const tagVers = data.data.filter((v: PendingVerification) => 
          v.task_id === 'tag-friends'
        );
        setTagVerifications(tagVers);
      }
    } catch (error) {
      console.error('Fetch tag verifications error:', error);
    }
  };

  const fetchNFTHolders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/nft-holders?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        setNftHolders(data.holders || []);
      }
    } catch (error) {
      console.error('Fetch NFT holders error:', error);
    }
  };

  // REFERRAL: Fetch referral statistics
  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/referral-stats?adminKey=${adminKey}`);
      const data = await response.json();

      if (data.success) {
        setReferralStats(data.data);
      }
    } catch (error) {
      console.error('Fetch referral stats error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch referral statistics",
        variant: "destructive"
      });
    }
  };

  // REFERRAL: Create new referral code
  const handleCreateReferralCode = async () => {
    if (!newReferralCode.trim()) {
      toast({
        title: "Error",
        description: "Referral code cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingReferral(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/create-referral-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          code: newReferralCode,
          name: newReferralName || null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Referral code "${newReferralCode}" created successfully`
        });
        setNewReferralCode('');
        setNewReferralName('');
        fetchReferralStats(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create referral code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Create referral code error:', error);
      toast({
        title: "Error",
        description: "Failed to create referral code",
        variant: "destructive"
      });
    } finally {
      setIsCreatingReferral(false);
    }
  };

  const handleManualNFTCheck = async () => {
    if (!manualCheckWallet.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a wallet address',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingNFT(true);
    try {
      // Check Genesis NFT
      const genesisResponse = await fetch(`${API_BASE_URL}/verify/nft-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: manualCheckWallet,
          nftType: 'genesis'
        })
      });
      const genesisData = await genesisResponse.json();

      // Check AI Audit NFT
      const auditResponse = await fetch(`${API_BASE_URL}/verify/nft-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: manualCheckWallet,
          nftType: 'audit'
        })
      });
      const auditData = await auditResponse.json();

      let message = `Wallet: ${manualCheckWallet.slice(0, 10)}...\n`;
      message += genesisData.verified ? `✓ Genesis NFT: ${genesisData.balance} owned\n` : '✗ No Genesis NFT\n';
      message += auditData.verified ? `✓ AI Audit NFT: ${auditData.balance} owned` : '✗ No AI Audit NFT';

      toast({
        title: 'NFT Check Complete',
        description: message,
      });

      // Refresh the list
      await fetchNFTHolders();
      setManualCheckWallet('');
    } catch (error) {
      console.error('Manual NFT check error:', error);
      toast({
        title: 'Error',
        description: 'Failed to check NFT ownership',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingNFT(false);
    }
  };

  const handleSyncAllNFTHolders = async () => {
    if (!window.confirm('This will scan all registered users for NFT ownership and automatically award points. This may take a few minutes. Continue?')) {
      return;
    }

    setIsSyncingNFTs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sync-nft-holders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'NFT Sync Complete! 🎉',
          description: `Scanned ${data.results.totalScanned} users. Found ${data.results.genesisFound} Genesis NFTs and ${data.results.auditFound} AI Audit NFTs. Awarded ${data.results.pointsAwarded} points.`,
        });
        await fetchNFTHolders();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('NFT sync error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync NFT holders. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingNFTs(false);
    }
  };

  const handleApproveVerification = async (verificationId: number) => {
    if (!window.confirm('Approve this verification and award points?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/approve-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          verificationId,
          adminNotes: 'Manually verified by admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Verification Approved",
          description: "Points have been awarded to the user.",
        });
        fetchPendingVerifications();
        fetchTelegramVerifications();
        fetchLikeVerifications();
        fetchTagVerifications();
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to approve',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast({
        title: "Error",
        description: 'Failed to approve verification',
        variant: "destructive"
      });
    }
  };

  const handleRejectVerification = async (verificationId: number) => {
    if (!window.confirm('Reject this verification?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reject-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          verificationId,
          adminNotes: 'Rejected by admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Verification Rejected",
          description: "Verification request has been rejected.",
        });
        fetchPendingVerifications();
        fetchTelegramVerifications();
        fetchLikeVerifications();
        fetchTagVerifications();
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to reject',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive"
      });
    }
  };

  const handleResetUser = async () => {
    if (!resetWallet.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`Reset all progress for wallet ${resetWallet}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/${resetWallet}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: `Progress reset for ${resetWallet}`,
        });
        setResetWallet('');
        // Refresh the registrations list
        await fetchRegistrations();
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to reset user',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resetting user:', error);
      toast({
        title: "Error",
        description: "Failed to reset user progress",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteWallet.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`PERMANENTLY DELETE user ${deleteWallet} from the database? This will remove all their data and cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user-delete/${deleteWallet}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: `User ${deleteWallet} permanently deleted`,
        });
        setDeleteWallet('');
        // Refresh the registrations list
        await fetchRegistrations();
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to delete user',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const downloadCSV = () => {
    const headers = ['Wallet', 'X Handle', 'Telegram', 'Registered'];
    const rows = registrations.map(r => [
      r.wallet,
      r.x,
      r.telegram,
      new Date(r.registered).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airdrop-registrations-${Date.now()}.csv`;
    a.click();
  };

  const exportAllUsers = async () => {
    try {
      // Fetch ALL users with points from leaderboard (no limit for export)
      const response = await fetch(`${API_BASE_URL}/leaderboard?limit=100000`);
      const data = await response.json();

      if (data.success && data.data) {
        const headers = [
          'Wallet Address', 
          'Total Points', 
          'Fill Form (10pts)', 
          'Follow X (10pts)', 
          'Telegram (10pts)', 
          'Like Post (5pts)', 
          'Tag Friends (15pts)', 
          'MetaMask Bonus (10pts)',
          'Genesis NFT (50pts)', 
          'AI Audit NFT (30pts)', 
          'Twitter Handle', 
          'Telegram Handle'
        ];
        
        const rows = data.data.map((user: any) => {
          const tasks = user.completed_tasks || [];
          
          return [
            user.wallet_address,
            user.total_points,
            tasks.includes('fill-form') ? '10' : '0',
            tasks.includes('follow-x') ? '10' : '0',
            tasks.includes('telegram-community') ? '10' : '0',
            tasks.includes('like-post') ? '5' : '0',
            tasks.includes('tag-friends') ? '15' : '0',
            tasks.includes('connect-metamask') ? '10' : '0',
            tasks.includes('mint-genesis') ? '50' : '0',
            tasks.includes('mint-audit') ? '30' : '0',
            user.twitter_username || user.x_handle || '',
            user.telegram_handle || ''
          ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `airdrop-points-distribution-${Date.now()}.csv`;
        a.click();

        toast({
          title: "Export Successful",
          description: `Exported ${data.data.length} users with their points. NFT holders included!`,
        });
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export user data",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string = 'Address') => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && fetchRegistrations()}
            />
            <Button onClick={fetchRegistrations} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Airdrop Admin Dashboard</h1>
        <Button 
          onClick={exportAllUsers}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2" size={16} />
          Export All Users (Points Distribution)
        </Button>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 ${activeTab === 'registrations' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          Registrations ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2 ${activeTab === 'verifications' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          X/Twitter Verifications ({pendingVerifications.filter(v => v.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2 ${activeTab === 'telegram' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          Telegram Verifications ({telegramVerifications.filter(v => v.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`px-4 py-2 ${activeTab === 'likes' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          Like Post Verifications ({likeVerifications.filter(v => v.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 ${activeTab === 'tags' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          Tag Friends Verifications ({tagVerifications.filter(v => v.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('telegram-agents')}
          className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'telegram-agents' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          <Bot size={18} />
          Telegram AI Agents
        </button>
        <button
          onClick={() => {
            setActiveTab('referrals');
            if (adminKey) fetchReferralStats();
          }}
          className={`px-4 py-2 ${activeTab === 'referrals' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
        >
          Referrals {referralStats && `(${referralStats.totals.totalCodes})`}
        </button>
      </div>

      {/* Stats */}
      {activeTab === 'registrations' && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Total Registrations</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Unique X Handles</p>
              <p className="text-3xl font-bold">{stats.uniqueXHandles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Unique Telegrams</p>
              <p className="text-3xl font-bold">{stats.uniqueTelegrams}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <Button onClick={() => {
          if (activeTab === 'registrations') fetchRegistrations();
          else if (activeTab === 'verifications') fetchPendingVerifications();
          else if (activeTab === 'telegram') fetchTelegramVerifications();
          else if (activeTab === 'likes') fetchLikeVerifications();
          else if (activeTab === 'tags') fetchTagVerifications();
        }} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
        {activeTab === 'registrations' && (
          <Button onClick={downloadCSV}>
            <Download size={16} className="mr-2" />
            Download CSV
          </Button>
        )}
      </div>

      {/* Registrations Table */}
      {activeTab === 'registrations' && (
        <>
        {/* Reset User Progress Section - Per User */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset User Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">Wallet Address</label>
                <Input
                  placeholder="Paste wallet address or copy from table below"
                  value={resetWallet}
                  onChange={(e) => setResetWallet(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleResetUser}
                variant="destructive"
                disabled={!resetWallet.trim()}
              >
                🔄 Reset Progress
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ This will clear all points, completed tasks, pending verifications, and registration data for the specified wallet. This action cannot be undone.
            </p>
          </CardContent>
        </Card>

        {/* Delete User Section - Permanent Deletion */}
        <Card className="mb-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Delete User Permanently</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <Input
                  placeholder="Paste wallet address to delete permanently"
                  value={deleteWallet}
                  onChange={(e) => setDeleteWallet(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleDeleteUser}
                variant="destructive"
                disabled={!deleteWallet.trim()}
              >
                🗑️ Delete User
              </Button>
            </div>
            <p className="text-sm text-destructive mt-2 font-medium">
              🚨 DANGER: This will PERMANENTLY DELETE the user from the database. All their data will be removed and cannot be recovered. Use with extreme caution.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Wallet</th>
                    <th className="text-left py-2 px-4">X Handle</th>
                    <th className="text-left py-2 px-4">Telegram</th>
                    <th className="text-left py-2 px-4">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-800 hover:text-white transition-colors">
                      <td className="py-2 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{reg.wallet.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(reg.wallet, 'Wallet address')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy wallet address"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4">{reg.x}</td>
                      <td className="py-2 px-4">{reg.telegram}</td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(reg.registered).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Pending Verifications Table */}
      {activeTab === 'verifications' && (
        <>
        {/* Reset User Progress Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset User Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">Wallet Address</label>
                <Input
                  placeholder="Paste wallet address or copy from table below"
                  value={resetWallet}
                  onChange={(e) => setResetWallet(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleResetUser}
                variant="destructive"
                disabled={!resetWallet.trim()}
              >
                🔄 Reset Progress
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ This will clear all points, completed tasks, pending verifications, and registration data for the specified wallet. This action cannot be undone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>X/Twitter Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Wallet</th>
                    <th className="text-left py-2 px-4">Task</th>
                    <th className="text-left py-2 px-4">X/Twitter Username</th>
                    <th className="text-left py-2 px-4">Points</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Submitted</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b hover:bg-gray-800 hover:text-white transition-colors">
                      <td className="py-2 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{verification.wallet_address.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(verification.wallet_address, 'Wallet address')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy wallet address"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4">{verification.task_name}</td>
                      <td className="py-2 px-4">
                        {verification.twitter_username ? (
                          <a 
                            href={`https://twitter.com/${verification.twitter_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            @{verification.twitter_username}
                            <ExternalLink size={12} />
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-4 font-bold">{verification.points_to_award}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          verification.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {verification.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(verification.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        {verification.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApproveVerification(verification.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleRejectVerification(verification.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <X size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingVerifications.length === 0 && (
                <p className="text-center py-8 text-gray-500">No pending verifications</p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Telegram Verifications Table */}
      {activeTab === 'telegram' && (
        <>
        {/* Reset User Progress Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset User Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">Wallet Address</label>
                <Input
                  placeholder="Paste wallet address or copy from table below"
                  value={resetWallet}
                  onChange={(e) => setResetWallet(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleResetUser}
                variant="destructive"
                disabled={!resetWallet.trim()}
              >
                🔄 Reset Progress
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ This will clear all points, completed tasks, pending verifications, and registration data for the specified wallet. This action cannot be undone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram Community Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Wallet</th>
                    <th className="text-left py-2 px-4">Telegram Username</th>
                    <th className="text-left py-2 px-4">Points</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Submitted</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {telegramVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b hover:bg-gray-800 hover:text-white transition-colors">
                      <td className="py-2 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{verification.wallet_address.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(verification.wallet_address, 'Wallet address')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy wallet address"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {verification.telegram_username ? (
                          <a 
                            href={`https://t.me/${verification.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            @{verification.telegram_username}
                            <ExternalLink size={12} />
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-4 font-bold">{verification.points_to_award}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          verification.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {verification.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(verification.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        {verification.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApproveVerification(verification.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleRejectVerification(verification.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <X size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {telegramVerifications.length === 0 && (
                <p className="text-center py-8 text-gray-500">No pending telegram verifications</p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Like Post Verifications Tab */}
      {activeTab === 'likes' && (
        <>
        {/* Reset User Progress Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset User Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">Wallet Address</label>
                <Input
                  placeholder="Paste wallet address or copy from table below"
                  value={resetWallet}
                  onChange={(e) => setResetWallet(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleResetUser}
                variant="destructive"
                disabled={!resetWallet.trim()}
              >
                🔄 Reset Progress
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ This will clear all points, completed tasks, pending verifications, and registration data for the specified wallet. This action cannot be undone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Like Post Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Wallet</th>
                    <th className="text-left py-2 px-4">X/Twitter Username</th>
                    <th className="text-left py-2 px-4">Points</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Submitted</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {likeVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b hover:bg-gray-800 hover:text-white transition-colors">
                      <td className="py-2 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{verification.wallet_address.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(verification.wallet_address, 'Wallet address')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy wallet address"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {verification.twitter_username ? (
                          <a 
                            href={`https://twitter.com/${verification.twitter_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            @{verification.twitter_username}
                            <ExternalLink size={12} />
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-4 font-bold">{verification.points_to_award}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          verification.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {verification.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(verification.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        {verification.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApproveVerification(verification.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleRejectVerification(verification.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <X size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {likeVerifications.length === 0 && (
                <p className="text-center py-8 text-gray-500">No pending like post verifications</p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Tag Friends Verifications Tab */}
      {activeTab === 'tags' && (
        <>
        {/* Reset User Progress Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset User Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">Wallet Address</label>
                <Input
                  placeholder="Paste wallet address or copy from table below"
                  value={resetWallet}
                  onChange={(e) => setResetWallet(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={handleResetUser}
                variant="destructive"
                disabled={!resetWallet.trim()}
              >
                🔄 Reset Progress
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ This will clear all points, completed tasks, pending verifications, and registration data for the specified wallet. This action cannot be undone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tag Friends Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Wallet</th>
                    <th className="text-left py-2 px-4">X/Twitter Username</th>
                    <th className="text-left py-2 px-4">Tagged Friends</th>
                    <th className="text-left py-2 px-4">Points</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Submitted</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tagVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b hover:bg-gray-800 hover:text-white transition-colors">
                      <td className="py-2 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{verification.wallet_address.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(verification.wallet_address, 'Wallet address')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy wallet address"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {verification.twitter_username ? (
                          <a 
                            href={`https://twitter.com/${verification.twitter_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            @{verification.twitter_username}
                            <ExternalLink size={12} />
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-4">
                        {verification.tagged_friends || '-'}
                      </td>
                      <td className="py-2 px-4 font-bold">{verification.points_to_award}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          verification.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {verification.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(verification.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        {verification.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApproveVerification(verification.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleRejectVerification(verification.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <X size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tagVerifications.length === 0 && (
                <p className="text-center py-8 text-gray-500">No pending tag friends verifications</p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Telegram AI Agents Tab */}
      {activeTab === 'telegram-agents' && (
        <TelegramAgentsDashboard />
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div>
          {/* Create New Referral Code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Referral Code</label>
                  <Input
                    value={newReferralCode}
                    onChange={(e) => setNewReferralCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="e.g., bogdanpromo"
                    className="font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Name (Optional)</label>
                  <Input
                    value={newReferralName}
                    onChange={(e) => setNewReferralName(e.target.value)}
                    placeholder="e.g., Bogdan - Telegram Promoter"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCreateReferralCode}
                    disabled={isCreatingReferral || !newReferralCode}
                  >
                    {isCreatingReferral ? <Loader2 className="animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Statistics Overview */}
          {referralStats && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">Total Referral Codes</p>
                    <p className="text-3xl font-bold">{referralStats.totals.totalCodes}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">Total Referrals</p>
                    <p className="text-3xl font-bold">{referralStats.totals.totalReferrals}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">Total Commissions (SSTL)</p>
                    <p className="text-3xl font-bold">{referralStats.totals.totalCommissions}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Codes Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Codes Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Code</th>
                          <th className="text-left p-3">Name</th>
                          <th className="text-left p-3">Referral Link</th>
                          <th className="text-right p-3">Referrals</th>
                          <th className="text-right p-3">Earnings (SSTL)</th>
                          <th className="text-center p-3">Status</th>
                          <th className="text-left p-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralStats.codes.map((code: any) => (
                          <tr key={code.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <code className="bg-gray-100 px-2 py-1 rounded">{code.code}</code>
                            </td>
                            <td className="p-3">{code.name || '-'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                  smartsentinels.net/hub/airdrop?ref={code.code}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`https://smartsentinels.net/hub/airdrop?ref=${code.code}`);
                                    toast({
                                      title: "Copied!",
                                      description: "Referral link copied to clipboard"
                                    });
                                  }}
                                >
                                  <Copy size={14} />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 text-right font-semibold">{code.total_referrals}</td>
                            <td className="p-3 text-right font-semibold text-green-600">{code.total_earnings}</td>
                            <td className="p-3 text-center">
                              <Badge variant={code.is_active ? 'default' : 'secondary'}>
                                {code.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {new Date(code.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Referred Users */}
              {referralStats.referredUsers && referralStats.referredUsers.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Referred Users ({referralStats.referredUsers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Referral Code</th>
                            <th className="text-left p-3">Wallet Address</th>
                            <th className="text-left p-3">X Handle</th>
                            <th className="text-left p-3">Telegram</th>
                            <th className="text-left p-3">Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralStats.referredUsers.map((user: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.referred_by}</code>
                              </td>
                              <td className="p-3 font-mono text-sm">
                                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                              </td>
                              <td className="p-3 text-sm">{user.x_handle || '-'}</td>
                              <td className="p-3 text-sm">{user.telegram_handle || '-'}</td>
                              <td className="p-3 text-sm text-gray-600">
                                {new Date(user.submitted_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {referralStats.recentActivity && referralStats.recentActivity.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Recent Referral Activity (Commissions Earned)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Referral Code</th>
                            <th className="text-left p-3">Referred Wallet</th>
                            <th className="text-right p-3">Points Earned</th>
                            <th className="text-right p-3">Commission (5%)</th>
                            <th className="text-left p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralStats.recentActivity.slice(0, 20).map((activity: any) => (
                            <tr key={activity.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{activity.referral_code}</code>
                              </td>
                              <td className="p-3 font-mono text-sm">
                                {activity.referred_wallet.slice(0, 6)}...{activity.referred_wallet.slice(-4)}
                              </td>
                              <td className="p-3 text-right">{activity.points_earned}</td>
                              <td className="p-3 text-right font-semibold text-green-600">{activity.commission_points}</td>
                              <td className="p-3 text-sm text-gray-600">
                                {new Date(activity.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!referralStats && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <p>Loading referral statistics...</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
