import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Upload, Play, FileText, Wrench, Brain, DollarSign, CheckCircle, Award, Loader2, Wallet, AlertTriangle, X, Search, Cloud, ExternalLink } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import styles from './sidebarAIAuditSmartContract.module.css';
import auditReportStyles from './auditReportStyles.css?raw';
import { ContractAddressInput } from '../ContractAddressInput';
import type { ContractSourceCode } from '../../services/etherscan';

// --- IMPORTS FOR WALLET AND TOKEN TRANSFER ---
import { useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { getContract, prepareContractCall, readContract, createThirdwebClient } from 'thirdweb';
import { bsc } from 'thirdweb/chains';
import { parseUnits, formatUnits, keccak256, toHex } from 'viem';
import { SSTL_TOKEN_ADDRESS, SSTL_TOKEN_ABI, AUDIT_GATEWAY_ADDRESS, AUDIT_GATEWAY_ABI, POUW_POOL_ADDRESS, POUW_POOL_ABI } from "../../contracts/index";
import { uploadAuditReportToIPFS } from "../../utils/ipfs";

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// --- Circular Progress Component for Security Score ---
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

  // Color logic based on score
  const getColor = (score: number) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#F59E0B'; // Yellow/Orange
    if (score >= 60) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const color = getColor(score);

  return (
    <div className={styles.circularProgress}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
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
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      {/* Score text in center */}
      <div className={styles.progressText} style={{ color }}>
        {score}/100
      </div>
    </div>
  );
};

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

interface RemediationState {
    title: string;
    code: string;
    loading: boolean;
}

