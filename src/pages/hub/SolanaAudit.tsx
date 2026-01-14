import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, FileCode, Loader2, Download, Cloud, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { uploadAuditReportToIPFS } from '@/utils/ipfs';
import styles from '@/components/sidebarComponents/sidebarAIAuditSmartContract.module.css';

// --- CONFIGURATION CONSTANTS ---
const SOLANA_RPC_URL = 'https://api.devnet.solana.com'; // Switch to mainnet when ready
const AUDIT_PRICE_SOL = 0.5; // 0.5 SOL per audit
const TREASURY_WALLET = 'F3w8zsZqjP2RRs3yGrAEEEVqKM5VdayEDtB6ZQRdGQx1'; // Treasury wallet
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_MODEL = "gemini-2.5-flash-lite";
const API_URL_TEMPLATE = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=`;
const LOGO_URL = "/ss-icon.svg";

// --- TYPE DEFINITIONS ---
interface VulnerabilityBreakdown {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  Informational: number;
  Gas: number;
}

interface Vulnerability {
  swcId?: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational" | "Gas";
  title: string;
  description: string;
  lineNumbers?: number[];
}

interface AuditData {
  contractName: string;
  version: string;
  securityScore: number;
  overallAssessment: string;
  vulnerabilityBreakdown: VulnerabilityBreakdown;
  vulnerabilities: Vulnerability[];
  transactionHash?: string;
}

// --- Circular Progress Component ---
interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  score, 
  size = 80, 
  strokeWidth = 6 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    if (score >= 60) return '#F97316';
    return '#EF4444';
  };

  const color = getColor(score);

  return (
    <div className={styles.circularProgress}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={styles.progressCircle}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className={styles.progressText} style={{ color }}>
        {score}/100
      </div>
    </div>
  );
};

// --- SOLANA AUDIT PROMPT (Adapted from BNB Chain) ---
const useSolanaAuditPrompt = () => {
  return useMemo(() => {
    return `You are a specialized Solana Smart Contract Security Auditor for the SmartSentinels network.
Your task is to analyze Rust/Anchor Solana programs and generate ONLY a single, deterministic JSON object.

--- SOLANA-SPECIFIC SECURITY REQUIREMENTS ---

CRITICAL SOLANA VULNERABILITIES:
• Missing Signer Checks: Verify all instructions require proper signers
• PDA Validation: Ensure Program Derived Addresses are validated correctly
• Account Ownership: Check account ownership before operations
• Account Initialization: Verify accounts are initialized before use
• Arbitrary CPI: Check for Cross-Program Invocation security
• Integer Overflow: Use checked math operations (checked_add, checked_sub, etc.)
• Reentrancy: Guard against reentrant CPI calls
• Missing Rent Exemption: Ensure accounts have sufficient rent
• Unchecked Math: Flag arithmetic without overflow protection
• Unvalidated Account Data: Check deserialization and validation

ANCHOR FRAMEWORK PATTERNS:
• Constraint Violations: Check #[account] constraints are properly used
• Init Constraints: Verify init, init_if_needed usage
• Seeds Validation: Check PDA seeds are properly validated
• Signer Requirements: Verify Signer<'info> usage
• Account Types: Check proper Account<'info, T> usage
• Context Validation: Ensure Context<T> is properly defined

SCORING FORMULA:
START AT 100 POINTS:
• Critical (Fund loss, unauthorized access): -20 points PER ISSUE
• High (Logic errors, missing validation): -10 points PER ISSUE  
• Medium (Best practice violations): -4 points PER ISSUE
• Low (Code quality issues): -2 points PER ISSUE
• Informational (Suggestions): -0.5 points PER ISSUE
• Gas (Compute unit optimization): -0.2 points PER ISSUE

RESPONSE FORMAT (STRICT JSON):
{
  "contractName": "ProgramName",
  "version": "rust version or N/A",
  "securityScore": 85,
  "overallAssessment": "Two paragraph summary of security posture",
  "vulnerabilityBreakdown": {
    "Critical": 0,
    "High": 1,
    "Medium": 2,
    "Low": 3,
    "Informational": 1,
    "Gas": 2
  },
  "vulnerabilities": [
    {
      "severity": "High",
      "title": "Missing Signer Check",
      "description": "Detailed explanation of the vulnerability",
      "lineNumbers": [45, 46, 47]
    }
  ]
}

