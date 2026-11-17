import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "npm:viem@2.57.20/accounts";

Deno.test("account API: configured origin, independent access, MFA and wallet signature", async () => {
  const keys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BILLPAY_ORIGIN", "BILLPAY_BASE_RPC_URL"];
  const previous = keys.map((key) => Deno.env.get(key));
  const restoreFetch = globalThis.fetch;
  const restoreServe = Deno.serve;
  const owner = privateKeyToAccount(generatePrivateKey());
  const other = privateKeyToAccount(generatePrivateKey());
  const user = "10000000-0000-4000-8000-000000000001";
  const origin = "https://billpay-fixture.example";
  const aal1 = "fixture.eyJhYWwiOiJhYWwxIn0.signature";
  const aal2 = "fixture.eyJhYWwiOiJhYWwyIn0.signature";
  const address = owner.address.toLowerCase();
  let challenge;
  let wallet;
  let handler;
  const json = (data, status = 200) => Response.json(data, { status });
  const invoke = async (action, data = {}, token = aal1, caller = origin) => {
    const response = await handler(new Request(`${origin}/edge`, {
      method: "POST",
      headers: { Origin: caller, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...data }),
    }));
    return { status: response.status, body: await response.json(), headers: response.headers };
  };

  try {
    Deno.env.set("SUPABASE_URL", "https://auth-fixture.example");
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "unused-fixture");
    Deno.env.delete("BILLPAY_ORIGIN");
    Deno.env.delete("BILLPAY_BASE_RPC_URL");
    Deno.serve = (callback) => { handler = callback; };
    globalThis.fetch = async (url, opts) => {
      const request = new Request(url, opts);
      const { pathname, searchParams } = new URL(request.url);
      if (pathname === "/auth/v1/user") {
        return [aal1, aal2].some((token) => request.headers.get("Authorization") === `Bearer ${token}`)
          ? json({ id: user, email_confirmed_at: "2026-11-17T00:00:00Z" }) : json({ msg: "unauthorized" }, 401);
      }
      if (pathname === "/rest/v1/rpc/billpay_issue_wallet_challenge") {
        if (wallet) return json(false);
        challenge = await request.json();
        return json(true);
      }
      if (pathname === "/rest/v1/rpc/billpay_complete_wallet_challenge") {
        const body = await request.json();
        if (wallet || !challenge || body.p_nonce !== challenge.p_nonce) return json(false);
        wallet = { address: body.p_address };
        challenge = undefined;
        return json(true);
      }
      const matchingUser = (rows) => json(searchParams.get("user_id") === `eq.${user}` ? rows : []);
      if (pathname.endsWith("/billpay_wallet_challenges")) {
        return matchingUser(challenge && `eq.${challenge.p_nonce}` === searchParams.get("nonce") ? [{ message: challenge.p_message }] : []);
      }
      if (pathname.endsWith("/billpay_wallet_links")) return matchingUser(wallet ? [wallet] : []);
      if (pathname.endsWith("/billpay_applicant_checks")) return matchingUser([{ identity_status: "verified" }]);
      if (pathname.endsWith("/billpay_invoice_checks")) return matchingUser([{ id: "fixture-case", status: "pending" }]);
      if (pathname.endsWith("/billpay_founder_account")) return matchingUser([{ user_id: user }]);
      throw Error(`Unexpected fixture request: ${pathname}`);
    };

    await import("./index.ts?closed");
    const closed = await invoke("profile");
    assert.equal(closed.status, 503);
    assert.equal(closed.headers.get("Access-Control-Allow-Origin"), null);

    Deno.env.set("BILLPAY_ORIGIN", origin);
    await import("./index.ts?configured");
    assert.equal((await invoke("profile", {}, "invalid")).status, 401);
    assert.equal((await invoke("profile", {}, aal1, "https://other.example")).status, 403);
    assert.equal((await invoke("profile")).body.requiresMfa, true);
    assert.equal((await invoke("workspace", { role: "applicant" })).status, 403);
    assert.equal((await invoke("workspace", { role: "founder" })).status, 403);
    assert.equal((await invoke("workspace", { role: "founder" }, aal2)).status, 200);
    const issued = await invoke("wallet_challenge", { address });
    assert.equal(issued.status, 200);
    assert.match(issued.body.message, /Chain ID: 8453/);
    const verify = (signature) => invoke("wallet_verify", { nonce: issued.body.nonce, address, signature });
    assert.equal((await verify(await other.signMessage({ message: issued.body.message }))).status, 403);
    const signature = await owner.signMessage({ message: issued.body.message });
    assert.equal((await verify(signature)).status, 200);
    assert.equal((await verify(signature)).status, 403);
    const profile = (await invoke("profile")).body;
    assert.equal(profile.wallet.toLowerCase(), address);
    assert.equal(profile.chain.bill, "unconfigured");
    assert.deepEqual(profile.access, { applicant: false, gold: false, council: false, founder: false });
  } finally {
    Deno.serve = restoreServe;
    globalThis.fetch = restoreFetch;
    for (const [i, key] of keys.entries()) {
      if (previous[i] === undefined) Deno.env.delete(key);
      else Deno.env.set(key, previous[i]);
    }
  }
});
