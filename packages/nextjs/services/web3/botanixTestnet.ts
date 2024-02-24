import { type Chain } from "viem";

export const botanixTestnet = {
  id: 3636,
  network: "Botanix Testnet",
  name: "Botanix Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  testnet: true,
  rpcUrls: {
    default: { http: ["https://node.botanixlabs.dev"] },
    public: { http: ["https://node.botanixlabs.dev"] },
  },
  blockExplorers: {
    default: { name: "3xpl", url: "https://3xpl.com/botanix" },
  },
} as const satisfies Chain;
