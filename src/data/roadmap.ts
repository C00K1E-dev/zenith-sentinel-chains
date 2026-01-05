interface DataType {
  id: number;
  sub_title: string;
  title: string;
  desc: string;
}

const road_map_data: DataType[] = [
  {
    id: 1,
    sub_title: "Q3–Q4 2025 (DONE)",
    title: "Phase 1: MVP Launch & PoUW Architecture",
    desc: "Deployed the SSTL smart contracts, built and launched the PDF Audit AI MVP, built a service that lets users create a telegram agent. Launched Genesis NFT Collection and AI Audit NFT collection.",
  },
  {
    id: 2,
    sub_title: "Q1 2026 (IN PROGRESS)",
    title: "Phase 2: AI Agent Expansion & VC Engagement",
    desc: "Scaling the number of deployed AI agents on Jetson Orin and UM790 Pro devices. Engaging strategic investors including Binance Labs, SunDAO, and other venture funds. Pitch deck, tokenomics, and MVP are now live. AIDA Feature rollout, TGE seed round.",
  },
  {
    id: 3,
    sub_title: "Q2 2026",
    title: "Strategic Round & Business Onboarding",
    desc: "Initiate the Series A round. Target real-world clients in verticals like legal, medical, and fintech. Deploy 50+ agents and integrate the first subscription-based SaaS dashboard for agent output tracking.",
  },
  {
    id: 4,
    sub_title: "Q3 2026",
    title: "Platform Expansion & Ecosystem Growth",
    desc: "Expand our AI agent network through strategic partnerships. Launch enterprise-grade tools for agent deployment and monitoring. Focus on building sustainable revenue streams through premium services and enterprise solutions.",
  },
  {
    id: 5,
    sub_title: "Q3–Q4 2026",
    title: "Multi-Agent PoUW Marketplace",
    desc: "Launch a decentralized marketplace of AI agents capable of working across industries. Allow users and businesses to deploy and interact with agents, using SSTL as the core utility token.",
  },
  {
    id: 6,
    sub_title: "Early 2027 and Beyond",
    title: "DAO Governance & Global Scaling",
    desc: "Transition to a DAO-based treasury and community-led governance. Expand into multiple regions with localized AI agents. Target Tier 1 exchange listings and full decentralization of the SmartSentinels grid.",
  },
];

export default road_map_data;