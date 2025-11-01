import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Upload, Play, FileText, Wrench, Brain, DollarSign, CheckCircle, Award, Loader2, Wallet, AlertTriangle, X, Search, Cloud, ExternalLink } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import styles from './sidebarAIAuditSmartContract.module.css';
import auditReportStyles from './auditReportStyles.css?raw';

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
// Switching to the more robust 'flash' model to handle complex structured output requests
const API_MODEL = "gemini-2.0-flash";
const API_URL_TEMPLATE = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=`;
// Logo URL - Using SVG for perfect scaling
const LOGO_URL = "/ss-icon.svg";

// Payment Configuration - BSC MAINNET (DEPLOYED ✅)
const BSC_MAINNET_CHAIN_ID = 56;
const SSTL_CONTRACT = SSTL_TOKEN_ADDRESS as `0x${string}`;
const PAYMENT_RECIPIENT = '0x46e451d555ebCB4ccE5087555a07F6e69D017b05' as `0x${string}`; // Your Wallet (AI Agent Creator)
const AUDIT_COST = '1000'; // 1000 SSTL tokens (matches deployed contract)
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
                    lineNumbers: { type: "ARRAY", items: { type: "INTEGER" }, description: "Array of line numbers where the issue occurs." },
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
            "\n• Critical (Immediate fund loss, contract takeover): -20 points" +
            "\n• High (Significant exploitable flaw): -10 points" +
            "\n• Medium (Issue with workarounds/conditions): -4 points" +
            "\n• Low (Best practice deviation, minor risk): -2 points" +
            "\n• Informational (Design notes, suggestions): -0.5 points" +
            "\n• Gas (Optimization opportunities): -0.2 points" +
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
            "\n6. EXPLAIN findings clearly with mitigation suggestions"
        );
    }, []);
};

// --- 3. Deterministic HTML Generation from JSON Counts (Matching the Screenshot) ---

const generateAuditHTML = (auditData: AuditData): string => {
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

    // Determine which payment method to use (prefer BNB if both enabled)
    const useNativePayment = acceptBNB && !acceptToken ? true : acceptBNB ? true : false;
    
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
                const currentPrice = servicePriceBNB ? BigInt(servicePriceBNB.toString()) : parseUnits('0.1', 18);
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

            const htmlContent = generateAuditHTML(auditData);
            const contractName = auditData.contractName || 'Contract';

            console.log('🔄 Starting IPFS upload for audit report...');
            
            const result = await uploadAuditReportToIPFS(htmlContent, contractName, auditData);
            
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
                        maxOutputTokens: 8192,
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

            const auditData = JSON.parse(content.trim());
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
      <h1 className="text-2xl sm:text-3xl font-orbitron font-bold mb-4 sm:mb-6 neon-glow">AI Audit - Smart Contract Analysis</h1>
      <div className="space-y-4 sm:space-y-6">
        {/* AI Training Information */}
        <div className="audit-training-info bg-[#1f1f1f] border border-yellow-300/30 rounded-lg p-4 sm:p-6 md:p-8 mb-6 text-center shadow-lg shadow-yellow-500/10">
          <h4 className="text-primary mb-3 sm:mb-4 text-lg sm:text-xl font-semibold flex items-center justify-center gap-2 sm:gap-3">
            <Brain size={20} className="text-primary" />
            SmartSentinels AI Training
          </h4>
          <div className="text-white text-sm sm:text-base leading-relaxed max-w-4xl mx-auto">
            <p className="mb-3 sm:mb-4">
              <strong className="text-primary">Research-Driven Training:</strong> <span>This AI agent was trained on comprehensive security research from the</span>
              <a href="https://entethalliance.github.io/eta-registry/security-levels-spec.html#sec-2-unicode"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-primary underline hover:text-yellow-300 ml-1">
                Ethereum Technical Alliance (ETA) Registry
              </a>
              <span>, ensuring industry-standard vulnerability detection.</span>
            </p>
            <p className="mb-3 sm:mb-4">
              <strong className="text-primary">SWC Registry Integration:</strong> <span>Trained on all <span className="text-primary">37 Smart Contract Weakness Classification</span> (SWC) vulnerabilities
              with detailed analysis patterns and remediation strategies.</span>
            </p>
          </div>
        </div>
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
          <label htmlFor="file-upload-ts" className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-input rounded-md bg-background hover:bg-[#f8f422] hover:text-[#1f1f1f] cursor-pointer text-sm sm:text-base font-orbitron transition-colors">
            <Upload size={14} />
            Upload .sol File
          </label>
        </div>

        {/* Payment Method Display */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 font-orbitron mb-2">
            💳 Payment Method: <span className="text-neon font-bold">{useNativePayment ? 'BNB' : 'SSTL Tokens'}</span>
          </p>
          <p className="text-xs text-gray-400">
            {useNativePayment 
              ? `Pay ${servicePriceBNB ? Number(formatUnits(BigInt(servicePriceBNB.toString()), 18)).toFixed(3) : '0.45'} BNB to run the audit`
              : `Pay ${servicePriceSSTL ? Number(formatUnits(BigInt(servicePriceSSTL.toString()), Number(tokenDecimals || 18))).toFixed(0) : '1000'} SSTL to run the audit`
            }
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Debug: acceptBNB={String(acceptBNB)} | acceptToken={String(acceptToken)} | useNative={String(useNativePayment)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Show SSTL approval button only when using SSTL payments and allowance is insufficient */}
          {!useNativePayment && !approvalTxHash && allowance !== undefined && servicePriceSSTL && tokenDecimals ? (() => {
            const requiredAmount = BigInt(servicePriceSSTL.toString());
            const allowanceValue = BigInt(allowance.toString());
            const hasAllowance = allowanceValue >= requiredAmount;
            return !hasAllowance ? (
              <Button 
                variant="hero" 
                className="font-orbitron text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3" 
                onClick={handleApproveSSTL} 
                disabled={isProcessing || !code.trim()}
              >
                {isProcessing && currentTransactionType === 'approve' ? 'Approving...' : `Approve ${Number(formatUnits(BigInt(servicePriceSSTL.toString()), Number(tokenDecimals))).toFixed(0)} SSTL`}
              </Button>
            ) : null;
          })() : null}
          
          <Button 
            variant="hero" 
            className="font-orbitron text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3" 
            onClick={handlePayAndRunAudit} 
            disabled={isProcessing || !code.trim() || (!useNativePayment && allowance !== undefined && servicePriceSSTL && tokenDecimals && BigInt(allowance.toString()) < BigInt(servicePriceSSTL.toString()))}
          >
            {isProcessing && currentTransactionType === 'payAndRunAudit' ? 'Processing Payment...' : 
              useNativePayment ? 
                `Pay ${servicePriceBNB ? Number(formatUnits(BigInt(servicePriceBNB.toString()), 18)).toFixed(3) : '0.45'} BNB & Start Audit` :
                `Pay ${servicePriceSSTL ? Number(formatUnits(BigInt(servicePriceSSTL.toString()), Number(tokenDecimals || 18))).toFixed(0) : '1000'} SSTL & Start Audit`
            }
          </Button>
          {/* )} */}
          <p className="text-sm text-gray-400 text-center">
            {useNativePayment ? 
              `Payment of ${servicePriceBNB ? Number(formatUnits(BigInt(servicePriceBNB.toString()), 18)).toFixed(3) : '0.45'} BNB is required to run the AI Audit.` :
              `Payment of ${servicePriceSSTL ? Number(formatUnits(BigInt(servicePriceSSTL.toString()), Number(tokenDecimals || 18))).toFixed(0) : '1000'} SSTL tokens is required to run the AI Audit.`
            }
            <br />
            67 SSTL tokens will be minted to the PoUW pool upon successful payment.
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