// --- CONFIGURATION CONSTANTS ---
// Using the specified API Key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using gemini-2.5-flash-lite with paid tier (no rate limits)
const API_MODEL = "gemini-2.5-flash-lite";
const API_URL_TEMPLATE = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=`;
// Logo URL - Using SVG for perfect scaling
const LOGO_URL = "/ss-icon.svg";

// Payment Configuration - BSC MAINNET (DEPLOYED ✅)
const BSC_MAINNET_CHAIN_ID = 56;
const SSTL_CONTRACT = SSTL_TOKEN_ADDRESS as `0x${string}`;
const PAYMENT_RECIPIENT = '0x46e451d555ebCB4ccE5087555a07F6e69D017b05' as `0x${string}`; // Your Wallet (AI Agent Creator)
const AUDIT_COST_BNB = '0.45'; // 0.45 BNB (default)
const AUDIT_COST_SSTL = '1000'; // 1000 SSTL tokens (fallback)
const SERVICE_OWNER = '0x46e451d555ebCB4ccE5087555a07F6e69D017b05'; // AI Audit service owner address

// --- 1. JSON SCHEMA DEFINITION (Deterministic Output) ---
// Note: This structure is critical for PoUW consistency.

const AUDIT_REPORT_SCHEMA = {
    type: "OBJECT",
    properties: {
        contractName: { type: "STRING" },
        version: { type: "STRING", description: "The Solidity pragma version used." },
        securityScore: { type: "NUMBER", description: "Calculated score from 0 to 100." },
        overallAssessment: { type: "STRING", description: "A two-paragraph summary of the contract's security posture and key takeaways." },
        vulnerabilityBreakdown: {
            type: "OBJECT",
            properties: {
                Critical: { type: "NUMBER" },
                High: { type: "NUMBER" },
                Medium: { type: "NUMBER" },
                Low: { type: "NUMBER" },
                Informational: { type: "NUMBER" },
                Gas: { type: "NUMBER" },
            },
        },
        vulnerabilities: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    swcId: { type: "STRING", description: "The standard SWC ID (e.g., SWC-107) or 'N/A' if custom." },
                    severity: { type: "STRING", enum: ["Critical", "High", "Medium", "Low", "Informational", "Gas"] },
                    title: { type: "STRING", description: "A concise title for the finding (e.g., Reentrancy Vulnerability)." },
                    description: { type: "STRING", description: "Detailed explanation of the issue." },
                    lineNumbers: { type: "ARRAY", items: { type: "INTEGER" }, description: "CRITICAL: Include ONLY 3-5 most relevant line numbers. Never list entire file ranges. If issue spans many lines, pick the 3-5 most critical ones." },
                },
                required: ["severity", "title", "description"],
            },
        },
    },
    required: ["contractName", "securityScore", "vulnerabilityBreakdown", "vulnerabilities"],
};

// --- 2. Hook to generate the specialized System Prompt ---

const useAuditPrompt = () => {
    return useMemo(() => {
        return (
            "You are a specialized Smart Contract Static Analysis Engine for the SmartSentinels PoUW network. " +
            "Your task is to analyze the provided Solidity code and generate ONLY a single, deterministic JSON object " +
            "that strictly adheres to the provided schema. You MUST use a low temperature for maximum consistency." +
            "\n\n--- AUTHORITATIVE RESEARCH SOURCES ---" +
            "\n• Primary Research Source: EEA EthTrust Security Levels Specification v-after-2" +
            "\n• Reference: https://entethalliance.github.io/eta-registry/security-levels-spec.html" +
            "\n• This specification defines comprehensive security requirements for smart contract auditing" +
            "\n• Use the following security levels and requirements as your authoritative guide:" +
            "\n\n--- EEA ETHTRUST SECURITY LEVELS OVERVIEW ---" +
            "\n• Level S: Automated static analysis requirements (most can be checked by tools)" +
            "\n• Level M: Manual review requirements (requires human judgment)" +
            "\n• Level Q: Comprehensive business logic and documentation review" +
            "\n\n--- KEY SECURITY REQUIREMENTS FROM ETA REGISTRY ---" +
            "\n\nLEVEL S REQUIREMENTS:" +
            "\n• External Calls: Check return values, use Checks-Effects-Interactions pattern" +
            "\n• No delegatecall(): Prohibit unless protected and documented" +
            "\n• No tx.origin: Use msg.sender for authorization instead" +
            "\n• No exact balance checks: Avoid == comparisons with balances" +
            "\n• No abi.encodePacked() with consecutive variable length args: Prevents hash collisions" +
            "\n• No selfdestruct(): Prohibit unless protected and documented" +
            "\n• No assembly {}: Prohibit unless protected and documented" +
            "\n• Compiler bugs: Check for known Solidity compiler vulnerabilities" +
            "\n• Floating pragma: Avoid ^ or >= in pragma statements" +
            "\n• Modern compiler: Use Solidity 0.8.0+ for built-in overflow protection" +
            "\n\nLEVEL M REQUIREMENTS:" +
            "\n• Handle external call errors: Properly manage call failures" +
            "\n• Protect external calls: Only call audited, controlled contracts" +
            "\n• Avoid read-only reentrancy: Protect against state reading during reentrancy" +
            "\n• Document special code: Explain use of assembly, external calls, etc." +
            "\n• Safe overflow/underflow: Guard arithmetic when needed" +
            "\n• Sources of randomness: Use cryptographically secure randomness" +
            "\n• Don't misuse block data: Avoid block.timestamp/block.number for critical logic" +
            "\n• Proper signature verification: Validate signatures correctly" +
            "\n• No improper signature replay: Protect against signature reuse" +
            "\n• Homoglyph attacks: Check for misleading Unicode characters" +
            "\n\nLEVEL Q REQUIREMENTS:" +
            "\n• Document contract logic: Provide detailed business logic specification" +
            "\n• Document system architecture: Explain overall system design" +
            "\n• Document threat models: Identify and analyze potential attack vectors" +
            "\n• Implement as documented: Code must match documentation" +
            "\n• Enforce least privilege: Access controls must be minimal necessary" +
            "\n• Verify external calls: Ensure called contracts are safe" +
            "\n• Process all inputs: Validate and handle all possible inputs" +
            "\n• State changes trigger events: Emit events for all state modifications" +
            "\n• Protect against MEV: Mitigate miner extractable value attacks" +
            "\n• Protect against ordering attacks: Prevent transaction reordering exploits" +
            "\n• Protect against oracle failure: Handle oracle malfunctions" +
            "\n• Code linting: Follow Solidity best practices" +
            "\n\n--- SWC VULNERABILITY CLASSIFICATION ---" +
            "\nUse the following SWC (Smart Contract Weakness Classification) registry as your primary reference:" +
            "\n• SWC-136: Unencrypted Private Data On-Chain - Check for private data stored on-chain without encryption" +
            "\n• SWC-135: Code With No Effects - Check for unreachable code or statements with no effect" +
            "\n• SWC-134: Message call with hardcoded gas amount - Check for .call{ gas: 12345 } with fixed gas values" +
            "\n• SWC-133: Hash Collisions With Multiple Variable Length Arguments - Check for abi.encodePacked in hash functions" +
            "\n• SWC-132: Unexpected Ether balance - Check for contracts that unexpectedly receive ether" +
            "\n• SWC-131: Presence of unused variables - Check for declared but unused variables" +
            "\n• SWC-130: Right-To-Left-Override control character (U+202E) - Check for U+202E character in strings" +
            "\n• SWC-129: Typographical Error - Check for common typos in function/variable names" +
            "\n• SWC-128: DoS With Block Gas Limit - Check for unbounded loops that can exceed gas limits" +
            "\n• SWC-127: Arbitrary Jump with Function Type Variable - Check for function pointers used for jumps" +
            "\n• SWC-126: Insufficient Gas Griefing - Check for operations that can be griefed with insufficient gas" +
            "\n• SWC-125: Incorrect Inheritance Order - Check for inheritance order issues" +
            "\n• SWC-124: Write to Arbitrary Storage Location - Check for assembly or direct storage manipulation" +
            "\n• SWC-123: Requirement Violation - Check for violated business logic requirements" +
            "\n• SWC-122: Lack of Proper Signature Verification - Check for improper ecrecover usage" +
            "\n• SWC-121: Missing Protection against Signature Replay Attacks - Check for missing nonce validation" +
            "\n• SWC-120: Weak Sources of Randomness from Chain Attributes - Check for block.timestamp, block.number, etc. used for randomness" +
            "\n• SWC-119: Shadowing State Variables - Check for local variables shadowing state variables" +
            "\n• SWC-118: Incorrect Constructor Name - Check for function constructor() instead of constructor()" +
            "\n• SWC-117: Signature Malleability - Check for signature malleability issues" +
            "\n• SWC-116: Block values as a proxy for time - Check for block.timestamp used for time-dependent logic" +
            "\n• SWC-115: Authorization through tx.origin - Check for authentication using tx.origin" +
            "\n• SWC-114: Transaction Order Dependence - Check for front-running vulnerabilities" +
            "\n• SWC-113: DoS with Failed Call - Check for require() on external calls that can fail" +
            "\n• SWC-112: Delegatecall to Untrusted Callee - Check for delegatecall to user-controlled addresses" +
            "\n• SWC-111: Use of Deprecated Solidity Functions - Check for suicide, sha3, callcode usage" +
            "\n• SWC-110: Assert Violation - Check for assert() usage that can consume all gas" +
            "\n• SWC-109: Uninitialized Storage Pointer - Check for uninitialized storage variables" +
            "\n• SWC-108: State Variable Default Visibility - Check for state variables without explicit visibility" +
            "\n• SWC-107: Reentrancy - Check for external calls before state updates" +
            "\n• SWC-106: Unprotected SELFDESTRUCT Instruction - Check for selfdestruct without access control" +
            "\n• SWC-105: Unprotected Ether Withdrawal - Check for send/transfer without proper checks" +
            "\n• SWC-104: Unchecked Call Return Value - Check for missing return value checks on low-level calls" +
            "\n• SWC-103: Floating Pragma - Check for pragma statements using ^ or >=" +
            "\n• SWC-102: Outdated Compiler Version - Check for compiler versions older than 0.8.0" +
            "\n• SWC-101: Integer Overflow and Underflow - Check for arithmetic operations without SafeMath (pre-0.8.0)" +
            "\n• SWC-100: Function Default Visibility - Check for functions without explicit visibility modifiers" +
            "\n\n--- CRITICAL: FALSE POSITIVE PREVENTION & CONTEXT-AWARE SCORING ---" +
            "\n⚠️ IMPORTANT: Evaluate patterns in context. Consider both security AND usability." +
            "\n\n1. SWC-104 (Unchecked Call Return Value):" +
            "\n   ✅ SAFE: (bool success, ) = addr.call{value: x}(\"\"); require(success, \"message\");" +
            "\n   ⚠️ RISKY: (bool success, ) = addr.call{value: x}(\"\"); if (success) { ... } // Logic continues on failure" +
            "\n   ❌ CRITICAL: addr.call{value: x}(\"\"); // No validation at all" +
            "\n   → Flag based on whether failure is properly handled with require/revert" +
            "\n\n2. SWC-108 (State Variable Default Visibility):" +
            "\n   ✅ LOW RISK: Public variables for prices, limits, addresses (necessary for DApp integration)" +
            "\n   ⚠️ MEDIUM: Public variables for user balances, allocations (can reveal business data)" +
            "\n   ❌ HIGH: Public variables for admin keys, secrets, sensitive internal state" +
            "\n   → Severity depends on what data is exposed and why" +
            "\n\n3. SWC-105 (Unprotected Ether Withdrawal):" +
            "\n   ✅ LOW RISK: withdraw() with onlyOwner + nonReentrant + Ownable2Step" +
            "\n   ⚠️ MEDIUM: withdraw() with only basic Ownable (1-step ownership transfer risk)" +
            "\n   ⚠️ MEDIUM: withdraw() to arbitrary address without checks" +
            "\n   ❌ CRITICAL: withdraw() with NO access control or weak access control" +
            "\n   → Report but adjust severity: Well-protected = LOW, Unprotected = CRITICAL" +
            "\n   → Note: Mention centralization risk even if access-controlled (for transparency)" +
            "\n\n4. SWC-114 (Transaction Order Dependence):" +
            "\n   ✅ LOW/INFO: Sequential token ID minting in NFT collections (expected behavior)" +
            "\n   ⚠️ MEDIUM: Price-based logic where order affects fairness (presales, auctions)" +
            "\n   ❌ HIGH: DEX trading, oracle updates, liquidations (MEV exploitation risk)" +
            "\n   → Distinguish cosmetic ordering from exploitable MEV opportunities" +
            "\n\n5. SWC-121 (Missing Protection against Signature Replay):" +
            "\n   ✅ N/A: Contracts with NO ecrecover/signature verification (skip entirely)" +
            "\n   ⚠️ MEDIUM: Signature verification without nonces or deadlines" +
            "\n   ❌ HIGH: Cross-chain signature reuse possible" +
            "\n   → Only report if signatures are actually used in the contract" +
            "\n\n6. Defensive Programming vs Gas Waste:" +
            "\n   ✅ GOOD: Extra checks for critical paths (payment validation, access control)" +
            "\n   ⚠️ Consider marking as GAS optimization if checks are truly redundant" +
            "\n   → Balance security and efficiency - explain the tradeoff" +
            "\n\n7. Gas Optimizations:" +
            "\n   ✅ Only suggest if pattern is NOT already implemented" +
            "\n   ✅ Check for: array.length caching, unchecked loops, storage vs memory" +
            "\n   → Read carefully before suggesting - avoid duplicate recommendations" +
            "\n\n8. OpenZeppelin & Audited Libraries:" +
            "\n   ✅ ERC standards, Ownable, ReentrancyGuard = Trusted implementations" +
            "\n   ⚠️ Still check for MISUSE of these libraries (wrong modifiers, incorrect inheritance)" +
            "\n   → Trust the library, but verify proper usage" +
            "\n\n9. Modern Solidity Best Practices (0.8.0+):" +
            "\n   ✅ Built-in overflow protection (no SafeMath needed for 0.8+)" +
            "\n   ✅ Ownable2Step > basic Ownable" +
            "\n   ✅ unchecked { ++i; } safe in loops when overflow impossible" +
            "\n   → Recognize modern patterns, but ensure they're used correctly" +
            "\n\n--- SCORING FORMULA ---" +
            "\n🎯 START AT 100 POINTS. Subtract based on severity and exploitability:" +
            "\n• Critical (Immediate fund loss, contract takeover): -20 points PER ISSUE" +
            "\n• High (Significant exploitable flaw): -10 points PER ISSUE" +
            "\n• Medium (Issue with workarounds/conditions): -4 points PER ISSUE" +
            "\n• Low (Best practice deviation, minor risk): -2 points PER ISSUE" +
            "\n• Informational (Design notes, suggestions): -0.5 points PER ISSUE" +
            "\n• Gas (Optimization opportunities): -0.2 points PER ISSUE" +
            "\n\n⚠️ CRITICAL SCORING RULES:" +
            "\n• DIFFERENT contracts have DIFFERENT scores - analyze each contract's ACTUAL issues!" +
            "\n• A contract with 0 Critical + 0 High + 1 Medium = ~96/100" +
            "\n• A contract with 1 Critical + 2 High = ~60/100" +
            "\n• A contract with 0 issues = 100/100 (extremely rare!)" +
            "\n• A contract with 5 Low + 3 Informational = ~88.5/100" +
            "\n• NEVER give 95.5 to every contract - that's a sign you're not analyzing properly!" +
            "\n• Security score MUST reflect the ACTUAL vulnerabilities found, not a generic value" +
            "\n• Calculate: 100 - (Critical×20 + High×10 + Medium×4 + Low×2 + Info×0.5 + Gas×0.2)" +
            "\n\n⚖️ CONTEXT-AWARE SEVERITY ADJUSTMENT:" +
            "\n• SWC-105 with Ownable2Step + nonReentrant = LOW (mention centralization)" +
            "\n• SWC-105 with no protection = CRITICAL" +
            "\n• SWC-108 for config data = INFORMATIONAL" +
            "\n• SWC-108 for sensitive data = MEDIUM/HIGH" +
            "\n• SWC-114 for NFT minting = LOW/INFO" +
            "\n• SWC-114 for DeFi = MEDIUM/HIGH" +
            "\n\n🎯 BALANCED APPROACH:" +
            "\n• DO flag all potential issues (transparency for users)" +
            "\n• DO adjust severity based on context (avoid panic)" +
            "\n• DO explain WHY something is/isn't high risk" +
            "\n• DON'T give blanket passes to patterns" +
            "\n• DON'T flag non-existent issues (signature replay without signatures)" +
            "\n\n--- ANALYSIS METHODOLOGY ---" +
            "\n1. READ the entire contract to understand purpose and architecture" +
            "\n2. IDENTIFY all SWC patterns present" +
            "\n3. EVALUATE severity in context (DeFi vs NFT vs DAO vs Token)" +
            "\n4. CHECK for compensating controls (modifiers, validation, audited libs)" +
            "\n5. SCORE accurately with context-adjusted severity" +
            "\n6. EXPLAIN findings clearly with mitigation suggestions" +
            "\n\n--- CRITICAL: LINE NUMBER REPORTING ---" +
            "\n⚠️ NEVER report more than 5 line numbers per vulnerability!" +
            "\n• If an issue spans 100+ lines, pick the 3-5 MOST CRITICAL lines only" +
            "\n• Examples:" +
            "\n  ❌ WRONG: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12...100]" +
            "\n  ✅ CORRECT: [45, 67, 89] (the 3 key lines where the issue is most evident)" +
            "\n• For contract-wide issues (like floating pragma), use: [1]" +
            "\n• This prevents JSON truncation and keeps reports readable"
        );
    }, []);
};

// --- 3. Deterministic HTML Generation from JSON Counts (Matching the Screenshot) ---

const generateAuditHTML_OLD_BACKUP = (auditData: AuditData): string => {
    // Helper to get color classes based on severity
    const getColorClass = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-700 text-white';
            case 'high': return 'bg-orange-600 text-white';
            case 'medium': return 'bg-yellow-500 text-gray-900';
            case 'low': return 'bg-blue-500 text-white';
            case 'informational': return 'bg-gray-500 text-white';
            case 'gas': return 'bg-cyan-500 text-white';
            default: return 'bg-gray-700 text-white';
        }
    };

    // Pill rendering for the Threat Summary section
    const renderPill = (severity: string, count: number): string => `
        <div class="pill-container flex flex-col items-center rounded-lg ${getColorClass(severity)} shadow-lg transform transition-transform hover:scale-105">
            <span class="text-lg sm:text-xl md:text-2xl font-bold">${count}</span>
            <span class="text-xs sm:text-sm font-semibold mt-1">${severity}</span>
        </div>
    `;

    // Detailed Findings rendering
    const renderDetailedFindings = (vulnerability: Vulnerability): string => `
        <div class="bg-gray-800 p-3 sm:p-4 md:p-5 rounded-xl mb-3 sm:mb-4 border-l-4 ${vulnerability.severity === 'Critical' ? 'border-red-500' : vulnerability.severity === 'High' ? 'border-orange-500' : vulnerability.severity === 'Medium' ? 'border-yellow-500' : 'border-gray-500'}">
            <span class="text-xs font-bold ${getColorClass(vulnerability.severity)} px-2 py-1 rounded-full uppercase">${vulnerability.severity}</span>
            <h3 class="text-base sm:text-lg md:text-xl font-bold mt-2 text-gray-100 break-words">${vulnerability.title || 'N/A'}
                ${vulnerability.swcId ? `<span class="text-xs sm:text-sm font-normal text-gray-400">(${vulnerability.swcId})</span>` : ''}
            </h3>
            <p class="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed">
                ${vulnerability.description || 'No detailed description provided.'}
            </p>
            ${vulnerability.lineNumbers && vulnerability.lineNumbers.length > 0 ? `
                <p class="mt-2 text-xs text-[#F8F442] break-words">Lines: ${vulnerability.lineNumbers.join(', ')}</p>
            ` : ''}
        </div>
    `;

    // Generate SVG circular progress for the full report
    const generateCircularProgressSVG = (score: number): string => {
        const size = 120;
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (score / 100) * circumference;

        // Color logic based on score
        const getColor = (score: number) => {
            if (score >= 90) return '#10B981'; // Green
            if (score >= 80) return '#F59E0B'; // Yellow/Orange
            if (score >= 60) return '#F97316'; // Orange
            return '#EF4444'; // Red
        };

        const color = getColor(score);

        return `
            <svg width="${size}" height="${size}" style="filter: drop-shadow(0 0 6px ${color}40);">
                <!-- Background circle -->
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke="#374151"
                    stroke-width="${strokeWidth}"
                    fill="transparent"
                />
                <!-- Progress circle -->
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    fill="transparent"
                    stroke-dasharray="${strokeDasharray}"
                    stroke-dashoffset="${strokeDashoffset}"
                    stroke-linecap="round"
                    style="transition: all 0.5s ease-out; transform: rotate(-90deg); transform-origin: center;"
                />
                <!-- Score text in center -->
                <text
                    x="${size / 2}"
                    y="${size / 2}"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="${color}"
                    font-size="18"
                    font-weight="bold"
                    font-family="Inter, sans-serif"
                >
                    ${score}/100
                </text>
            </svg>
        `;
    };

    const scoreColor = auditData.securityScore >= 90 ? '#4CAF50' : auditData.securityScore >= 80 ? '#FFC107' : '#F44336';
    const totalVulnerabilities = Object.values(auditData.vulnerabilityBreakdown).reduce((acc: number, count: number) => acc + count, 0);
    const scoreClass = auditData.securityScore >= 90 ? 'score-high' : auditData.securityScore >= 80 ? 'score-medium' : 'score-low';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartSentinels AI Audit Report - ${auditData.contractName || 'Contract'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>${auditReportStyles}</style>
</head>
<body class="bg-[#1F1F1F]">

    <header class="text-center header-bg rounded-none sm:rounded-t-xl mb-4 sm:mb-6 md:mb-8">
        <div class="flex items-center justify-center gap-3 px-2">
            <img src="${LOGO_URL}" alt="SmartSentinels Logo" class="inline-logo"/>
            <h1 class="report-title font-extrabold text-neon neon-header">SMARTSENTINELS AI AUDIT REPORT</h1>
        </div>
    </header>

    <div class="container-responsive">
        
        <!-- Project Details and Security Score -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div class="lg:col-span-1 bg-gray-800 p-4 sm:p-5 md:p-6 rounded-xl border border-gray-700">
                <h2 class="section-header font-bold text-neon mb-3 sm:mb-4">Project Details</h2>
                <div class="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                    <p class="break-words"><strong>Contract:</strong> ${auditData.contractName || 'N/A'}</p>
                    <p><strong>Version:</strong> Solidity ${auditData.version || 'N/A'}</p>
                    <p><strong>Auditor:</strong> SmartSentinels AI</p>
                    <p><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
                    ${auditData.transactionHash ? `
                    <p class="break-all"><strong>TX Hash:</strong> 
                        <a href="https://bscscan.com/tx/${auditData.transactionHash}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="text-neon hover:underline"
                           style="word-break: break-all;">
                            ${auditData.transactionHash.slice(0, 10)}...${auditData.transactionHash.slice(-8)}
                        </a>
                    </p>
                    ` : ''}
                </div>
            </div>

            <div class="lg:col-span-2 score-box p-4 sm:p-5 md:p-6 rounded-xl border border-gray-700 flex items-center gap-6">
                <div class="flex-1">
                    <h2 class="section-header font-bold text-neon mb-3 sm:mb-4">Security Score</h2>
                    <p class="text-gray-300 text-xs sm:text-sm leading-relaxed">${auditData.overallAssessment || 'The contract demonstrates a high level of security. Minor issues identified, mainly related to gas optimization and design considerations, but no critical vulnerabilities found.'}</p>
                </div>
                <div class="flex-shrink-0 text-center">
                    ${generateCircularProgressSVG(auditData.securityScore || 0)}
                    <div class="score-status text-${scoreColor === '#4CAF50' ? 'green' : scoreColor === '#FFC107' ? 'yellow' : 'red'}-400 font-bold mt-2">
                        ${auditData.securityScore >= 90 ? 'EXCELLENT' : auditData.securityScore >= 80 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                    </div>
                </div>
            </div>
        </div>

        <!-- Threat Summary (starts on new page in print) -->
        <section class="mb-6 sm:mb-8" style="page-break-before: always;">
            <h2 class="section-header font-bold text-neon mb-3 sm:mb-4 border-b border-gray-700 pb-2 neon-header">Threat Summary</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4" style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.5rem;">
                ${renderPill('Critical', auditData.vulnerabilityBreakdown?.Critical || 0)}
                ${renderPill('High', auditData.vulnerabilityBreakdown?.High || 0)}
                ${renderPill('Medium', auditData.vulnerabilityBreakdown?.Medium || 0)}
                ${renderPill('Low', auditData.vulnerabilityBreakdown?.Low || 0)}
                ${renderPill('Informational', auditData.vulnerabilityBreakdown?.Informational || 0)}
                ${renderPill('Gas', auditData.vulnerabilityBreakdown?.Gas || 0)}
            </div>
            <p class="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">Total ${totalVulnerabilities} findings identified across all categories.</p>
        </section>
        
        <!-- Detailed Findings -->
        <section class="mb-6 sm:mb-8">
            <h2 class="section-header font-bold text-neon mb-3 sm:mb-4 border-b border-gray-700 pb-2 neon-header">Detailed Findings</h2>
            ${auditData.vulnerabilities?.length > 0 
                ? auditData.vulnerabilities.map(renderDetailedFindings).join('') 
                : '<p class="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">No significant security vulnerabilities found.</p>'}
        </section>

    </div>

    <footer class="container-responsive border-t border-gray-700 mt-6 sm:mt-8 py-4 sm:py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-xs sm:text-sm leading-relaxed text-gray-500 flex-1 text-center sm:text-left px-2">
                Disclaimer: This audit report was generated by the SmartSentinels AI Agent using a deterministic analysis model trained on the EEA EthTrust Security Levels Specification (ETA Registry) and Smart Contract Weakness Classification (SWC Registry). While this analysis provides comprehensive automated security assessment, users are encouraged to complement AI findings with additional review approaches for maximum assurance. SmartSentinels cannot be held responsible for misinterpretations or misuse of this report.
            </p>
            
            <!-- SmartSentinels Authentication Seal - Right Side -->
            <div class="flex-shrink-0">
                <img src="/ssHoloNew.svg" alt="SmartSentinels Verified" class="ss-seal" title="Verified SmartSentinels Audit Report" />
            </div>
        </div>
    </footer>

    <!-- Download PDF Button - Static, centered, below footer -->
    <div class="download-pdf-container">
        <button onclick="window.print()" class="download-pdf-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF
        </button>
    </div>

</body>
</html>`;

    return html;
};

