import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { aliases, redirectScript } from "./legacy-routes.mjs";

const out = new URL("../out/", import.meta.url);
const favicon = new URL("../../site/assets/favicon.svg", import.meta.url);
copyFileSync(favicon, new URL("favicon.svg", out));

for (const [file, alias] of Object.entries(aliases)) {
  mkdirSync(new URL(`${dirname(file)}/`, out), { recursive: true });
  const { fallback } = alias;
  const html = `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>BillPay Hub</title>
<script>${redirectScript(alias)}</script>
<noscript><meta http-equiv="refresh" content="0;url=${fallback}"></noscript>
<h1>BillPay Hub a changé d’adresse</h1>
<p><a href="${fallback}">Continuer vers le Hub</a></p>
</html>`;
  writeFileSync(new URL(file, out), html);
}
