"use client";

import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
} from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, arbitrum, sepolia, AppKitNetwork, ChainNamespace } from "@reown/appkit/networks";
import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { useCallback } from "react";
import { createWalletClient, custom } from "viem";
import { Button } from "@/components/ui/button";
// const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;
const projectId = "dad02044f8131fadb9ebd0a2d7c646a3";

const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com",
  icons: ["https://avatars.mywebsite.com/"],
};

createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [ mainnet, arbitrum, sepolia] as [AppKitNetwork, ...AppKitNetwork[]],
  projectId,
  features: {
    analytics: true,
  },
});

export function useEthersFromAppKit() {
  const { walletProvider } = useAppKitProvider<unknown>("eip155");
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();

  function getProvider(): BrowserProvider | null {
    if (!walletProvider || !chainId) return null;
    return new BrowserProvider(walletProvider as any, Number(chainId));
  }

  function getSigner(): ReturnType<BrowserProvider['getSigner']> | null {
    const provider = getProvider();
    if (!provider || !address) return null;
    return provider.getSigner(address); // ✅ correct way
  }

  const getUserBalance = useCallback(async () => {
    try {
      const provider = getProvider();
      if (!provider || !address) return null;
      return await provider.getBalance(address);
    } catch (err) {
      console.error("getUserBalance error:", err);
      return null;
    }
  }, [getProvider, address]);

  return { getSigner, getUserBalance, address, isConnected, chainId };
}

export default function ConnectButton() {
  const { open } = useAppKit();
  const { address } = useAppKitAccount();
//   const { setIsAuthenticated, setUserData } = authStore();
  const { walletProvider }: any = useAppKitProvider("eip155" as ChainNamespace);

//   useEffect(() => {
//     const setupWallet = async () => {
//       if (!walletProvider || !address) return;
//       const token = Cookies.get(ACCESS_TOKEN);
//       if (token) {
//         return;
//       }
//       try {
//         const client = createWalletClient({
//           chain: lineaSepolia,
//           transport: custom(walletProvider),
//         });
//         if (client) {
//           const message = Login to MyApp;
//           const signature = await client.signMessage({
//             account: address as 0x${string},
//             message,
//           });
//           const data = { walletAddress: address, signature };
//           const res: ActionResponseType = await verifyWalletLogin(data);
//           if (res?.success) {
//             Cookies.set(ACCESS_TOKEN, res?.data.data.accessToken, {
//               expires: ACCESS_TOKEN_EXPIRE,
//             });
//             setUserData(res?.data?.data);
//             await setIsAuthenticated(true);
//             toast.success("Login successful!");
//           }
//         }
//       } catch (error) {
//         console.error("Wallet setup/signing failed:", error);
//       }
//     };
//     setupWallet();
//   }, [walletProvider, address]);

  const handleConnect = () => {
    open();
  };

  return (
    <>
      <Button
        size="lg"
        className="bg-border-gradient2 rounded-full border-0 p-[1px]"
        onClick={handleConnect}
      >
        <div className="text-primary bg-background flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 font-semibold outline-none max-sm:text-sm sm:px-5 sm:py-2">
          Connect Wallet
        </div>
      </Button>
    </>
  );
}