// Premium Audit Report HTML Generator
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
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#34D399';
    if (score >= 70) return '#F59E0B';
    if (score >= 60) return '#F97316';
    return '#EF4444';
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const shortTxHash = `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`;
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
    <title>SmartSentinels AI Audit Report - ${contractName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #3B82F6;
            --primary-light: #60A5FA;
            --accent: #F8F442;
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

        /* Premium Background Pattern */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: 
                radial-gradient(ellipse at 20% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(248, 244, 66, 0.03) 0%, transparent 70%);
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

        .page-container {
            position: relative;
            z-index: 1;
        }

        /* Premium Header */
        .premium-header {
            background: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
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

        .logo-icon {
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }

        .brand-text {
            font-family: 'Space Grotesk', sans-serif;
        }

        .brand-name {
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
        }

        .report-type {
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            background: linear-gradient(90deg, #3B82F6 0%, #9F7AEA 40%, #14B8A6 80%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* Premium Cards */
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

        .card-header-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .card-header h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .card-body {
            padding: 1.5rem;
        }

        /* Score Ring - Premium */
        .score-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .score-ring {
            position: relative;
            width: 180px;
            height: 180px;
        }

        .score-ring svg {
            transform: rotate(-90deg);
            filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.4));
        }

        .score-value {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .score-number {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 3rem;
            font-weight: 700;
            color: ${scoreColor};
        }

        .score-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        }

        .score-badge {
            margin-top: 1rem;
            padding: 0.5rem 1.5rem;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 100px;
            font-weight: 600;
            font-size: 0.875rem;
            color: ${scoreColor};
            letter-spacing: 0.1em;
        }

        /* Threat Summary Pills */
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
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
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

        .threat-count {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.75rem;
            font-weight: 700;
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

        /* Finding Cards */
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
            background: rgba(59, 130, 246, 0.1);
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
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
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
            filter: drop-shadow(0 0 20px rgba(248, 244, 66, 0.3));
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

        /* Download Button - Visible by default, hidden in IPFS via class */
        .download-section {
            text-align: center;
            padding: 2rem;
        }

        /* Hide download button when IPFS class is present */
        .ipfs-version .download-section {
            display: none;
        }

        .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            color: white;
            font-weight: 600;
            font-size: 1rem;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
        }

        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
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
            background: linear-gradient(180deg, var(--primary), #8B5CF6);
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

        /* Print Styles */
        @media print {
            @page {
                size: A4;
                margin: 15mm;
            }

            html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: #1a1a1a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

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

            /* Override all CSS variables and inline styles for print */
            * {
                color: inherit !important;
            }

            p, span, div, strong, em {
                color: #1a1a1a !important;
            }

            .score-number, .score-label {
                color: #1a1a1a !important;
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

            /* Score ring - make visible */
            .score-ring svg circle[stroke="rgba(255,255,255,0.1)"] {
                stroke: #e0e0e0 !important;
            }

            .summary-text {
                color: #374151 !important;
            }

            /* Threat pills */
            .threat-pill {
                background: #f8f9fa !important;
                border: 2px solid #e0e0e0 !important;
            }

            .threat-pill::before {
                height: 4px !important;
            }

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

            .section-title {
                break-after: avoid;
                page-break-after: avoid;
            }

            .threat-grid {
                break-inside: avoid;
                page-break-inside: avoid;
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

        <!-- Premium Header -->
        <header class="premium-header">
            <div class="max-w-5xl mx-auto px-6">
                <div class="logo-container">
                    <div class="logo-icon">
                        <img src="/ss-icon.svg" alt="SmartSentinels Logo" />
                    </div>
                    <div class="brand-text">
                        <div class="brand-name">SmartSentinels</div>
                        <div class="report-type">AI Audit Report</div>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-5xl mx-auto px-6 py-8">

            <!-- Contract Details Card with Score -->
            <div class="premium-card mb-8">
                <div class="card-header">
                    <div class="card-header-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <h2>Contract Details</h2>
                </div>
                <div class="card-body">
                    <div class="flex flex-col lg:flex-row gap-6">
                        <!-- Details Section -->
                        <div class="flex-1">
                            <div class="detail-row">
                                <span class="detail-label">Contract Name</span>
                                <span class="detail-value">${contractName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Solidity Version</span>
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
                            <div class="detail-row">
                                <span class="detail-label">TX Hash</span>
                                <a href="https://bscscan.com/tx/${transactionHash}" target="_blank" class="detail-value" style="font-family: monospace; font-size: 0.875rem; color: var(--primary); text-decoration: none; transition: opacity 0.2s;">${shortTxHash}</a>
                            </div>
                        </div>
                        <!-- Score Section -->
                        <div class="flex-shrink-0">
                            <div class="score-container" style="margin: 0;">
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
                                    <div class="score-value">
                                        <span class="score-number">${securityScore}</span>
                                        <span class="score-label">out of 100</span>
                                    </div>
                                </div>
                                <div class="score-badge">${scoreGrade}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Executive Summary Section (Separate) -->
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
                                This report was generated by SmartSentinels AI Audit Engine using deterministic analysis based on the EEA EthTrust Security Levels Specification and Smart Contract Weakness Classification (SWC) Registry. While this analysis provides comprehensive automated security assessment, it is recommended to complement AI findings with additional review approaches for maximum assurance. This report does not constitute financial advice or guarantee of security.
                            </p>
                        </div>
                    </div>

                    <!-- Verification Badge -->
                    <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">
                                Verify on IPFS: <a href="https://ipfs.io/ipfs/QmX7AbCdEfGhIjKlMnOpQrStUvWxYz1234567890123kF2" target="_blank" style="font-family: monospace; color: var(--primary); text-decoration: none; transition: opacity 0.2s;">QmX7...3kF2</a>
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">Powered by</span>
                            <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">SmartSentinels</span>
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

// --- 6. Main Audit Feature Component ---

interface AuditFeatureProps {
    showTitle?: boolean;
    showDescription?: boolean;
}

const SidebarAIAuditSmartContract: React.FC<AuditFeatureProps> = ({ showTitle = true, showDescription = true }) => {
    // Basic state
    const [code, setCode] = useState('');
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [statusMessage, setStatusMessage] = useState("SmartSentinels AI Audit Agent is here for you! Paste your Solidity code and run the audit.");
    const [remediation, setRemediation] = useState<RemediationState>({ title: '', code: '', loading: false });
    
    // TEST MODE - No payments, no blockchain transactions, no token minting
    const [testMode, setTestMode] = useState(false);
    
    // Processing states
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Transaction states
    const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [paymentTxHash, setPaymentTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [currentTransactionType, setCurrentTransactionType] = useState<'approve' | 'payAndRunAudit' | null>(null);
    
    // Messages
    const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
    const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
    const [auditCompletedTxHash, setAuditCompletedTxHash] = useState<`0x${string}` | null>(null);
    
    // IPFS Upload State
    const [ipfsUploading, setIpfsUploading] = useState(false);
    const [ipfsUploadResult, setIpfsUploadResult] = useState<{hash?: string, url?: string, error?: string} | null>(null);

    const systemPrompt = useAuditPrompt();
    
    // Wallet connection with thirdweb
    const account = useActiveAccount();
    const address = account?.address;
    const isConnected = !!account;
    
    // Create contract instances
    const sstlTokenContract = getContract({
        address: SSTL_TOKEN_ADDRESS,
        abi: SSTL_TOKEN_ABI as any,
        chain: bsc,
        client: thirdwebClient,
    } as any);

    const auditGatewayContract = getContract({
        address: AUDIT_GATEWAY_ADDRESS,
        abi: AUDIT_GATEWAY_ABI as any,
        chain: bsc,
        client: thirdwebClient,
    } as any);
    
    // Get SSTL token decimals
    const { data: tokenDecimals } = useReadContract({
        contract: sstlTokenContract,
        method: 'function decimals() view returns (uint8)',
    } as any);
    
    // Get SSTL balance
    const { data: sstlBalance, refetch: refetchBalance } = useReadContract({
        contract: sstlTokenContract,
        method: 'function balanceOf(address) view returns (uint256)',
        params: address ? [address] : undefined,
        queryOptions: { enabled: !!address && isConnected, refetchInterval: 3000 }
    } as any);

    // Check allowance for Gateway contract
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        contract: sstlTokenContract,
        method: 'function allowance(address,address) view returns (uint256)',
        params: address ? [address, AUDIT_GATEWAY_ADDRESS] : undefined,
        queryOptions: { enabled: !!address && isConnected }
    } as any);

    // Get current service price in BNB (V3 uses paymentAmountBNB state variable)
    const { data: servicePriceBNB } = useReadContract({
        contract: auditGatewayContract,
        method: 'function paymentAmountBNB() view returns (uint256)',
        queryOptions: { enabled: !!isConnected }
    } as any);

    // Get current service price in SSTL (V3 uses paymentAmountToken state variable)
    const { data: servicePriceSSTL } = useReadContract({
        contract: auditGatewayContract,
        method: 'function paymentAmountToken() view returns (uint256)',
        queryOptions: { enabled: !!isConnected }
    } as any);

    // Get current payment mode (BNB vs SSTL)
    const { data: acceptBNB } = useReadContract({
        contract: auditGatewayContract,
        method: 'function acceptBNB() view returns (bool)',
        queryOptions: { enabled: !!isConnected }
    } as any);

    const { data: acceptToken } = useReadContract({
        contract: auditGatewayContract,
        method: 'function acceptToken() view returns (bool)',
        queryOptions: { enabled: !!isConnected }
    } as any);

    // Debug logging for payment amounts
    console.log('💳 Payment Config Loaded:', {
        servicePriceBNB: servicePriceBNB?.toString(),
        servicePriceSSTL: servicePriceSSTL?.toString(),
        acceptBNB,
        acceptToken,
        isConnected
    });

    // Determine which payment method to use - FORCE BNB PAYMENT
    const useNativePayment = true; // Always use BNB payment (0.45 BNB)
    
    // Transaction hooks - using mutateAsync for proper value handling
    const { mutateAsync: sendTransactionAsync, data: txResult, isPending: isSendPending, error: sendError } = useSendTransaction();
    
    // Wrapper to maintain compatibility with existing code - REMOVED, use mutateAsync directly
    // const sendTransaction = (tx: any) => {
    //     sendTransactionAsync(tx).catch((error) => {
    //         console.error('Transaction error:', error);
    //     });
    // };
    
    // Extract transaction hash from result
    const txHash = txResult?.transactionHash as `0x${string}` | undefined;
    
    // Wait for allowance to update after approval
    const waitForAllowanceUpdate = async (requiredAmount: bigint, maxAttempts = 10): Promise<boolean> => {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
            const { data: currentAllowance } = await refetchAllowance();
            
            const allowanceValue = currentAllowance ? BigInt(currentAllowance.toString()) : 0n;
            
            console.log(`🔄 Allowance check attempt ${i + 1}/${maxAttempts}:`, {
                current: allowanceValue.toString(),
                required: requiredAmount.toString(),
                sufficient: allowanceValue >= requiredAmount
            });
            
            if (allowanceValue >= requiredAmount) {
                return true;
            }
        }
        return false;
    };

    // Handle transaction completion and error states
    useEffect(() => {
        if (currentTransactionType === 'approve') {
            if (sendError) {
                // Handle error states in sequence to prevent race conditions
                setStatusMessage('Transaction was cancelled or failed.');
                setTimeout(() => {
                    setStatusMessage('Please try approving again when ready.');
                    setIsProcessing(false);
                    setCurrentTransactionType(null);
                    setApprovalTxHash(undefined);
                }, 100);
            } else if (txHash && !isSendPending) {
                // Store approval transaction hash and wait for allowance to update
                const verifyAllowance = async () => {
                    setStatusMessage('Approval confirmed! Verifying allowance on blockchain...');
                    
                    const decimals = Number(tokenDecimals);
                    const requiredAmount = servicePriceSSTL ? BigInt(servicePriceSSTL.toString()) : parseUnits('1000', decimals);
                    
                    const allowanceUpdated = await waitForAllowanceUpdate(requiredAmount);
                    
                    if (allowanceUpdated) {
                        setApprovalTxHash(txHash);
                        setStatusMessage('✅ Approval verified! You can now proceed with payment.');
                        setIsProcessing(false);
                        setCurrentTransactionType(null);
                    } else {
                        setStatusMessage('⚠️ Approval transaction confirmed but allowance not updated yet. Please wait a moment and try again.');
                        setIsProcessing(false);
                        setCurrentTransactionType(null);
                    }
                };
                
                verifyAllowance();
            }
        } else if (currentTransactionType === 'payAndRunAudit') {
            if (sendError) {
                // Handle payment error states in sequence
                setStatusMessage('Payment transaction was cancelled or failed.');
                setTimeout(() => {
                    setPaymentMessage('Please try payment again.');
                    setIsProcessing(false);
                    setCurrentTransactionType(null);
                }, 100);
            } else if (txHash && !isSendPending) {
                // Store payment transaction hash and start audit
                setPaymentTxHash(txHash);
                setStatusMessage('BNB Payment successful! 67 SSTL tokens will be minted. Starting AI Audit...');
                // Start the audit with the payment transaction hash
                handleSimpleAudit(txHash);
                setTimeout(async () => {
                    setApprovalMessage(null);
                    setPaymentMessage('Starting AI audit...');
                    setPaymentTxHash(txHash);
                    setCurrentTransactionType(null);

                    // Start the audit process with the payment hash
                    handleSimpleAudit(txHash);
                }, 100);
            }
        }
    }, [txHash, isSendPending, sendError, currentTransactionType, refetchAllowance]);

    // Check if approval was successful by monitoring allowance
    useEffect(() => {
        if (currentTransactionType === 'approve' && !isProcessing) {
            if (allowance !== undefined && allowance !== null && tokenDecimals) {
                const decimals = Number(tokenDecimals);
                const allowanceValue = BigInt(allowance.toString());
                const requiredAmount = servicePriceSSTL ? BigInt(servicePriceSSTL.toString()) : parseUnits('1000', decimals);
                const hasAllowance = allowanceValue >= requiredAmount;
                
                console.log('🔍 Allowance check:', {
                    current: allowanceValue.toString(),
                    required: requiredAmount.toString(),
                    hasAllowance
                });
                
                if (hasAllowance) {
                    setStatusMessage('SSTL tokens approved successfully! You can now proceed with payment.');
                }
            }
        }
    }, [allowance, tokenDecimals, servicePriceSSTL]);

    const handleApproveSSTL = async () => {
        if (!isConnected || !address) {
            setStatusMessage('Please connect your wallet first');
            return;
        }

        if (!code.trim()) {
            setStatusMessage('Please upload a smart contract first');
            return;
        }

        try {
            setStatusMessage('Approving SSTL tokens...');
            setIsProcessing(true);
            setCurrentTransactionType('approve');

            const decimals = Number(tokenDecimals);
            const approvalAmount = servicePriceSSTL ? BigInt(servicePriceSSTL.toString()) : parseUnits('1000', decimals);

            console.log('🚀 Approving SSTL tokens:', {
                amount: approvalAmount.toString(),
                spender: AUDIT_GATEWAY_ADDRESS,
                serviceOwner: SERVICE_OWNER
            });

            console.log('Sending approval transaction:', {
                spender: AUDIT_GATEWAY_ADDRESS,
                amount: formatUnits(approvalAmount, decimals),
            });

            const approveTx = prepareContractCall({
                contract: sstlTokenContract,
                method: 'function approve(address,uint256) returns (bool)',
                params: [AUDIT_GATEWAY_ADDRESS, approvalAmount],
            } as any);

            await sendTransactionAsync(approveTx);
        } catch (error) {
            console.error('❌ Approval error:', error);
            setApprovalMessage('Approval failed: ' + (error as Error).message);
            setIsProcessing(false);
        }
    };

    const handlePayAndRunAudit = async () => {
        if (!isConnected || !address) {
            setStatusMessage('Please connect your wallet first');
            return;
        }

        if (!code.trim()) {
            setStatusMessage('Please upload a smart contract first');
            return;
        }

        // Prevent double execution
        if (isProcessing || currentTransactionType === 'payAndRunAudit') {
            console.warn('⚠️ Transaction already in progress, ignoring duplicate call');
            return;
        }

        try {
            setIsProcessing(true);
            setStatusMessage('Processing payment for AI Audit...');
            setCurrentTransactionType('payAndRunAudit');

            if (useNativePayment) {
                // Pay with BNB
                const currentPrice = servicePriceBNB && BigInt(servicePriceBNB.toString()) > 0n 
                    ? BigInt(servicePriceBNB.toString()) 
                    : parseUnits(AUDIT_COST_BNB, 18); // Default to 0.45 BNB
                const priceInBNB = Number(formatUnits(currentPrice, 18));

                console.log('💰 Paying for audit with BNB:', {
                    gateway: AUDIT_GATEWAY_ADDRESS,
                    amount: `${priceInBNB} BNB`,
                    amountWei: currentPrice.toString(),
                    currentPriceType: typeof currentPrice,
                    currentPriceValue: currentPrice
                });

                const payTx = prepareContractCall({
                    contract: auditGatewayContract,
                    method: 'payAndRunAuditBNB',
                    params: [`audit_${Date.now()}`],
                    value: currentPrice,
                } as any);

                console.log('📝 Prepared transaction:', payTx);
                console.log('📝 Value type:', typeof payTx.value, payTx.value);
                
                // Send transaction with await to properly handle async
                const txResult = await sendTransactionAsync(payTx);
                console.log('✅ Transaction result:', txResult);
            } else {
                // Pay with SSTL tokens - check allowance first
                const decimals = Number(tokenDecimals);
                const currentPrice = servicePriceSSTL ? BigInt(servicePriceSSTL.toString()) : parseUnits('1000', decimals);
                const priceInSSTL = Number(formatUnits(currentPrice, decimals));

                console.log('💰 Paying for audit with SSTL:', {
                    gateway: AUDIT_GATEWAY_ADDRESS,
                    amount: `${priceInSSTL} SSTL`,
                    amountWei: currentPrice.toString()
                });

                // Check if user has sufficient allowance
                const currentAllowance = allowance ? BigInt(allowance.toString()) : 0n;
                if (currentAllowance < currentPrice) {
                    setStatusMessage('Insufficient SSTL allowance. Please approve tokens first.');
                    setCurrentTransactionType(null);
                    return;
                }

                // Call payAndRunAudit without value (contract handles transferFrom)
                const payTx = prepareContractCall({
                    contract: auditGatewayContract,
                    method: 'function payAndRunAudit()',
                    params: [],
                } as any);

                await sendTransactionAsync(payTx);
            }
        } catch (error) {
            console.error('❌ Payment error:', error);
            setPaymentMessage('Payment failed: ' + (error as Error).message);
            setCurrentTransactionType(null);
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

    // IPFS Upload Handler
    const handleUploadToIPFS = async () => {
        if (!auditData) return;

        try {
            setIpfsUploading(true);
            setIpfsUploadResult(null);

            // Generate HTML with IPFS-specific class to hide download button
            const htmlContent = generateAuditHTML(auditData);
            // Add ipfs-version class to body tag
            const ipfsHtmlContent = htmlContent.replace('<body>', '<body class="ipfs-version">');
            const contractName = auditData.contractName || 'Contract';

            console.log('🔄 Starting IPFS upload for audit report...');
            
            const result = await uploadAuditReportToIPFS(ipfsHtmlContent, contractName, auditData);
            
            setIpfsUploadResult(result);

            if (result.success) {
                // Keep the transaction hash message in the top status, IPFS success shows in bottom section
                setStatusMessage("Audit completed successfully! Transaction: ");
            } else {
                setStatusMessage(`❌ IPFS upload failed: ${result.error}`);
            }

        } catch (error) {
            console.error('IPFS upload error:', error);
            setIpfsUploadResult({
                error: error instanceof Error ? error.message : 'Unknown upload error'
            });
            setStatusMessage(`❌ IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIpfsUploading(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    setCode(result);
                    setAuditData(null);
                    setApprovalTxHash(undefined);
                    setPaymentTxHash(undefined);
                    setIsProcessing(false);
                    setCurrentTransactionType(null);
                    setRemediation({ title: '', code: '', loading: false });
                    setStatusMessage('Ready for BNB payment and audit.');
                    // Reset the file input so the same file can be uploaded again
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        }
    };

    // Handler for contract address fetch
    const handleContractCodeFetched = (sourceCode: string, contractInfo: ContractSourceCode) => {
        setCode(sourceCode);
        setAuditData(null);
        setApprovalTxHash(undefined);
        setPaymentTxHash(undefined);
        setIsProcessing(false);
        setCurrentTransactionType(null);
        setRemediation({ title: '', code: '', loading: false });
        setStatusMessage(`✅ Loaded ${contractInfo.contractName} (${contractInfo.compilerVersion}) from blockchain. Ready for audit.`);
    };

    // TEST MODE HANDLER - Run audit without payment or minting
    const handleTestModeAudit = async () => {
        if (!code.trim()) {
            setStatusMessage('Please upload or fetch a smart contract first');
            return;
        }

        setIsProcessing(true);
        setAuditData(null);
        setAuditCompletedTxHash(null);
        setStatusMessage('🧪 TEST MODE: AI Agent analyzing contract (No payment, No minting)...');

        try {
            const payload = {
                contents: [{ parts: [{ text: `Analyze: \n${code}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const structuredData = await callGeminiApi(payload);
            
            // Use a test transaction hash
            const testTxHash = `0x${'0'.repeat(64)}` as `0x${string}`; // All zeros = test mode
            structuredData.transactionHash = testTxHash;

            // Calculate vulnerability breakdown from vulnerabilities array
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
                    const severityLower = vuln.severity?.toLowerCase();
                    if (severityLower === 'critical') breakdown.Critical++;
                    else if (severityLower === 'high') breakdown.High++;
                    else if (severityLower === 'medium') breakdown.Medium++;
                    else if (severityLower === 'low') breakdown.Low++;
                    else if (severityLower === 'informational') breakdown.Informational++;
                    else if (severityLower === 'gas') breakdown.Gas++;
                });
            }

            const correctedData = {
                ...structuredData,
                vulnerabilityBreakdown: { ...breakdown }
            };

            setAuditData(correctedData);
            setIsProcessing(false);
            setStatusMessage("🧪 TEST MODE: Audit completed successfully! (No tokens minted)");
            setAuditCompletedTxHash(testTxHash);
        } catch (error: any) {
            console.error('❌ Test audit failed:', error);
            setStatusMessage('Test audit failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

  const callGeminiApi = async (payload: { contents: any[], systemInstruction: { parts: { text: string }[] } }): Promise<any> => {
    let attempt = 0;
    const maxRetries = 3;
    let delay = 2000;

    const apiUrl = API_URL_TEMPLATE + GEMINI_API_KEY;

    while (attempt < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: payload.contents,
                    systemInstruction: payload.systemInstruction,
                    generationConfig: {
                        temperature: 0.0,    // Purely deterministic
                        topP: 0.1,           // Restrictive sampling
                        topK: 1,             // Most probable token only
                        candidateCount: 1,
                        maxOutputTokens: 16384,
                        responseMimeType: "application/json",
                        responseSchema: AUDIT_REPORT_SCHEMA,
                    },
                })
            });

            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(`CRITICAL: HTTP 400 Payload Error. Check schema size or contract length.`);
                }
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`Retrying due to API status: ${response.status}`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                const reason = result.candidates?.[0]?.finishReason || 'Unknown failure.';
                throw new Error(`AI generated no content. Reason: ${reason}`);
            }

            // Try to parse JSON with error recovery
            let auditData;
            try {
                auditData = JSON.parse(content.trim());
            } catch (parseError) {
                console.warn('Initial JSON parse failed, attempting repair...', parseError);
                
                // Try to extract JSON from markdown code blocks if present
                let cleanedContent = content.trim();
                if (cleanedContent.startsWith('```json')) {
                    cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedContent.startsWith('```')) {
                    cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                // Try to fix common JSON issues
                // 1. Fix truncated line number arrays (most common issue)
                // Look for incomplete arrays like: [1, 2, 3, 4, 5, 138 (no closing bracket)
                cleanedContent = cleanedContent.replace(/(\[\s*\d+(?:\s*,\s*\d+)*\s*,?\s*)\d+\s*$/g, '$1]');
                
                // 2. Remove trailing commas before closing brackets
                cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
                
                // 3. Fix incomplete string values at the end of JSON
                // Look for: "description": "some text that got cut (no closing quote)
                cleanedContent = cleanedContent.replace(/"([^"]+)$/, '"$1"');
                
                // 4. Fix unclosed strings at the end (truncation)
                const lastBrace = cleanedContent.lastIndexOf('}');
                if (lastBrace > 0) {
                    // Count quotes before last brace to see if we have unclosed string
                    const beforeLastBrace = cleanedContent.substring(0, lastBrace);
                    const quoteCount = (beforeLastBrace.match(/"/g) || []).length;
                    if (quoteCount % 2 !== 0) {
                        // Odd number of quotes - add closing quote
                        cleanedContent = beforeLastBrace + '"' + cleanedContent.substring(lastBrace);
                    }
                }
                
                // 5. Ensure proper array/object closure
                const openBraces = (cleanedContent.match(/{/g) || []).length;
                const closeBraces = (cleanedContent.match(/}/g) || []).length;
                const openBrackets = (cleanedContent.match(/\[/g) || []).length;
                const closeBrackets = (cleanedContent.match(/\]/g) || []).length;
                
                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                    cleanedContent += ']';
                }
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    cleanedContent += '}';
                }
                
                try {
                    auditData = JSON.parse(cleanedContent);
                    console.log('✅ JSON repair successful');
                } catch (repairError) {
                    console.error('❌ JSON repair failed:', repairError);
                    console.error('Content preview:', content.substring(0, 500));
                    console.error('Content end:', content.substring(content.length - 500));
                    throw new Error(`Invalid JSON from AI: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
                }
            }
            
            return auditData;

        } catch (error) {
            attempt++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (attempt < maxRetries && errorMessage.includes("Retrying")) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            } else {
                console.error("Gemini API call failed:", error);
                throw new Error(`Audit agent failed. Final error: ${errorMessage}.`);
            }
        }
    }
    throw new Error("Max retries reached without successful API call.");
  };



    const handleSimpleAudit = async (paymentTxHash: `0x${string}`) => {
        console.log('🎯 handleSimpleAudit called with payment:', paymentTxHash);

        if (!code.trim()) {
            setStatusMessage('Please upload a smart contract first');
            return;
        }

        setIsProcessing(true);
        setAuditData(null);
        setAuditCompletedTxHash(null); // Reset previous completed tx hash
        setStatusMessage('Payment confirmed. AI Agent analyzing contract...');

        try {
            const payload = {
                contents: [{ parts: [{ text: `Analyze: \n${code}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const structuredData = await callGeminiApi(payload);
            structuredData.transactionHash = paymentTxHash; // Use actual transaction hash

            // Always calculate vulnerability breakdown from vulnerabilities array since AI may not count correctly
            const breakdown = {
                Critical: 0,
                High: 0,
                Medium: 0,
                Low: 0,
                Informational: 0,
                Gas: 0
            };

            console.log('AI response structure:', structuredData);
            console.log('Vulnerabilities exists:', !!structuredData.vulnerabilities);
            console.log('Vulnerabilities is array:', Array.isArray(structuredData.vulnerabilities));

            if (structuredData.vulnerabilities && Array.isArray(structuredData.vulnerabilities)) {
                console.log('Vulnerabilities array:', structuredData.vulnerabilities);
                structuredData.vulnerabilities.forEach((vuln: any, index: number) => {
                    const severity = vuln.severity;
                    console.log(`Vulnerability ${index}:`, vuln);
                    console.log(`Severity value: "${severity}"`);
                    const severityLower = severity?.toLowerCase();
                    console.log(`Severity lowercase: "${severityLower}"`);
                    if (severityLower === 'critical') breakdown.Critical++;
                    else if (severityLower === 'high') breakdown.High++;
                    else if (severityLower === 'medium') breakdown.Medium++;
                    else if (severityLower === 'low') breakdown.Low++;
                    else if (severityLower === 'informational') breakdown.Informational++;
                    else if (severityLower === 'gas') breakdown.Gas++;
                    else console.log('Unknown severity:', severity);
                });
            }

            console.log('Final breakdown before setting:', breakdown);

            // Always override the AI's breakdown with our calculation
            const correctedData = {
                ...structuredData,
                vulnerabilityBreakdown: { ...breakdown }
            };

            setAuditData(correctedData);
            setIsProcessing(false);
            setStatusMessage("Audit completed successfully! Transaction: ");
            setAuditCompletedTxHash(paymentTxHash);
        } catch (error: any) {
            console.error('❌ Audit failed:', error);
            setStatusMessage('Audit failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

  const startAIAudit = async (contractCode: string, txHash: `0x${string}`) => {
    try {
        // Update UI state
        setIsProcessing(true);
        setPaymentMessage('Starting AI audit analysis...');
        
        // Run the AI audit process
        await handleRunAudit(txHash);
        
        // Success! The handleRunAudit function will update the UI state
    } catch (error) {
        console.error('❌ AI Audit failed:', error);
        setPaymentMessage('AI Audit failed: ' + (error as Error).message);
        setIsProcessing(false);
    }
  };

  const handleRunAudit = useCallback(async (txHash: `0x${string}`) => {
    console.log('🎯 handleRunAudit called with tx:', txHash);
    setIsProcessing(true);
    setStatusMessage("AI Agent analyzing contract...");

    if (code.length > 50000) {
        setStatusMessage("Contract code is too long. Please upload a smaller contract (max 50KB).");
        setIsProcessing(false);
        return;
    }

    try {
        const payload = {
            contents: [{ parts: [{ text: `Analyze: \n${code}` }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        const structuredData = await callGeminiApi(payload);
        structuredData.transactionHash = txHash;

        // Always calculate vulnerability breakdown from vulnerabilities array since AI may not count correctly
        const breakdown = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0,
            Informational: 0,
            Gas: 0
        };

        console.log('AI response structure:', structuredData);
        console.log('Vulnerabilities exists:', !!structuredData.vulnerabilities);
        console.log('Vulnerabilities is array:', Array.isArray(structuredData.vulnerabilities));

        if (structuredData.vulnerabilities && Array.isArray(structuredData.vulnerabilities)) {
            console.log('Vulnerabilities array:', structuredData.vulnerabilities);
            structuredData.vulnerabilities.forEach((vuln: any, index: number) => {
                const severity = vuln.severity;
                console.log(`Vulnerability ${index}:`, vuln);
                console.log(`Severity value: "${severity}"`);
                const severityLower = severity?.toLowerCase();
                console.log(`Severity lowercase: "${severityLower}"`);
                if (severityLower === 'critical') breakdown.Critical++;
                else if (severityLower === 'high') breakdown.High++;
                else if (severityLower === 'medium') breakdown.Medium++;
                else if (severityLower === 'low') breakdown.Low++;
                else if (severityLower === 'informational') breakdown.Informational++;
                else if (severityLower === 'gas') breakdown.Gas++;
                else console.log('Unknown severity:', severity);
            });
        }

        console.log('Final breakdown before setting:', breakdown);

        // Always override the AI's breakdown with our calculation
        const correctedData = {
            ...structuredData,
            vulnerabilityBreakdown: { ...breakdown }
        };

        setAuditData(correctedData);
        setIsProcessing(false);
        setStatusMessage("Audit complete! You can now view the report.");
        
    } catch (error: any) {
        console.error("Audit error:", error);
        setStatusMessage(`Audit failed: ${error.message}`);
        setIsProcessing(false);
    }
  }, [code, systemPrompt]);

  return (
    <div className="glass-card p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-orbitron font-bold mb-4 sm:mb-6">
        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          AI Audit - Smart Contract Analysis
        </span>
      </h1>
      <div className="space-y-4 sm:space-y-6">
        {/* Premium AI Audit Service Banner */}
        <div className="glass-card p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
              <Brain size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl sm:text-2xl font-semibold font-orbitron mb-2 text-white">
                SmartSentinels AI Audit Engine
              </h4>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security analysis powered by advanced AI
              </p>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Multi-Chain Support */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-foreground">36 Chains Supported</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Audit contracts across <strong className="text-primary">36 EVM-compatible blockchains</strong> including Ethereum, Polygon, Arbitrum, Base, and more. All mainnets ready for production audits.
              </p>
            </div>

            {/* ETA Registry Training */}
            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-foreground">Industry Standards</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trained on <a href="https://entethalliance.github.io/eta-registry/security-levels-spec.html" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">ETA Registry</a> security specifications and <strong className="text-secondary">37 SWC vulnerabilities</strong> for comprehensive analysis.
              </p>
            </div>

            {/* IPFS Storage */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h5 className="font-semibold text-foreground">Decentralized Reports</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently store audit reports on <strong className="text-accent">IPFS</strong> for immutable, verifiable proof. Download professional PDF reports anytime.
              </p>
            </div>

            {/* Automated Analysis */}
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h5 className="font-semibold text-foreground">Detailed Analysis</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comprehensive <strong className="text-success">vulnerability breakdown</strong> with severity levels, line numbers, and security scores based on industry standards.
              </p>
            </div>
          </div>

          {/* Launchpad Partnership CTA */}
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-sm text-foreground leading-relaxed">
                  <strong className="text-primary">Partner with SmartSentinels:</strong> We're looking to collaborate with launchpads and development teams to integrate our AI audit service. Offer automated security audits to your projects before launch.
                </div>
              </div>
              <a
                href="mailto:contact@smartsentinels.io?subject=Launchpad%20Partnership%20Inquiry&body=Hello%20SmartSentinels%20Team,%0D%0A%0D%0AI'm%20interested%20in%20partnering%20to%20integrate%20your%20AI%20audit%20service.%0D%0A%0D%0AName:%0D%0AProject/Company:%0D%0AWebsite:%0D%0A%0D%0ABest%20regards"
                className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* TEST MODE TOGGLE - HIDDEN FOR PRODUCTION (Uncomment to enable testing) */}
        {false && (
          <div className="p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 border-2 border-orange-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
                <div>
                  <h3 className="text-base font-semibold font-orbitron text-orange-300">Test Mode</h3>
                  <p className="text-xs text-orange-200/80">Run audits without payment or token minting</p>
                </div>
              </div>
              <button
                onClick={() => setTestMode(!testMode)}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                  ${testMode ? 'bg-orange-500' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                    ${testMode ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            {testMode && (
              <div className="mt-3 p-3 bg-orange-950/50 rounded border border-orange-500/30">
                <p className="text-xs text-orange-200">
                  ⚠️ <strong>TEST MODE ACTIVE:</strong> Audits will run without blockchain transactions.
                  No BNB payment required. No SSTL tokens will be minted. Reports are still generated.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm sm:text-base font-medium mb-2 font-orbitron">Paste Solidity Code:</label>
          <Textarea
            placeholder="Paste your Solidity code here or upload .sol file..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full min-h-[150px] sm:min-h-[200px] text-sm sm:text-base"
          />
        </div>
        <div className="w-fit">
          <input type="file" id="file-upload-ts" accept=".sol" style={{ display: 'none' }} onChange={handleFileUpload} />
          <label htmlFor="file-upload-ts" className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-input rounded-md bg-background hover:bg-blue-500 hover:text-white cursor-pointer text-sm sm:text-base font-orbitron transition-colors">
            <Upload size={14} />
            Upload .sol File
          </label>
        </div>

        {/* Contract Address Input Section */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm sm:text-base font-semibold font-orbitron">Or Audit by Contract Address</h3>
          </div>
          <ContractAddressInput 
            onCodeFetched={handleContractCodeFetched}
            disabled={isProcessing || isLoading}
          />
        </div>

        {/* Payment Method Display */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 font-orbitron mb-2">
            💳 Payment Method: <span className="text-neon font-bold">{testMode ? 'TEST MODE' : 'BNB (Native)'}</span>
          </p>
          <p className="text-xs text-gray-400">
            {testMode 
              ? '🧪 Test mode enabled - No payment required, no tokens minted'
              : `Pay ${servicePriceBNB ? Number(formatUnits(BigInt(servicePriceBNB.toString()), 18)).toFixed(3) : AUDIT_COST_BNB} BNB to run the audit`
            }
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* TEST MODE BUTTON or PAYMENT BUTTON */}
          {testMode ? (
            <Button 
              variant="hero" 
              className="font-orbitron text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" 
              onClick={handleTestModeAudit} 
              disabled={isProcessing || !code.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test Audit...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Test Audit (No Payment)
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="hero" 
              className="font-orbitron text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3" 
              onClick={handlePayAndRunAudit} 
              disabled={isProcessing || !code.trim()}
            >
              {isProcessing && currentTransactionType === 'payAndRunAudit' ? 'Processing Payment...' : 
                `Pay ${servicePriceBNB ? Number(formatUnits(BigInt(servicePriceBNB.toString()), 18)).toFixed(3) : AUDIT_COST_BNB} BNB & Start Audit`
              }
            </Button>
          )}
          
          <p className="text-sm text-gray-400 text-center">
            {testMode ? (
              <>
                🧪 <strong>TEST MODE:</strong> Audit runs without blockchain payment.
                <br />
                No SSTL tokens will be minted. Perfect for testing contract address feature.
              </>
            ) : (
              <>
                Payment of {servicePriceBNB ? Number(formatUnits(BigInt(servicePriceBNB.toString()), 18)).toFixed(3) : AUDIT_COST_BNB} BNB is required to run the AI Audit.
                <br />
                67 SSTL tokens will be minted to the PoUW pool upon successful payment.
              </>
            )}
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-600">
            <p className="text-center text-gray-300 text-sm sm:text-base flex items-center justify-center gap-2">
              {statusMessage}
              {statusMessage === 'Approval confirmed! Verifying allowance on blockchain...' && (
                <Loader2 className="h-4 w-4 animate-spin text-neon" />
              )}
              {auditCompletedTxHash && (
                <a 
                  href={`https://bscscan.com/tx/${auditCompletedTxHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-neon hover:underline ml-1"
                >
                  0x{auditCompletedTxHash.slice(2, 5)}...{auditCompletedTxHash.slice(-5)}
                </a>
              )}
            </p>
          </div>
        )}

        {/* Audit Results */}
        {auditData && (
          <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 bg-gray-800 rounded-lg border border-gray-600">
              <h3 className="text-lg sm:text-xl font-orbitron font-bold mb-3 sm:mb-4 text-green-400">Audit Results</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Contract Name:</p>
                  <p className="font-mono text-white">{auditData.contractName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Security Score:</p>
                  <div className="flex items-center justify-center mt-2">
                    <CircularProgress score={auditData.securityScore} />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Overall Assessment:</p>
                <p className="text-white">{auditData.overallAssessment}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Vulnerability Breakdown:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div className="text-red-400">Critical: {auditData.vulnerabilityBreakdown.Critical}</div>
                  <div className="text-orange-400">High: {auditData.vulnerabilityBreakdown.High}</div>
                  <div className="text-yellow-400">Medium: {auditData.vulnerabilityBreakdown.Medium}</div>
                  <div className="text-blue-400">Low: {auditData.vulnerabilityBreakdown.Low}</div>
                  <div className="text-purple-400">Informational: {auditData.vulnerabilityBreakdown.Informational}</div>
                  <div className="text-cyan-400">Gas: {auditData.vulnerabilityBreakdown.Gas}</div>
                </div>
              </div>

              {auditData.vulnerabilities && auditData.vulnerabilities.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm sm:text-base text-gray-400 mb-2">Vulnerabilities Found:</p>
                  <div className="space-y-2 sm:space-y-3">
                    {auditData.vulnerabilities.slice(0, 3).map((vuln, index) => (
                      <div key={index} className="p-3 sm:p-4 bg-gray-700 rounded border-l-4 border-red-500">
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
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4 sm:mt-6">
                <Button variant="outline" onClick={handleViewReport} className="font-orbitron text-sm sm:text-base">
                  <FileText className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleUploadToIPFS} 
                  disabled={ipfsUploading}
                  className="font-orbitron text-sm sm:text-base border-blue-500 hover:bg-blue-500/10"
                >
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

              {/* IPFS Upload Result */}
              {ipfsUploadResult && (
                <div className="mt-4 p-4 rounded-lg border">
                  {ipfsUploadResult.hash ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">Successfully uploaded to IPFS!</span>
                      </div>
                      
                      <div className="text-xs space-y-1 text-gray-300">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Hash:</span>
                          <span className="font-mono break-all">{ipfsUploadResult.hash}</span>
                        </div>
                        
                        {ipfsUploadResult.url && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 min-w-[60px]">URL:</span>
                            <a 
                              href={ipfsUploadResult.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 break-all"
                            >
                              {ipfsUploadResult.url}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : ipfsUploadResult.error ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Upload failed: {ipfsUploadResult.error}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarAIAuditSmartContract;