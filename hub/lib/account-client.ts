"use client";

import { createClient } from "@supabase/supabase-js";

const enabled = process.env.NEXT_PUBLIC_BILLPAY_ACCOUNTS_ENABLED === "true";
const url = process.env.NEXT_PUBLIC_BILLPAY_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_BILLPAY_SUPABASE_PUBLISHABLE_KEY ?? "";
export const turnstileKey = process.env.NEXT_PUBLIC_BILLPAY_TURNSTILE_SITE_KEY ?? "";

export const accountClient = enabled && /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+\/?$/i.test(url) &&
  /^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && /^[A-Za-z0-9_-]+$/.test(turnstileKey)
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;

type ResultStatus = "not_started" | "pending" | "verified" | "rejected";
type ChainStatus = "not_linked" | "unconfigured" | "unavailable" | "eligible" | "ineligible" | "available";
export type AccountProfile = {
  wallet: string | null;
  verification: { identity: ResultStatus; invoice: ResultStatus; invoiceId: string | null };
  chain: { bill: ChainStatus; gold: ChainStatus; council: ChainStatus; balance: string | null; tokenAddress?: string | null };
  access: { applicant: boolean; gold: boolean; council: boolean; founder: boolean };
  requiresMfa: boolean;
  elevated: boolean;
};

class AccountRequestError extends Error {
  constructor(public readonly code: string) { super(code); }
}

export async function accountRequest<T>(accessToken: string, action: string, params: Record<string, string> = {}): Promise<T> {
  const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/billpay-account`, {
    method: "POST", headers: { Authorization: `Bearer ${accessToken}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, action }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new AccountRequestError(result?.error || "temporarily_unavailable");
  return result as T;
}

const walletErrors: Record<string, string> = {
  invalid_wallet: "Le portefeuille n’a pas retourné une adresse ou une signature valide.",
  challenge_unavailable: "Attendez quelques secondes avant de réessayer. Un portefeuille déjà associé ne peut pas être remplacé ici.",
  signature_invalid: "Signature non vérifiée ou demande expirée. Relancez l’association.",
  link_unavailable: "Cette association a expiré ou le portefeuille est déjà associé à un compte.",
};

export async function linkWallet(accessToken: string) {
  const provider = (window as Window & { ethereum?: { request: (args: { method: string; params?: string[] }) => Promise<unknown> } }).ethereum;
  if (!provider?.request) throw new Error("Aucun wallet compatible détecté. Ouvrez le Hub dans le navigateur de votre wallet ou utilisez une extension.");
  let address: string;
  try {
    const result = await provider.request({ method: "eth_requestAccounts" });
    const selected = Array.isArray(result) ? result[0] : null;
    if (typeof selected !== "string" || !/^0x[0-9a-f]{40}$/i.test(selected)) throw new Error("invalid wallet");
    address = selected;
  } catch {
    throw new Error("Le wallet n’a pas partagé d’adresse.");
  }
  if (await provider.request({ method: "eth_chainId" }) !== "0x2105") {
    throw new Error("Sélectionnez le réseau Base dans votre wallet avant de réessayer.");
  }
  try {
    const challenge = await accountRequest<{ message: string; nonce: string }>(accessToken, "wallet_challenge", { address });
    if (!challenge.message || !/^[0-9a-f]{32}$/.test(challenge.nonce)) throw new AccountRequestError("invalid_wallet");
    const hex = "0x" + Array.from(new TextEncoder().encode(challenge.message), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const signature = await provider.request({ method: "personal_sign", params: [hex, address] }).catch(() => {
      throw new Error("La signature d’association n’a pas été fournie.");
    });
    if (typeof signature !== "string") throw new AccountRequestError("invalid_wallet");
    await accountRequest(accessToken, "wallet_verify", { address, nonce: challenge.nonce, signature });
  } catch (error) {
    if (error instanceof AccountRequestError) throw new Error(walletErrors[error.code] ?? "Le service d’association est momentanément indisponible.");
    throw error;
  }
}