CRITICAL: Include ONLY 3-5 most relevant line numbers per vulnerability.`;
  }, []);
};

// --- PREMIUM HTML REPORT GENERATOR (Same styling as BNB Chain) ---
const generateAuditHTML = (auditData: AuditData): string => {
  const {
    contractName,
    version,
    securityScore,
    vulnerabilityBreakdown,
    vulnerabilities,
    overallAssessment,
    transactionHash
  } = auditData;

  const scorePercentage = (securityScore / 100) * 502.4;
  const strokeDashoffset = 502.4 - scorePercentage;
  
  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'FAIR';
    if (score >= 60) return 'POOR';
    return 'CRITICAL';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10B981'; // Green - Excellent
    if (score >= 80) return '#F59E0B'; // Yellow/Orange - Good
    if (score >= 60) return '#F97316'; // Orange - Fair/Poor
    return '#EF4444'; // Red - Critical
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const shortTxHash = transactionHash ? `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}` : 'N/A';
  const totalFindings = vulnerabilities.length;

  const scoreColor = getScoreColor(securityScore);
  const scoreGrade = getScoreGrade(securityScore);

  const severityOrder = ['Critical', 'High', 'Medium', 'Low', 'Informational', 'Gas'];
  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartSentinels Solana Audit Report - ${contractName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #9945FF;
            --primary-light: #B388FF;
            --accent: #14F195;
            --success: #10B981;
            --warning: #F59E0B;
            --danger: #EF4444;
            --bg-dark: #0A0A0F;
            --bg-card: #12121A;
            --bg-elevated: #1A1A25;
            --border: rgba(255,255,255,0.08);
            --text-primary: #F8FAFC;
            --text-secondary: #94A3B8;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            background: var(--bg-dark);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            min-height: 100vh;
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: 
                radial-gradient(ellipse at 20% 0%, rgba(153, 69, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 100%, rgba(20, 241, 149, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(153, 69, 255, 0.03) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
        }

        /* Subtle Grid Pattern */
        body::after {
            content: '';
            position: fixed;
            inset: 0;
            background-image: 
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 0;
        }

        .page-container { position: relative; z-index: 1; }
        
        .premium-header {
            background: linear-gradient(180deg, rgba(153, 69, 255, 0.1) 0%, transparent 100%);
            border-bottom: 1px solid var(--border);
            padding: 2rem 0;
            position: relative;
        }

        .premium-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }

        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }

        .logo-icon img {
            width: 56px;
            height: 56px;
            object-fit: contain;
        }

        .brand-name {
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
            font-family: 'Space Grotesk', sans-serif;
        }

        .report-type {
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            background: linear-gradient(90deg, #9945FF 0%, #14F195 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .premium-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            position: relative;
        }

        .premium-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }

        .card-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .card-header h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .card-header-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #9945FF 0%, #7D2ACC 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .card-body { padding: 1.5rem; }

        .score-ring {
            position: relative;
            width: 180px;
            height: 180px;
        }

        .score-ring svg {
            transform: rotate(-90deg);
        }

        .score-number {
            font-family: 'Space Grotesk', sans-serif !important;
            font-size: 3rem !important;
            font-weight: 700 !important;
            color: ${scoreColor} !important;
        }

        .score-badge {
            margin-top: 1rem;
            padding: 0.5rem 1.5rem;
            background: linear-gradient(135deg, rgba(153, 69, 255, 0.2) 0%, rgba(153, 69, 255, 0.1) 100%) !important;
            border: 1px solid rgba(153, 69, 255, 0.3) !important;
            border-radius: 100px;
            font-weight: 600 !important;
            font-size: 0.875rem !important;
            color: ${scoreColor} !important;
            letter-spacing: 0.1em;
        }

        .score-value {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .score-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .threat-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 0.75rem;
        }

        .threat-pill {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            border: 1px solid var(--border);
        }

        .threat-pill::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
        }

        .threat-pill.critical::before { background: linear-gradient(90deg, #DC2626, #EF4444); }
        .threat-pill.high::before { background: linear-gradient(90deg, #EA580C, #F97316); }
        .threat-pill.medium::before { background: linear-gradient(90deg, #D97706, #F59E0B); }
        .threat-pill.low::before { background: linear-gradient(90deg, #2563EB, #3B82F6); }
        .threat-pill.info::before { background: linear-gradient(90deg, #475569, #64748B); }
        .threat-pill.gas::before { background: linear-gradient(90deg, #0891B2, #06B6D4); }

        .threat-pill .threat-count {
            font-family: 'Space Grotesk', sans-serif !important;
            font-size: 1.75rem !important;
            font-weight: 700 !important;
        }

        .threat-pill.critical .threat-count { color: #EF4444; }
        .threat-pill.high .threat-count { color: #F97316; }
        .threat-pill.medium .threat-count { color: #F59E0B; }
        .threat-pill.low .threat-count { color: #3B82F6; }
        .threat-pill.info .threat-count { color: #64748B; }
        .threat-pill.gas .threat-count { color: #06B6D4; }

        .threat-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-top: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .finding-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            margin-bottom: 1rem;
            overflow: hidden;
        }

        .finding-header {
            padding: 1rem 1.25rem;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .severity-indicator {
            width: 4px;
            border-radius: 2px;
            align-self: stretch;
            min-height: 50px;
        }

        .severity-indicator.critical { background: linear-gradient(180deg, #EF4444, #DC2626); }
        .severity-indicator.high { background: linear-gradient(180deg, #F97316, #EA580C); }
        .severity-indicator.medium { background: linear-gradient(180deg, #F59E0B, #D97706); }
        .severity-indicator.low { background: linear-gradient(180deg, #3B82F6, #2563EB); }
        .severity-indicator.info { background: linear-gradient(180deg, #64748B, #475569); }
        .severity-indicator.informational { background: linear-gradient(180deg, #64748B, #475569); }
        .severity-indicator.gas { background: linear-gradient(180deg, #06B6D4, #0891B2); }

        .severity-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 100px;
            font-size: 0.625rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .severity-badge.critical { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .severity-badge.high { background: rgba(249, 115, 22, 0.15); color: #F97316; border: 1px solid rgba(249, 115, 22, 0.3); }
        .severity-badge.medium { background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
        .severity-badge.low { background: rgba(59, 130, 246, 0.15); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.3); }
        .severity-badge.info { background: rgba(100, 116, 139, 0.15); color: #94A3B8; border: 1px solid rgba(100, 116, 139, 0.3); }
        .severity-badge.informational { background: rgba(100, 116, 139, 0.15); color: #94A3B8; border: 1px solid rgba(100, 116, 139, 0.3); }
        .severity-badge.gas { background: rgba(6, 182, 212, 0.15); color: #06B6D4; border: 1px solid rgba(6, 182, 212, 0.3); }

        .finding-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-top: 0.5rem;
        }

        .finding-swc {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .finding-body {
            padding: 1rem 1.25rem;
        }

        .finding-description {
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.7;
        }

        .finding-lines {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1rem;
            padding: 0.5rem 0.75rem;
            background: rgba(153, 69, 255, 0.1);
            border-radius: 6px;
            font-size: 0.75rem;
            color: var(--primary-light);
        }

        /* Detail Row */
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border);
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .detail-value {
            font-size: 0.875rem;
            color: var(--text-primary);
            font-weight: 500;
        }

        .detail-value.tx-link {
            color: var(--primary) !important;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .detail-value.tx-link:hover {
            color: var(--primary-light) !important;
            text-decoration: underline;
        }

        /* Section Title */
        .section-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .section-title::before {
            content: '';
            width: 4px;
            height: 24px;
            background: linear-gradient(180deg, var(--primary), #14F195);
            border-radius: 2px;
        }

        /* Executive Summary */
        .executive-summary {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
        }

        .summary-text {
            font-size: 0.9375rem;
            color: var(--text-secondary);
            line-height: 1.8;
        }

        /* Premium Footer */
        .premium-footer {
            padding: 0 1.5rem;
            margin-top: 3rem;
        }

        .footer-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 2rem;
            overflow: hidden;
            position: relative;
        }

        .footer-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(153, 69, 255, 0.3), transparent);
        }

        .footer-content {
            display: flex;
            align-items: center;
            gap: 2rem;
        }

        .footer-seal {
            flex-shrink: 0;
        }

        .seal-image {
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .seal-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 20px rgba(20, 241, 149, 0.3));
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }

        .footer-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .footer-disclaimer {
            font-size: 0.75rem;
            color: var(--text-secondary);
            line-height: 1.7;
        }

        /* Download Button */
        .download-section {
            text-align: center;
            padding: 2rem;
        }

        .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #9945FF 0%, #7D2ACC 100%);
            color: white;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(153, 69, 255, 0.3);
        }

        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(153, 69, 255, 0.4);
        }

        .ipfs-version .download-section { display: none; }

        @media print {
            body::before, body::after {
                display: none !important;
            }

            .page-container {
                background: white !important;
            }

            .download-section {
                display: none !important;
            }

            /* Critical: Prevent page breaks inside cards and findings */
            .premium-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            .finding-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 1rem !important;
            }

            /* Keep summary with its title */
            .executive-summary {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Section headers should never break from content below */
            .section-title {
                break-after: avoid !important;
                page-break-after: avoid !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Keep section headers with at least first item */
            section {
                break-inside: auto !important;
                page-break-inside: auto !important;
            }

            section > h2 {
                break-after: avoid !important;
                page-break-after: avoid !important;
            }

            /* Threat grid should stay together if possible */
            .threat-grid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Footer can break if needed */
            .premium-footer {
                break-inside: auto !important;
                page-break-inside: auto !important;
            }

            /* Header should not break */
            .premium-header {
                break-after: avoid !important;
                page-break-after: avoid !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Orphan/widow control */
            p, h1, h2, h3, h4, h5, h6 {
                orphans: 3;
                widows: 3;
            }

            /* Make all cards light for print */
            .premium-card, .finding-card, .executive-summary {
                background: rgba(248, 249, 250, 0.95) !important;
                border: 1px solid #e0e0e0 !important;
            }

            .card-header, .finding-header {
                background: rgba(248, 249, 250, 0.95) !important;
                border-bottom: 1px solid #d0d0d0 !important;
            }

            .card-body, .finding-body {
                background: rgba(248, 249, 250, 0.95) !important;
            }

            /* Override all dark backgrounds */
            main, section, div {
                background: transparent !important;
            }

            main.max-w-5xl {
                background: transparent !important;
            }

            /* Text colors for print - ensure all text is visible */
            .card-header h2, .finding-title, .section-title {
                color: #1a1a1a !important;
                -webkit-text-fill-color: #1a1a1a !important;
            }

            .brand-name, .report-type {
                color: #1a1a1a !important;
                -webkit-text-fill-color: #1a1a1a !important;
                background: none !important;
            }

            .detail-label {
                color: #666666 !important;
            }

            .detail-value, .finding-description {
                color: #1a1a1a !important;
            }

            .footer-disclaimer, .footer-title {
                color: #4a4a4a !important;
            }

            .finding-swc, .threat-label {
                color: #666666 !important;
            }

            /* Print color adjustment for colored elements */
            .score-number, .score-badge, .threat-count, .severity-badge, .severity-indicator {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Text colors for general elements */
            p, span, div, strong, em {
                color: #1a1a1a;
            }

            /* But preserve specific colored elements */
            .score-number {
                color: inherit !important;
            }

            /* Score - preserve color based on score value */
            .score-number {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .score-label {
                color: #666666 !important;
            }

            .score-badge {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: #f0f4ff !important;
                border: 2px solid currentColor !important;
            }

            .summary-text, .summary-text strong {
                color: #1a1a1a !important;
            }

            /* Header adjustments */
            .premium-header {
                background: #f0f4ff !important;
                border-bottom: 2px solid #3B82F6 !important;
            }

            .premium-header::after {
                display: none !important;
            }

            /* Score ring - make visible with color preserved */
            .score-ring svg {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .score-ring svg circle[stroke="rgba(255,255,255,0.1)"] {
                stroke: #e0e0e0 !important;
            }

            /* Keep score ring progress color */
            .score-ring svg circle:nth-child(2) {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .summary-text {
                color: #374151 !important;
            }

            /* Threat pills - keep colored top borders */
            .threat-pill {
                background: #f8f9fa !important;
                border: 2px solid #e0e0e0 !important;
                position: relative !important;
            }

            .threat-pill::before {
                height: 4px !important;
            }

            .threat-pill.critical::before {
                background: linear-gradient(90deg, #DC2626, #EF4444) !important;
            }

            .threat-pill.high::before {
                background: linear-gradient(90deg, #EA580C, #F97316) !important;
            }

            .threat-pill.medium::before {
                background: linear-gradient(90deg, #D97706, #F59E0B) !important;
            }

            .threat-pill.low::before {
                background: linear-gradient(90deg, #2563EB, #3B82F6) !important;
            }

            .threat-pill.info::before {
                background: linear-gradient(90deg, #475569, #64748B) !important;
            }

            .threat-pill.gas::before {
                background: linear-gradient(90deg, #0891B2, #06B6D4) !important;
            }

            .threat-pill .threat-count {
                font-family: 'Space Grotesk', sans-serif !important;
                font-size: 1.75rem !important;
                font-weight: 700 !important;
            }

            .threat-pill.critical .threat-count { color: #EF4444 !important; }
            .threat-pill.high .threat-count { color: #F97316 !important; }
            .threat-pill.medium .threat-count { color: #F59E0B !important; }
            .threat-pill.low .threat-count { color: #3B82F6 !important; }
            .threat-pill.info .threat-count { color: #64748B !important; }
            .threat-pill.gas .threat-count { color: #06B6D4 !important; }

            /* Footer */
            .premium-footer {
                padding: 2rem 0 !important;
            }

            .footer-card {
                background: #f8f9fa !important;
                border: 1px solid #e0e0e0 !important;
                width: 100% !important;
                max-width: none !important;
            }

            .footer-card::before {
                display: none !important;
            }

            /* Severity badges */
            .severity-badge.critical {
                background: #fee2e2 !important;
                color: #991b1b !important;
                border: 1px solid #ef4444 !important;
            }

            .severity-badge.high {
                background: #fed7aa !important;
                color: #9a3412 !important;
                border: 1px solid #f97316 !important;
            }

            .severity-badge.medium {
                background: #fef3c7 !important;
                color: #92400e !important;
                border: 1px solid #f59e0b !important;
            }

            .severity-badge.low {
                background: #dbeafe !important;
                color: #1e40af !important;
                border: 1px solid #3b82f6 !important;
            }

            .severity-badge.info, .severity-badge.informational {
                background: #f1f5f9 !important;
                color: #334155 !important;
                border: 1px solid #64748b !important;
            }

            .severity-badge.gas {
                background: #cffafe !important;
                color: #155e75 !important;
                border: 1px solid #06b6d4 !important;
            }

            /* Finding lines indicator */
            .finding-lines {
                background: #eff6ff !important;
                border: 1px solid #bfdbfe !important;
                color: #1e40af !important;
            }

            /* Code snippets */
            code {
                background: #f1f5f9 !important;
                color: #1e3a8a !important;
                border: 1px solid #cbd5e1 !important;
            }

            .section-title::before {
                background: linear-gradient(180deg, #3B82F6, #1e40af) !important;
            }

            /* Ensure proper spacing and no awkward breaks */
            main {
                page-break-before: auto !important;
            }

            /* Individual detail rows should not break */
            .detail-row {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Score container should stay together */
            .score-container {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Threat pills should not break individually */
            .threat-pill {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* Allow findings section to span pages naturally */
            section:has(.finding-card) {
                break-inside: auto !important;
                page-break-inside: auto !important;
            }

            /* But keep individual findings together */
            .finding-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 1rem !important;
            }

            /* Footer card should stay together */
            .footer-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <header class="premium-header">
            <div class="max-w-5xl mx-auto px-6">
                <div class="logo-container">
                    <div class="logo-icon">
                        <img src="/ss-icon.svg" alt="SmartSentinels Logo" />
                    </div>
                    <div>
                        <div class="brand-name">SmartSentinels</div>
                        <div class="report-type">Solana Audit Report</div>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-5xl mx-auto px-6 py-8">

            <!-- Program Details Card with Score -->
            <div class="premium-card mb-8">
                <div class="card-header">
                    <div class="card-header-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <h2>Program Details</h2>
                </div>
                <div class="card-body">
                    <div class="flex flex-col lg:flex-row gap-6">
                        <!-- Details Section -->
                        <div class="flex-1">
                            <div class="detail-row">
                                <span class="detail-label">Program Name</span>
                                <span class="detail-value">${contractName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Rust Version</span>
                                <span class="detail-value">${version}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Audit Engine</span>
                                <span class="detail-value">SmartSentinels AI</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Audit Date</span>
                                <span class="detail-value">${currentDate}</span>
                            </div>
                            ${transactionHash ? `<div class="detail-row">
                                <span class="detail-label">TX Hash</span>
                                <a href="https://explorer.solana.com/tx/${transactionHash}?cluster=devnet" target="_blank" rel="noopener noreferrer" class="detail-value tx-link" style="font-family: 'Space Grotesk', monospace;">${shortTxHash} ↗</a>
                            </div>` : ''}
                        </div>
                        <!-- Score Section -->
                        <div class="flex-shrink-0">
                            <div class="score-container" style="display: flex; flex-direction: column; align-items: center; padding: 2rem;">
                                <div class="score-ring">
                                    <svg width="180" height="180" viewBox="0 0 180 180">
                                        <!-- Background circle -->
                                        <circle cx="90" cy="90" r="80" stroke="rgba(255,255,255,0.1)" stroke-width="12" fill="none"/>
                                        <!-- Progress circle -->
                                        <circle cx="90" cy="90" r="80" stroke="url(#scoreGradient)" stroke-width="12" fill="none"
                                            stroke-dasharray="502.4" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round"/>
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stop-color="${scoreColor}"/>
                                                <stop offset="100%" stop-color="${scoreColor}"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div class="score-value" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                        <span class="score-number">${securityScore}</span>
                                        <span class="score-label" style="font-size: 0.875rem; color: var(--text-secondary);">out of 100</span>
                                    </div>
                                </div>
                                <div class="score-badge">${scoreGrade}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Executive Summary Section -->
            <section class="mb-8">
                <h2 class="section-title">Executive Summary</h2>
                <div class="executive-summary">
                    <p class="summary-text">${overallAssessment}</p>
                </div>
            </section>

            <!-- Threat Summary Section -->
            <section class="mb-8">
                <h2 class="section-title">Vulnerability Summary</h2>
                <div class="threat-grid">
                    <div class="threat-pill critical">
                        <div class="threat-count">${vulnerabilityBreakdown.Critical}</div>
                        <div class="threat-label">Critical</div>
                    </div>
                    <div class="threat-pill high">
                        <div class="threat-count">${vulnerabilityBreakdown.High}</div>
                        <div class="threat-label">High</div>
                    </div>
                    <div class="threat-pill medium">
                        <div class="threat-count">${vulnerabilityBreakdown.Medium}</div>
                        <div class="threat-label">Medium</div>
                    </div>
                    <div class="threat-pill low">
                        <div class="threat-count">${vulnerabilityBreakdown.Low}</div>
                        <div class="threat-label">Low</div>
                    </div>
                    <div class="threat-pill info">
                        <div class="threat-count">${vulnerabilityBreakdown.Informational}</div>
                        <div class="threat-label">Info</div>
                    </div>
                    <div class="threat-pill gas">
                        <div class="threat-count">${vulnerabilityBreakdown.Gas}</div>
                        <div class="threat-label">Gas</div>
                    </div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 1rem;">
                    Total of <strong style="color: var(--text-primary);">${totalFindings} findings</strong> identified across all severity levels.
                </p>
            </section>

            <!-- Detailed Findings Section -->
            <section class="mb-8">
                <h2 class="section-title">Detailed Findings</h2>

                ${sortedVulnerabilities.map(vuln => {
                  const severityClass = vuln.severity.toLowerCase();
                  const lineNumbersDisplay = vuln.lineNumbers && vuln.lineNumbers.length > 0 
                    ? `<div class="finding-lines">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Lines: ${vuln.lineNumbers.join(', ')}
                      </div>`
                    : '';

                  return `<div class="finding-card">
                    <div class="finding-header">
                        <div class="severity-indicator ${severityClass}"></div>
                        <div class="flex-1">
                            <span class="severity-badge ${severityClass}">${vuln.severity}</span>
                            <h3 class="finding-title">${vuln.title}</h3>
                            ${vuln.swcId ? `<span class="finding-swc">${vuln.swcId}</span>` : ''}
                        </div>
                    </div>
                    <div class="finding-body">
                        <p class="finding-description">${vuln.description}</p>
                        ${lineNumbersDisplay}
                    </div>
                </div>`;
                }).join('')}

            </section>

        </main>

        <!-- Premium Footer -->
        <footer class="premium-footer">
            <div class="max-w-5xl mx-auto px-6">
                <div class="footer-card">
                    <div class="footer-content">
                        <div class="footer-seal">
                            <div class="seal-image">
                                <img src="/ssHoloNew.svg" alt="SmartSentinels Verified" />
                            </div>
                        </div>
                        <div class="footer-text">
                            <div class="footer-title">SmartSentinels Verified Audit</div>
                            <p class="footer-disclaimer">
                                This report was generated by SmartSentinels AI Audit Engine using deterministic analysis for Solana programs. While this analysis provides comprehensive automated security assessment for Rust/Anchor smart contracts, it is recommended to complement AI findings with additional review approaches for maximum assurance. This report does not constitute financial advice or guarantee of security.
                            </p>
                        </div>
                    </div>

                    <!-- Verification Badge -->
                    <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: center; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">Powered by SmartSentinels AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>

        <!-- Download Section -->
        <div class="download-section">
            <button class="download-btn" onclick="window.print()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF Report
            </button>
        </div>

    </div>

</body>
</html>`;
};

