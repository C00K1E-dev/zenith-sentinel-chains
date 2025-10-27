export const GENESIS_CONTRACT_ADDRESS = "0x2E06ADb9bF766278BEbf748D54ABC3bC6AcF146b";
export const GENESIS_CHAIN_ID = 97; // BSC Testnet
export { default as GENESIS_ABI } from "./SmartSentinelsGenesis.json";

export const AI_AUDIT_CONTRACT_ADDRESS = "0xE4b920d1a85Bb4d3dAf59b3f5CCC8BB2BA358226";
export const AI_AUDIT_CHAIN_ID = 97; // BSC Testnet
export { default as AI_AUDIT_ABI } from "./SmartSentinelsAIAuditNFT.json";

// PoUW System Contracts - ALL DEPLOYED ✅
// SSTL Token: 100M max supply (60M initial mint to Treasury, 40M for PoUW over 4 years)
export const SSTL_TOKEN_ADDRESS = "0xAE56bdC2eC42f9AD3513d5FbD8655040d6C98D5D"; // SmartSentinelsToken - DEPLOYED ✅
export const POUW_POOL_ADDRESS = "0xbAC7Abe9759A2f30521ca72885f05741878C4a53"; // SmartSentinelsPoUW - DEPLOYED ✅
export const AUDIT_GATEWAY_ADDRESS = "0x1709d8b3eb5c5D8695f45D7A8d17fa833a204b40"; // AIAuditAgentGateway - DEPLOYED ✅
export { default as SSTL_TOKEN_ABI } from "./SmartSentinelsToken.json";
export { default as POUW_POOL_ABI } from "./SmartSentinelsPoUW.json";
export { default as AUDIT_GATEWAY_ABI } from "./AIAuditAgentGateway.json";