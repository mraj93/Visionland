"use client";
import type { ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";
import { mainnet, arbitrum, sepolia } from "@reown/appkit/networks";
import { Button } from "@/components/ui/button";

// 1. Get projectId at https://dashboard.reown.com
const projectId = "dad02044f8131fadb9ebd0a2d7c646a3";

// 2. Create a metadata object
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // origin must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

// 3. Create the AppKit instance
createAppKit({
  adapters: [new Ethers5Adapter()],
  metadata: metadata,
  networks: [sepolia,mainnet, arbitrum],
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export function AppKit({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}