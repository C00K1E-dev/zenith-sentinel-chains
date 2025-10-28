export const GENESIS_CONTRACT_ADDRESS = "0x51e3F92f65A4CFB43b923215053f87E43B98F5B2";
export const GENESIS_CHAIN_ID = 97; // BSC Testnet
export { default as GENESIS_ABI } from "./SmartSentinelsGenesis.json";

export const AI_AUDIT_CONTRACT_ADDRESS = "0x5d481fc291e07DEed888cfdC2503f5b941bf1F72";
export const AI_AUDIT_CHAIN_ID = 97; // BSC Testnet
export { default as AI_AUDIT_ABI } from "./SmartSentinelsAIAuditNFT.json";

// PoUW System Contracts - ALL DEPLOYED ✅
// SSTL Token: 100M max supply (60M initial mint to Treasury, 40M for PoUW over 4 years)
export const SSTL_TOKEN_ADDRESS = "0x25A48743cE22d68500763b4556026a8863C07555"; // SmartSentinelsToken - DEPLOYED ✅
export const POUW_POOL_ADDRESS = "0x15fBce4D325939b3C1A4719D67DE0AC94fC0088e"; // SmartSentinelsPoUW - DEPLOYED ✅
export const AUDIT_GATEWAY_ADDRESS = "0x859B9A1942f22ebc420886E649C34bEaC4149FBa"; // AIAuditAgentGateway - REDEPLOYED (FIXED tokenByIndex) ✅
export { default as SSTL_TOKEN_ABI } from "./SmartSentinelsToken.json";
export { default as POUW_POOL_ABI } from "./SmartSentinelsPoUW.json";
export { default as AUDIT_GATEWAY_ABI } from "./AIAuditAgentGateway.json";