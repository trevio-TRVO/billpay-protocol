const siteFragments = {
  "#dashboard": "../",
  "#apply": "../demande/",
  "#votes": "../tribunal/",
  "#governance": "../conseil/",
  "#rules": "../token/",
  "#risks": "../token/",
  "#contract": "../transparence/",
  "#partners": "../transparence/",
};

export const aliases = {
  "site/index.html": { fallback: "../", fragments: siteFragments },
  "hub/index.html": { fallback: "../" },
  "site/wallets.html": { fallback: "../wallet/" },
  "wallets.html": { fallback: "./wallet/" },
};

export function redirectTarget(hash, fallback, fragments) {
  return Object.hasOwn(fragments, hash) ? fragments[hash] : fallback;
}

export function redirectScript({ fallback, fragments = {} }) {
  return `location.replace((${redirectTarget.toString()})(location.hash, ${JSON.stringify(fallback)}, ${JSON.stringify(fragments)}));`;
}
