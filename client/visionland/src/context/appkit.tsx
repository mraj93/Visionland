
// import type { ReactNode } from "react";
// import { createAppKit } from "@reown/appkit/react";
// import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";
// import { mainnet, arbitrum, sepolia } from "@reown/appkit/networks";
// import { Button } from "@/components/ui/button";

// // 1. Get projectId at https://dashboard.reown.com
// const projectId = "dad02044f8131fadb9ebd0a2d7c646a3";

// // 2. Create a metadata object
// const metadata = {
//   name: "My Website",
//   description: "My Website description",
//   url: "https://mywebsite.com", // origin must match your domain & subdomain
//   icons: ["https://avatars.mywebsite.com/"],
// };

// // 3. Create the AppKit instance
// createAppKit({
//   adapters: [new Ethers5Adapter()],
//   metadata: metadata,
//   networks: [sepolia,mainnet, arbitrum],
//   projectId,
//   features: {
//     analytics: true, // Optional - defaults to your Cloud configuration
//   },
// });
"use client";


import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    sepolia,
    mainnet,
    polygon,
    optimism,
    filecoinCalibration,
    base,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";

const queryClient = new QueryClient();


const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'dad02044f8131fadb9ebd0a2d7c646a3',
    chains: [filecoinCalibration,sepolia, mainnet, polygon, optimism, base],
    //   ssr: true, // If your dApp uses server side rendering (SSR)
});


export function AppKit({ children }: { children: React.ReactNode }) {
    return (
        <>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>

                    <RainbowKitProvider>
                        {children}
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </>
    );
}