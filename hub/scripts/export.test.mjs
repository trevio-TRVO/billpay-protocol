import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { aliases, redirectScript, redirectTarget } from "./legacy-routes.mjs";

const out = new URL("../out/", import.meta.url);
const read = (path) => readFileSync(new URL(path, out), "utf8");
const pages = [
  ["", "Aider les familles"], ["demande/", "Espace demandeurs"], ["tribunal/", "Tribunal solidaire"],
  ["transparence/", "Transparence"], ["token/", "Jeton BILL"], ["lots/", "Lots communautaires"],
  ["wallet/", "Mon wallet"], ["validateurs/", "Espace validateurs"], ["conseil/", "Conseil"],
  ["antibot/", "Contrôle des dossiers"], ["compte/", "Mon compte"],
];

test("export GitHub Pages: fichiers de publication et routes publiques", () => {
  assert.equal(read("CNAME").trim(), "billpaytoken.com");
  for (const path of [".nojekyll", "favicon.svg", "404.html"]) assert.ok(existsSync(new URL(path, out)), path);
  for (const [path, title] of pages) {
    const html = read(`${path}index.html`);
    assert.match(html, new RegExp(`<h1[^>]*>${title}`));
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/_next\/[^"?]+)/g)) {
      assert.ok(existsSync(new URL(asset.slice(1), out)), asset);
    }
    assert.doesNotMatch(html, /type="file"|billpay-hub-db-v1|Cours BILL\/USDC — démonstration/);
  }
  const home = read("index.html");
  assert.match(home, /Aucune lecture du contrat du fonds/);
  assert.match(home, /href="\/demande\/"/);
  assert.match(home, /href="\/compte\/"/);
});

test("anciennes URL: fragments connus, fragment inconnu et redirection de secours", () => {
  for (const [path, hash, expected] of [
    ["site/index.html", "#apply", "../demande/"],
    ["site/index.html", "#votes", "../tribunal/"],
    ["site/index.html", "#governance", "../conseil/"],
    ["site/index.html", "#risks", "../token/"],
    ["site/index.html", "#inconnu", "../"],
    ["site/index.html", "constructor", "../"],
    ["site/index.html", "", "../"],
    ["hub/index.html", "", "../"],
    ["site/wallets.html", "", "../wallet/"],
    ["wallets.html", "", "./wallet/"],
  ]) {
    const html = read(path);
    const alias = aliases[path];
    assert.equal(redirectTarget(hash, alias.fallback, alias.fragments ?? {}), expected, `${path}${hash}`);
    assert.ok(html.includes(`<script>${redirectScript(alias)}</script>`), path);
    assert.ok(html.includes(`<noscript><meta http-equiv="refresh" content="0;url=${alias.fallback}">`), path);
  }
});
