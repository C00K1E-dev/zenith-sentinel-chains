import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Upload, FileCode, Zap, AlertTriangle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SOLANA_RPC_URL = 'https://api.devnet.solana.com'; // Switch to mainnet when ready
const AUDIT_PRICE_SOL = 0.1; // 0.1 SOL per audit (~$15 at current prices)
const TREASURY_WALLET = 'YOUR_TREASURY_WALLET_ADDRESS'; // TODO: Replace with actual treasury

interface AuditReport {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
  ipfsUrl?: string;
  vulnerabilities?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  report?: string;
}

const SolanaAudit: React.FC = () => {
  const { isSolflareConnected } = useChain();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [auditing, setAuditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [auditHistory, setAuditHistory] = useState<AuditReport[]>([]);
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);

  // Load audit history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('solana_audit_history');
    if (savedHistory) {
      setAuditHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (Rust files)
    if (!file.name.endsWith('.rs') && !file.name.endsWith('.toml')) {
      toast.error('Please upload a Rust (.rs) or Cargo.toml file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);

    toast.success(`Selected: ${file.name}`);
  }, []);

  const uploadToIPFS = async (content: string, fileName: string): Promise<string> => {
    // Simulate IPFS upload with progress
    setUploadProgress(10);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUploadProgress(30);
    
    // TODO: Replace with actual IPFS upload (Pinata, NFT.Storage, or Web3.Storage)
    // For now, simulate upload
    const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    
    setUploadProgress(60);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUploadProgress(100);
    
    return `ipfs://${mockIPFSHash}`;
  };

  const generateAuditReport = async (code: string, fileName: string): Promise<string> => {
    // TODO: Integrate with Gemini API
    // This is a placeholder - you'll need to add your actual Gemini API integration
    
    const prompt = `You are a Solana smart contract security auditor. Analyze the following Rust code for security vulnerabilities, best practices, and potential issues.

File: ${fileName}

Code:
${code}

Provide a comprehensive audit report including:
1. Critical vulnerabilities (if any)
2. High-priority issues
3. Medium-priority recommendations
4. Low-priority optimizations
5. Best practices compliance
6. Gas optimization suggestions
7. Overall security score (0-100)

Format the response as a detailed markdown report.`;

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock report (replace with actual Gemini API call)
    return `# Solana Smart Contract Audit Report

## File: ${fileName}
**Audit Date:** ${new Date().toLocaleString()}
**Audited By:** Smart Sentinels AI

---

## Executive Summary
✅ **Overall Security Score:** 85/100

The analyzed Solana program demonstrates good security practices with some areas for improvement.

---

## Vulnerability Analysis

### 🔴 Critical Issues (0)
No critical vulnerabilities detected.

### 🟠 High Priority (1)
- **Missing Signer Check:** Line 45 - Ensure proper signer validation in instruction handler
  - **Impact:** Unauthorized transaction execution
  - **Recommendation:** Add \`is_signer\` check in account validation

### 🟡 Medium Priority (2)
- **Arithmetic Overflow:** Line 78 - Use checked arithmetic operations
- **Missing Account Ownership Check:** Line 102 - Verify account ownership

### 🟢 Low Priority (3)
- **Code Documentation:** Add more inline comments
- **Error Messages:** Improve error message clarity
- **Test Coverage:** Increase unit test coverage to 90%+

---

## Best Practices Compliance
✅ Uses Anchor framework
✅ Implements proper account validation
✅ Uses PDA (Program Derived Address) correctly
⚠️ Missing some error handling
⚠️ Could improve documentation

---

## Gas Optimization Suggestions
1. Use \`zero_copy\` for large account data structures
2. Minimize cross-program invocations where possible
3. Optimize data serialization with Borsh

---

## Recommendations
1. **Immediate:** Add missing signer check (Line 45)
2. **Short-term:** Implement checked arithmetic operations
3. **Long-term:** Increase test coverage and documentation

---

**Auditor Notes:** This is an AI-generated audit. Always conduct a manual review for production deployments.
`;
  };

  const handlePayAndAudit = useCallback(async () => {
    if (!isSolflareConnected) {
      toast.error('Please connect your Solflare wallet first');
      return;
    }

    if (!selectedFile || !fileContent) {
      toast.error('Please select a file to audit');
      return;
    }

    try {
      setAuditing(true);
      setUploadProgress(0);

      // Get Solflare provider
      const solflare = (window as any).solflare;
      if (!solflare || !solflare.isConnected) {
        throw new Error('Solflare wallet not connected');
      }

      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      const publicKey = solflare.publicKey;

      // Create payment transaction
      toast.info(`Preparing payment of ${AUDIT_PRICE_SOL} SOL...`);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: AUDIT_PRICE_SOL * LAMPORTS_PER_SOL,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      toast.info('Please approve the transaction in Solflare...');
      const { signature } = await solflare.signAndSendTransaction(transaction);
      
      // Wait for confirmation
      toast.info('Confirming transaction...');
      await connection.confirmTransaction(signature);
      
      toast.success('Payment confirmed! Starting audit...');

      // Upload code to IPFS
      toast.info('Uploading code to IPFS...');
      const ipfsUrl = await uploadToIPFS(fileContent, selectedFile.name);

      // Generate audit report
      toast.info('Analyzing code with AI...');
      const report = await generateAuditReport(fileContent, selectedFile.name);

      // Upload report to IPFS
      const reportIpfsUrl = await uploadToIPFS(report, `${selectedFile.name}_audit_report.md`);

      // Create audit record
      const auditRecord: AuditReport = {
        id: signature,
        fileName: selectedFile.name,
        status: 'completed',
        timestamp: Date.now(),
        txHash: signature,
        ipfsUrl: reportIpfsUrl,
        vulnerabilities: {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        },
        report,
      };

      // Save to history
      const updatedHistory = [auditRecord, ...auditHistory];
      setAuditHistory(updatedHistory);
      localStorage.setItem('solana_audit_history', JSON.stringify(updatedHistory));

      // Show report
      setCurrentReport(auditRecord);

      toast.success('Audit completed successfully! 🎉');

      // TODO: Trigger wSSTL minting on backend
      // This would call your Solana Gateway program to mint wSSTL rewards
      console.log('TODO: Trigger wSSTL minting for NFT holders');

      // Reset form
      setSelectedFile(null);
      setFileContent('');
      setUploadProgress(0);

    } catch (error: any) {
      console.error('Audit failed:', error);
      toast.error(error.message || 'Audit failed. Please try again.');
    } finally {
      setAuditing(false);
    }
  }, [isSolflareConnected, selectedFile, fileContent, auditHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <Shield className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Solana Smart Contract Audit</h1>
          <p className="text-muted-foreground">AI-powered security audits for Rust programs</p>
        </div>
      </div>

      {/* Main Audit Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              Upload Rust Program
            </CardTitle>
            <CardDescription>
              Upload your .rs or Cargo.toml file for security analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".rs,.toml"
                onChange={handleFileSelect}
                disabled={auditing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileCode className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">
                  {selectedFile ? selectedFile.name : 'Click to upload'}
                </p>
                <p className="text-xs text-muted-foreground">
                  .rs or .toml files (max 5MB)
                </p>
              </label>
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="bg-background/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-400">Selected File</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <p className="text-sm truncate">{selectedFile.name}</p>
              </div>
            )}

            {/* Pricing Info */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Audit Price</span>
                <span className="text-lg font-bold text-purple-400">
                  {AUDIT_PRICE_SOL} SOL
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ $15 USD • Includes IPFS storage & AI analysis
              </p>
            </div>

            {/* Audit Button */}
            <Button
              onClick={handlePayAndAudit}
              disabled={!isSolflareConnected || !selectedFile || auditing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {auditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress > 0 ? `Processing... ${uploadProgress}%` : 'Processing...'}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Pay {AUDIT_PRICE_SOL} SOL & Run Audit
                </>
              )}
            </Button>

            {!isSolflareConnected && (
              <p className="text-xs text-center text-yellow-500">
                ⚠️ Please connect Solflare wallet to continue
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current Report */}
        {currentReport && (
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Audit Report
              </CardTitle>
              <CardDescription>{currentReport.fileName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vulnerability Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-400">
                    {currentReport.vulnerabilities?.critical || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-400">
                    {currentReport.vulnerabilities?.high || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">High</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">
                    {currentReport.vulnerabilities?.medium || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Medium</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">
                    {currentReport.vulnerabilities?.low || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Low</div>
                </div>
              </div>

              {/* Report Preview */}
              <div className="bg-background/50 rounded-lg p-4 border border-purple-500/20 max-h-[300px] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {currentReport.report}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (currentReport.ipfsUrl) {
                      window.open(currentReport.ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/'), '_blank');
                    }
                  }}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View on IPFS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    window.open(`https://explorer.solana.com/tx/${currentReport.txHash}?cluster=devnet`, '_blank');
                  }}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View TX
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Info (when no report) */}
        {!currentReport && (
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle>Audit Features</CardTitle>
              <CardDescription>What our AI analyzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Security Vulnerabilities</div>
                    <div className="text-xs text-muted-foreground">
                      Detects reentrancy, overflow, access control issues
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Best Practices</div>
                    <div className="text-xs text-muted-foreground">
                      Anchor patterns, PDA usage, error handling
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Gas Optimization</div>
                    <div className="text-xs text-muted-foreground">
                      Compute unit usage, account size, serialization
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileCode className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Code Quality</div>
                    <div className="text-xs text-muted-foreground">
                      Documentation, testing, maintainability
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Audit History */}
      {auditHistory.length > 0 && (
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>Your recent audits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditHistory.slice(0, 5).map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer"
                  onClick={() => setCurrentReport(audit)}
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-sm font-medium">{audit.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(audit.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {audit.vulnerabilities && (
                      <div className="flex gap-1 text-xs">
                        {audit.vulnerabilities.critical > 0 && (
                          <span className="text-red-400">{audit.vulnerabilities.critical}C</span>
                        )}
                        {audit.vulnerabilities.high > 0 && (
                          <span className="text-orange-400">{audit.vulnerabilities.high}H</span>
                        )}
                        {audit.vulnerabilities.medium > 0 && (
                          <span className="text-yellow-400">{audit.vulnerabilities.medium}M</span>
                        )}
                      </div>
                    )}
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SolanaAudit;