// --- MAIN COMPONENT ---
const SolanaAudit: React.FC = () => {
  const { isSolflareConnected } = useChain();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [contractName, setContractName] = useState('');
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    isSolflareConnected 
      ? 'Wallet connected! Upload your Rust program to begin audit.' 
      : 'Connect Solflare wallet and upload Rust program to begin'
  );
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [ipfsUploadResult, setIpfsUploadResult] = useState<{hash?: string, url?: string, error?: string} | null>(null);

  const auditPrompt = useSolanaAuditPrompt();

  // Update status message based on wallet connection
  useEffect(() => {
    if (isSolflareConnected) {
      setStatusMessage('Wallet connected! Upload your Rust program to begin audit.');
    } else {
      setStatusMessage('Connect Solflare wallet and upload Rust program to begin');
    }
  }, [isSolflareConnected]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
        setContractName(file.name.replace('.rs', ''));
      };
      reader.readAsText(file);
    }
  };

  const callGeminiApi = async (payload: any): Promise<any> => {
    const apiUrl = API_URL_TEMPLATE + GEMINI_API_KEY;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: payload.contents,
        systemInstruction: payload.systemInstruction,
        generationConfig: {
          temperature: 0.0,
          topP: 0.1,
          topK: 1,
          candidateCount: 1,
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
        },
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('AI generated no content');
    }

    let auditData;
    try {
      auditData = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('JSON parse failed:', parseError);
      throw new Error('Invalid JSON from AI');
    }

    return auditData;
  };

  const handleRunAudit = async () => {
    if (!isSolflareConnected) {
      toast.error('Please connect Solflare wallet');
      return;
    }

    if (!fileContent.trim()) {
      toast.error('Please upload or paste program code');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Processing payment (0.5 SOL)...');

    try {
      // Get Solflare wallet
      const solflare = (window as any).solflare;
      if (!solflare || !solflare.isConnected) {
        throw new Error('Solflare wallet not connected');
      }

      // Create Solana connection
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      
      // Get sender's public key
      const fromPubkey = new PublicKey(solflare.publicKey.toString());
      const toPubkey = new PublicKey(TREASURY_WALLET);
      
      // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = AUDIT_PRICE_SOL * LAMPORTS_PER_SOL;

      console.log('💰 Creating payment transaction:', {
        from: fromPubkey.toString(),
        to: toPubkey.toString(),
        amount: `${AUDIT_PRICE_SOL} SOL`,
        lamports: lamports
      });

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      console.log('📝 Requesting signature from Solflare...');
      setStatusMessage('Please confirm payment in Solflare wallet...');

      // Sign and send transaction through Solflare
      const { signature } = await solflare.signAndSendTransaction(transaction);
      
      console.log('✅ Transaction sent:', signature);
      setStatusMessage('Confirming payment on Solana blockchain...');

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Payment confirmed:', signature);
      setStatusMessage('Payment confirmed. Running AI audit...');

      const payload = {
        contents: [{ parts: [{ text: `Analyze this Solana program:\n\n${fileContent}` }] }],
        systemInstruction: { parts: [{ text: auditPrompt }] },
      };

      const structuredData = await callGeminiApi(payload);
      
      // Calculate breakdown from vulnerabilities
      const breakdown = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Informational: 0,
        Gas: 0
      };

      if (structuredData.vulnerabilities && Array.isArray(structuredData.vulnerabilities)) {
        structuredData.vulnerabilities.forEach((vuln: any) => {
          const severity = vuln.severity?.toLowerCase();
          if (severity === 'critical') breakdown.Critical++;
          else if (severity === 'high') breakdown.High++;
          else if (severity === 'medium') breakdown.Medium++;
          else if (severity === 'low') breakdown.Low++;
          else if (severity === 'informational') breakdown.Informational++;
          else if (severity === 'gas') breakdown.Gas++;
        });
      }

      const correctedData = {
        ...structuredData,
        vulnerabilityBreakdown: breakdown,
        transactionHash: signature // Use actual Solana transaction signature
      };

      setAuditData(correctedData);
      setStatusMessage(`✅ Audit completed! TX: ${signature.substring(0, 8)}...`);
      toast.success('Audit completed!');
    } catch (error) {
      console.error('Audit failed:', error);
      const errorMessage = (error as Error).message;
      setStatusMessage('❌ Audit failed: ' + errorMessage);
      toast.error(errorMessage.includes('User rejected') ? 'Payment cancelled' : 'Audit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = () => {
    if (auditData) {
      const htmlContent = generateAuditHTML(auditData);
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    }
  };

  const handleUploadToIPFS = async () => {
    if (!auditData) return;

    try {
      setIpfsUploading(true);
      const htmlContent = generateAuditHTML(auditData);
      const ipfsHtmlContent = htmlContent.replace('<body>', '<body class="ipfs-version">');
      
      const result = await uploadAuditReportToIPFS(ipfsHtmlContent, auditData.contractName, auditData);
      setIpfsUploadResult(result);
      
      if (result.success) {
        toast.success('Report uploaded to IPFS!');
      } else {
        toast.error('IPFS upload failed');
      }
    } catch (error) {
      console.error('IPFS upload error:', error);
      toast.error('IPFS upload failed');
    } finally {
      setIpfsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-green-400 bg-clip-text text-transparent">
            Solana Program Audit
          </CardTitle>
          <CardDescription>
            Upload your Rust/Anchor program for comprehensive security analysis
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* CARD 1: Features Information */}
          <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-green-400/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-xl sm:text-2xl font-semibold font-orbitron mb-2 text-white">
                  SmartSentinels Solana Audit Engine
                </h4>
                <p className="text-sm text-muted-foreground">
                  Specialized security analysis for Rust & Anchor programs on Solana
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-foreground">Solana Security Checks</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Specialized checks for <strong className="text-purple-400">PDA validation, signer verification, account ownership, CPI security</strong>, and Anchor framework patterns.
                </p>
              </div>

              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-foreground">Rust & Anchor Analysis</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deep analysis of <strong className="text-green-400">Rust code patterns, Anchor constraints, integer overflow protection</strong>, and memory safety.
                </p>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-foreground">Decentralized Reports</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permanently store audit reports on <strong className="text-blue-400">IPFS</strong> for immutable, verifiable proof. Download professional PDF reports anytime.
                </p>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-foreground">Comprehensive Reports</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Detailed <strong className="text-orange-400">vulnerability breakdown</strong> with severity levels, line numbers, and security scores based on Solana best practices.
                </p>
              </div>
            </div>
          </div>

          {/* Launchpad Partnership CTA */}
          <div className="bg-gradient-to-r from-purple-500/10 via-green-400/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-sm text-foreground leading-relaxed">
                  <strong className="text-purple-400">Partner with SmartSentinels:</strong> We're looking to collaborate with launchpads and development teams to integrate our AI audit service. Offer automated security audits to your projects before launch.
                </div>
              </div>
              <a
                href="mailto:contact@smartsentinels.io?subject=Launchpad%20Partnership%20Inquiry&body=Hello%20SmartSentinels%20Team,%0D%0A%0D%0AI'm%20interested%20in%20partnering%20to%20integrate%20your%20AI%20audit%20service.%0D%0A%0D%0AName:%0D%0AProject/Company:%0D%0AWebsite:%0D%0A%0D%0ABest%20regards"
                className="flex-shrink-0 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-300">
              Wallet Status: {isSolflareConnected ? '🟢 Connected' : '🔴 Not Connected'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Paste Rust Code:</label>
            <Textarea
              placeholder="Paste your Rust/Anchor program code here or upload .rs file..."
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="w-fit">
            <input type="file" id="file-upload-rs" accept=".rs" style={{ display: 'none' }} onChange={handleFileUpload} />
            <label htmlFor="file-upload-rs" className="flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-purple-500 hover:text-white cursor-pointer transition-colors">
              <Upload size={14} />
              Upload .rs File
            </label>
          </div>

          {/* Run Audit Button */}
          <Button
            onClick={handleRunAudit}
            disabled={isLoading || !fileContent.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Run Audit (0.5 SOL)'
            )}
          </Button>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-300">{statusMessage}</p>
            </div>
          )}

          {/* Audit Results */}
          {auditData && (
            <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Program Name</p>
                  <p className="font-semibold">{auditData.contractName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Security Score</p>
                  <div className="flex items-center justify-center mt-2">
                    <CircularProgress score={auditData.securityScore} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Overall Assessment</p>
                <p className="text-sm text-gray-200">{auditData.overallAssessment}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Vulnerability Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div className="text-red-400">Critical: {auditData.vulnerabilityBreakdown.Critical}</div>
                  <div className="text-orange-400">High: {auditData.vulnerabilityBreakdown.High}</div>
                  <div className="text-yellow-400">Medium: {auditData.vulnerabilityBreakdown.Medium}</div>
                  <div className="text-blue-400">Low: {auditData.vulnerabilityBreakdown.Low}</div>
                  <div className="text-purple-400">Informational: {auditData.vulnerabilityBreakdown.Informational}</div>
                  <div className="text-cyan-400">Gas: {auditData.vulnerabilityBreakdown.Gas}</div>
                </div>
              </div>

              {/* Vulnerabilities Preview */}
              {auditData.vulnerabilities && auditData.vulnerabilities.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Vulnerabilities Found:</p>
                  <div className="space-y-2 sm:space-y-3">
                    {auditData.vulnerabilities.slice(0, 3).map((vuln, index) => (
                      <div key={index} className="p-3 sm:p-4 bg-gray-700/50 rounded border-l-4 border-red-500">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <h4 className="font-bold text-red-400 text-sm sm:text-base">{vuln.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded self-start ${
                            vuln.severity === 'Critical' ? 'bg-red-900 text-red-200' :
                            vuln.severity === 'High' ? 'bg-orange-900 text-orange-200' :
                            vuln.severity === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                            'bg-blue-900 text-blue-200'
                          }`}>
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{vuln.description}</p>
                        {vuln.lineNumbers && vuln.lineNumbers.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">Lines: {vuln.lineNumbers.join(', ')}</p>
                        )}
                      </div>
                    ))}
                    {auditData.vulnerabilities.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{auditData.vulnerabilities.length - 3} more vulnerabilities. View full report for details.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleViewReport}>
                  <FileCode className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
                
                <Button variant="outline" onClick={handleUploadToIPFS} disabled={ipfsUploading}>
                  {ipfsUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      Upload to IPFS
                    </>
                  )}
                </Button>
              </div>

              {/* IPFS Result */}
              {ipfsUploadResult && (
                <div className="p-4 rounded-lg border">
                  {ipfsUploadResult.hash ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">Uploaded to IPFS!</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Hash: <span className="font-mono">{ipfsUploadResult.hash}</span></div>
                        {ipfsUploadResult.url && (
                          <a href={ipfsUploadResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                            {ipfsUploadResult.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : ipfsUploadResult.error && (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Error: {ipfsUploadResult.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SolanaAudit;
