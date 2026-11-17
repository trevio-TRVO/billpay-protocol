import test from "node:test";
import assert from "node:assert/strict";
import { getAccess, makeChallenge, safeAal } from "../../supabase/functions/billpay-account/policy.mjs";

const nothing = { identity: "not_started", invoice: "not_started", gold: "not_linked", council: "not_linked", founder: false, elevated: false };

test("each grant requires its own proof independently", () => {
  for (const patch of [{}, { identity: "verified" }, { invoice: "verified" }, { identity: "verified", invoice: "pending" },
    { council: "eligible" }, { founder: true }, { elevated: true }, { gold: "unavailable" }, { council: "unavailable", elevated: true }]) {
    assert.deepEqual(getAccess({ ...nothing, ...patch }), { applicant: false, gold: false, council: false, founder: false });
  }
  for (const [role, proof] of Object.entries({
    applicant: { identity: "verified", invoice: "verified" },
    gold: { gold: "eligible" },
    council: { council: "eligible", elevated: true },
    founder: { founder: true, elevated: true },
  })) {
    const access = getAccess({ ...nothing, ...proof });
    assert.deepEqual(Object.keys(access).filter((key) => access[key]), [role]);
  }
});

test("elevation is denied when the already-validated token has no AAL2 claim", () => {
  const token = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
  for (const value of ["", "broken", token({}), token({ aal: "aal1" }), token({ aal: 2 })]) assert.equal(safeAal(value), false);
  assert.equal(safeAal(token({ aal: "aal2" })), true);
});

test("wallet signature request embeds the exact address, Base, origin, nonce and expiration", () => {
  const nonce = "ab".repeat(16);
  const address = "0x" + "12".repeat(20);
  const challenge = makeChallenge({ origin: "https://billpaytoken.com", address, nonce, now: new Date("2026-11-17T21:00:00Z") });
  assert.equal(challenge.expiresAt, "2026-11-17T21:05:00.000Z");
  assert.ok(challenge.message.startsWith(`billpaytoken.com wants you to sign in with your Ethereum account:\n${address}\n`));
  for (const line of ["Chain ID: 8453", "URI: https://billpaytoken.com/compte/", `Nonce: ${nonce}`, `Expiration Time: ${challenge.expiresAt}`]) {
    assert.ok(challenge.message.includes(line));
  }
});
