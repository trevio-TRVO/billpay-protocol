import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const out = new URL("../out/", import.meta.url);
const favicon = new URL("../../site/assets/favicon.svg", import.meta.url);
copyFileSync(favicon, new URL("favicon.svg", out));

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

const aliases = [
  ["site/index.html", "../", siteFragments],
  ["hub/index.html", "../"],
  ["site/wallets.html", "../wallet/"],
  ["wallets.html", "./wallet/"],
];

for (const [file, fallback, fragments = {}] of aliases) {
  mkdirSync(new URL(`${dirname(file)}/`, out), { recursive: true });
  const script = `const routes = ${JSON.stringify(fragments)};\nlocation.replace(Object.hasOwn(routes, location.hash) ? routes[location.hash] : ${JSON.stringify(fallback)});`;
  const html = `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>BillPay Hub</title>
<script>${script}</script>
<noscript><meta http-equiv="refresh" content="0;url=${fallback}"></noscript>
<h1>BillPay Hub a changé d’adresse</h1>
<p><a href="${fallback}">Continuer vers le Hub</a></p>
</html>`;
  writeFileSync(new URL(file, out), html);
}
