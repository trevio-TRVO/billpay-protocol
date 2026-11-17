export function getAccess({ identity, invoice, gold, council, founder, elevated }) {
  return {
    applicant: identity === "verified" && invoice === "verified",
    gold: gold === "eligible",
    council: council === "eligible" && elevated === true,
    founder: founder === true && elevated === true,
  };
}

export function safeAal(token) {
  // Only call after the exact token has been verified by Supabase Auth.
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part)).aal === "aal2";
  } catch {
    return false;
  }
}

export function makeChallenge({ origin, address, nonce, now }) {
  const expires = new Date(now.getTime() + 5 * 60_000);
  // EIP-4361 sign-in message; no transaction, permit, or token approval.
  const message = `${new URL(origin).host} wants you to sign in with your Ethereum account:\n${address}\n\nLink this wallet to your BillPay account. No transaction or token approval.\n\nURI: ${origin}/compte/\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${now.toISOString()}\nExpiration Time: ${expires.toISOString()}`;
  return { message, issuedAt: now.toISOString(), expiresAt: expires.toISOString() };
}
