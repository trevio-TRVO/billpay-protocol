import { createClient } from "npm:@supabase/supabase-js@2.109.0";
import { createPublicClient, formatUnits, getAddress, hashMessage, http, isAddress, parseAbi, verifyMessage, type Address, type Hex } from "npm:viem@2.57.20";
import { base } from "npm:viem@2.57.20/chains";
import { getAccess, makeChallenge, safeAal } from "./policy.mjs";

const abi = parseAbi([
  "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)",
  "function token() view returns (address)", "function grantCount(address) view returns (uint256)",
  "function isMember(address) view returns (bool)", "function isValidSignature(bytes32,bytes) view returns (bytes4)",
]);
const origin = Deno.env.get("BILLPAY_ORIGIN")?.trim();
const allowedOrigin = (() => {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.origin === origin ? origin : null;
  } catch {
    return null;
  }
})();
const baseRpc = Deno.env.get("BILLPAY_BASE_RPC_URL");
const serviceUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const client = serviceUrl && serviceKey ? createClient(serviceUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const chain = baseRpc ? createPublicClient({ chain: base, transport: http(baseRpc, { timeout: 4500, retryCount: 0 }) }) : null;

class Rejected extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
const addressOf = (value: unknown): Address | null =>
  typeof value === "string" && isAddress(value, { strict: false }) && !/^0x0{40}$/i.test(value)
    ? getAddress(value.toLowerCase()) : null;
const assets = {
  bill: addressOf(Deno.env.get("BILLPAY_TOKEN_ADDRESS")),
  lots: addressOf(Deno.env.get("BILLPAY_LOTS_ADDRESS")),
  council: addressOf(Deno.env.get("BILLPAY_COUNCIL_ADDRESS")),
};
const sigPattern = /^0x(?:[0-9a-f]{2}){1,2048}$/i;

async function chainAccess(wallet: Address | null) {
  const missing = { bill: "unconfigured", gold: "unconfigured", council: "unconfigured" };
  if (!wallet) return { bill: "not_linked", gold: "not_linked", council: "not_linked", balance: null, grantCount: null };
  if (!chain || !(assets.bill || assets.lots || assets.council)) return { ...missing, balance: null, grantCount: null };
  const rpc = chain;
  const available = await rpc.getChainId().then((id) => id === base.id).catch(() => false);
  if (!available) return {
    bill: assets.bill ? "unavailable" : "unconfigured", gold: assets.bill && assets.lots ? "unavailable" : "unconfigured",
    council: assets.council ? "unavailable" : "unconfigured", balance: null, grantCount: null,
  };
  const deployed = async (address: Address) => {
    const code = await rpc.getCode({ address });
    if (!code || code === "0x") throw Error("No contract");
  };
  const tokenAddress = assets.bill;
  const lotsAddress = assets.lots;
  const councilAddress = assets.council;
  const [bill, gold, council] = await Promise.all([
    tokenAddress ? (async () => {
      await deployed(tokenAddress);
      const [raw, decimals] = await Promise.all([
        rpc.readContract({ address: tokenAddress, abi, functionName: "balanceOf", args: [wallet] }),
        rpc.readContract({ address: tokenAddress, abi, functionName: "decimals" }),
      ]);
      return { state: "available", balance: formatUnits(raw, decimals), address: tokenAddress };
    })().catch(() => ({ state: "unavailable", balance: null, address: null })) :
      { state: "unconfigured", balance: null, address: null },
    tokenAddress && lotsAddress ? (async () => {
      await Promise.all([deployed(lotsAddress), deployed(tokenAddress)]);
      const ref = await rpc.readContract({ address: lotsAddress, abi, functionName: "token" });
      if (ref.toLowerCase() !== tokenAddress.toLowerCase()) throw Error("Unexpected token");
      const grants = await rpc.readContract({ address: lotsAddress, abi, functionName: "grantCount", args: [wallet] });
      return { state: grants > 0n ? "eligible" : "ineligible", count: grants.toString() };
    })().catch(() => ({ state: "unavailable", count: null })) : { state: "unconfigured", count: null },
    councilAddress ? (async () => {
      await deployed(councilAddress);
      return await rpc.readContract({ address: councilAddress, abi, functionName: "isMember", args: [wallet] })
        ? "eligible" : "ineligible";
    })().catch(() => "unavailable") : "unconfigured",
  ]);
  return { bill: bill.state, balance: bill.balance, tokenAddress: bill.address, gold: gold.state, grantCount: gold.count, council };
}

async function signedBy(address: Address, message: string, signature: Hex) {
  if (await verifyMessage({ address, message, signature }).catch(() => false)) return true;
  if (!chain || await chain.getChainId() !== base.id) return false;
  const code = await chain.getCode({ address });
  if (!code || code === "0x") return false;
  const result = await chain.readContract({ address, abi, functionName: "isValidSignature", args: [hashMessage(message), signature] });
  return result === "0x1626ba7e";
}

Deno.serve(async (req) => {
  const caller = req.headers.get("Origin");
  const headers = {
    "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin",
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
  if (!allowedOrigin) return reply({ error: "not_configured" }, 503);
  if (caller !== allowedOrigin) return reply({ error: "origin_denied" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  if (!client) return reply({ error: "not_configured" }, 503);

  try {
    const token = req.headers.get("Authorization")?.match(/^Bearer ([a-zA-Z0-9_.-]+)$/)?.[1];
    if (!token || token.length > 8192) throw new Rejected(401, "unauthorized");
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user?.email_confirmed_at) throw new Rejected(401, "unauthorized");
    const user = data.user.id;
    const elevated = safeAal(token);
    const bodyText = await req.text();
    if (bodyText.length > 8192) throw new Rejected(413, "invalid_request");
    let body;
    try { body = JSON.parse(bodyText); } catch { throw new Rejected(400, "invalid_request"); }

    switch (body?.action) {
      case "profile":
      case "workspace": {
        const [identity, invoice, link, founder] = await Promise.all([
          client.from("billpay_applicant_checks").select("identity_status").eq("user_id", user).maybeSingle(),
          client.from("billpay_invoice_checks").select("id,status").eq("user_id", user)
            .order("updated_at", { ascending: false }).order("id").limit(1).maybeSingle(),
          client.from("billpay_wallet_links").select("address").eq("user_id", user).maybeSingle(),
          client.from("billpay_founder_account").select("user_id").eq("user_id", user).maybeSingle(),
        ]);
        if ([identity, invoice, link, founder].some((v) => v.error)) throw Error("Profile unavailable");
        const wallet = addressOf(link.data?.address);
        const chainState = await chainAccess(wallet);
        const verification = {
          identity: identity.data?.identity_status ?? "not_started",
          invoice: invoice.data?.status ?? "not_started",
          invoiceId: invoice.data?.id ?? null,
        };
        const access = getAccess({ ...verification, ...chainState, founder: !!founder.data, elevated });
        if (body.action === "workspace") {
          switch (body.role) {
            case "applicant":
              if (!access.applicant) break;
              return reply({ role: "applicant", reference: verification.invoiceId });
            case "gold":
              if (!access.gold) break;
              return reply({ role: "gold", lots: chainState.grantCount });
            case "council":
              if (!access.council) break;
              return reply({ role: "council", registry: assets.council });
            case "founder":
              if (!access.founder) break;
              return reply({ role: "founder", sources: {
                token: Boolean(assets.bill && chain), lots: Boolean(assets.bill && assets.lots && chain), registry: Boolean(assets.council && chain),
              } });
          }
          throw new Rejected(403, "access_denied");
        }
        return reply({ wallet, verification, chain: chainState, access, elevated, requiresMfa: !elevated && (!!founder.data || chainState.council === "eligible") });
      }
      case "wallet_challenge": {
        const address = addressOf(body.address);
        if (!address) throw new Rejected(400, "invalid_wallet");
        const nonce = crypto.randomUUID().replaceAll("-", "");
        const { message, issuedAt, expiresAt } = makeChallenge({ origin: allowedOrigin, address, nonce, now: new Date() });
        const { data: issued, error } = await client.rpc("billpay_issue_wallet_challenge", {
          p_user: user, p_address: address.toLowerCase(), p_nonce: nonce, p_message: message, p_issued: issuedAt, p_expires: expiresAt,
        });
        if (error) throw Error("Challenge unavailable");
        if (!issued) throw new Rejected(409, "challenge_unavailable");
        return reply({ message, nonce });
      }
      case "wallet_verify": {
        const address = addressOf(body.address);
        if (!address || typeof body.nonce !== "string" || !/^[0-9a-f]{32}$/.test(body.nonce) ||
          typeof body.signature !== "string" || !sigPattern.test(body.signature)) throw new Rejected(400, "invalid_wallet");
        const { data: pending, error } = await client.from("billpay_wallet_challenges")
          .select("message").eq("user_id", user).eq("address", address.toLowerCase()).eq("nonce", body.nonce)
          .is("used_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
        if (error) throw Error("Challenge unavailable");
        if (!pending || !(await signedBy(address, pending.message, body.signature as Hex).catch(() => false))) {
          throw new Rejected(403, "signature_invalid");
        }
        const consumed = await client.rpc("billpay_complete_wallet_challenge", {
          p_user: user, p_address: address.toLowerCase(), p_nonce: body.nonce,
        });
        if (consumed.error) throw Error("Challenge unavailable");
        if (!consumed.data) throw new Rejected(409, "link_unavailable");
        return reply({ wallet: address });
      }
      default: throw new Rejected(400, "invalid_request");
    }
  } catch (error) {
    if (error instanceof Rejected) return reply({ error: error.code }, error.status);
    return reply({ error: "temporarily_unavailable" }, 503);
  }
});
