// lib/filecoin.ts
"use client";

import { Synapse } from "@filoz/synapse-sdk";
import { ethers } from "ethers";

let synapseReady: Promise<Synapse> | null = null;

async function getProvider(): Promise<ethers.providers.JsonRpcProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Please open in a browser with MetaMask (or similar).");
  }
  const provider = new ethers.providers.JsonRpcProvider(window.ethereum);
  // request account permission once
  await provider.send("eth_requestAccounts", []);
  return provider;
}

export async function getSynapse(): Promise<Synapse> {
  if (!synapseReady) {
    synapseReady = (async () => {
      const provider = await getProvider();
      return await Synapse.create({ provider });
    })();
  }
  return synapseReady;
}

export async function uploadJSON(obj: unknown): Promise<{ pieceCid: string }> {
  const synapse = await getSynapse();
  const data = new TextEncoder().encode(JSON.stringify(obj, null, 2));
  const result = await synapse.storage.upload(data);
  return { pieceCid: result.pieceCid };
}

export async function downloadJSON<T = unknown>(pieceCid: string): Promise<T> {
  const synapse = await getSynapse();
  const bytes = await synapse.storage.download(pieceCid);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}
