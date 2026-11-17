// Espace Demandeurs (issue #6) : formulaire de demande d'aide.
// Aucune dépendance, aucune clé. La facture ne quitte JAMAIS le navigateur :
// seule l'empreinte (keccak256) du dossier est publiée, conformément à
// docs/SOLIDARITY_DASHBOARD.md — « jamais de documents ni d'identités sur la chaîne ».
import { CONFIG } from "./config.js";
import { t } from "./i18n.js";
import { state } from "./wallet.js";

// ---------- keccak-256 (implémentation autonome, testée) ----------
const RC = [0x0000000000000001n,0x0000000000008082n,0x800000000000808an,0x8000000080008000n,0x000000000000808bn,0x0000000080000001n,0x8000000080008081n,0x8000000000008009n,0x000000000000008an,0x0000000000000088n,0x0000000080008009n,0x000000008000000an,0x000000008000808bn,0x800000000000008bn,0x8000000000008089n,0x8000000000008003n,0x8000000000008002n,0x8000000000000080n,0x000000000000800an,0x800000008000000an,0x8000000080008081n,0x8000000000008080n,0x0000000080000001n,0x8000000080008008n];
const RHO = [1,3,6,10,15,21,28,36,45,55,2,14,27,41,56,8,25,43,62,18,39,61,20,44];
const PI = [10,7,11,17,18,3,5,16,8,21,24,4,15,23,19,13,12,2,20,14,22,9,6,1];
const rotl = (x, n) => ((x << BigInt(n)) | (x >> (64n - BigInt(n)))) & 0xffffffffffffffffn;

function keccakF(st) {
  const bc = new Array(5).fill(0n);
  let tmp = 0n;
  for (let round = 0; round < 24; round++) {
    for (let i = 0; i < 5; i++) bc[i] = st[i] ^ st[i+5] ^ st[i+10] ^ st[i+15] ^ st[i+20];
    for (let i = 0; i < 5; i++) {
      tmp = bc[(i+4)%5] ^ rotl(bc[(i+1)%5], 1);
      for (let j = 0; j < 25; j += 5) st[j+i] ^= tmp;
    }
    tmp = st[1];
    for (let i = 0; i < 24; i++) { const j = PI[i]; const t2 = st[j]; st[j] = rotl(tmp, RHO[i]); tmp = t2; }
    for (let j = 0; j < 25; j += 5) {
      for (let i = 0; i < 5; i++) bc[i] = st[j+i];
      for (let i = 0; i < 5; i++) st[j+i] = bc[i] ^ (~bc[(i+1)%5] & bc[(i+2)%5]);
    }
    st[0] ^= RC[round];
  }
}

export function keccak256(bytes) {
  const st = new Array(25).fill(0n);
  const rate = 136; // 1088 bits
  const padded = new Uint8Array(Math.ceil((bytes.length + 1) / rate) * rate);
  padded.set(bytes);
  padded[bytes.length] ^= 0x01;   // padding Keccak (SHA3 utilise 0x06)
  padded[padded.length - 1] ^= 0x80;
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let w = 0n;
      for (let j = 7; j >= 0; j--) w = (w << 8n) | BigInt(padded[off + i*8 + j]);
      st[i] ^= w;
    }
    keccakF(st);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    let w = st[i];
    for (let j = 0; j < 8; j++) { out[i*8+j] = Number(w & 0xffn); w >>= 8n; }
  }
  return out;
}

const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const pad32 = (v) => v.toString(16).padStart(64, "0");

// ---------- ABI : createRequest(address,uint256,bytes32) ----------
const SEL = hex(keccak256(new TextEncoder().encode("createRequest(address,uint256,bytes32)"))).slice(0, 8);

function encodeCreateRequest(payee, amount, invoiceHash) {
  return "0x" + SEL
    + pad32(BigInt(payee))
    + pad32(BigInt(amount))
    + invoiceHash.slice(2); // 0x + 64 hex
}

// ---------- contrôle local (issue #11 : signale, ne paie jamais) ----------
// Frein côté navigateur, annoncé comme tel. Le contrôle IA complet se fait via le
// relais (publication soumise à approbation) ; l'IA ne détient aucune clé de paiement.
function localFlags(d) {
  const f = [];
  if (d.description.length < 40) f.push("ai_short");
  const caps = (d.description.match(/[A-ZÀ-Ý]/g) || []).length;
  if (caps > d.description.length * 0.5) f.push("ai_caps");
  if (/(https?:\/\/|\bwww\.)/i.test(d.description)) f.push("ai_link");
  if (/(.)\1{6,}/.test(d.description)) f.push("ai_repeat");
  return f;
}

// ---------- formulaire ----------
let fileBytes = null;

function el(id) { return document.getElementById(id); }

function renderStatus() {
  const box = el("apply-wallet");
  if (!box) return;
  box.textContent = state.account
    ? t("apply_wallet_ok", { a: state.account.slice(0, 6) + "…" + state.account.slice(-4) })
    : t("apply_wallet_none");
}

async function onFile(input) {
  fileBytes = null;
  const file = input.files && input.files[0];
  const view = el("apply-file-info");
  if (!file) { view.textContent = t("apply_file_none"); return; }
  if (file.size > 5 * 1024 * 1024) { input.value = ""; view.textContent = t("apply_file_big"); return; }
  // Le document brut reste dans le navigateur : on n'affiche que nom et taille.
  view.textContent = t("apply_file_ok", { n: file.name, kb: Math.round(file.size / 1024) });
  fileBytes = new Uint8Array(await file.arrayBuffer());
}

function dossierHash() {
  const d = readForm();
  const enc = new TextEncoder();
  const parts = [
    fileBytes || new Uint8Array(0),
    enc.encode(d.amount),
    enc.encode(d.provider),
    enc.encode(d.urgency),
    enc.encode(d.description)
  ];
  const len = parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(len);
  let off = 0;
  for (const p of parts) { buf.set(p, off); off += p.length; }
  return "0x" + hex(keccak256(buf));
}

function readForm() {
  return {
    amount: el("apply-amount").value.trim(),
    provider: el("apply-provider").value.trim(),
    urgency: el("apply-urgency").value,
    description: el("apply-desc").value
  };
}

function renderPreview() {
  const d = readForm();
  const flags = localFlags(d);
  const out = el("apply-preview");
  const h = (fileBytes || d.amount || d.provider || d.description) ? dossierHash() : "";
  out.textContent = "";
  if (h) {
    const p = document.createElement("p");
    p.className = "mono";
    p.textContent = t("apply_hash") + " " + h;
    out.appendChild(p);
  }
  const ul = document.createElement("ul");
  ul.className = "rules";
  ul.innerHTML = ""; // sécurité : textContent partout
  const lines = [
    t("apply_sum_amount", { n: d.amount || "—" }),
    t("apply_sum_payee", { a: state.account ? state.account : "—" })
  ];
  flags.forEach((f) => lines.push(t("ai_" + f.slice(3))));
  lines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  });
  out.appendChild(ul);
  const warn = el("apply-warn");
  warn.hidden = flags.length === 0;
}

async function submit() {
  const msg = el("apply-msg");
  msg.textContent = "";
  if (!state.account) { msg.textContent = t("apply_need_wallet"); return; }
  if (!CONFIG.SOLIDARITY_ADDRESS) { msg.textContent = t("apply_not_deployed"); return; }
  const d = readForm();
  if (!fileBytes || !d.amount || !d.description) { msg.textContent = t("apply_incomplete"); return; }
  const amount = d.amount.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(amount)) { msg.textContent = t("apply_bad_amount"); return; }
  const amountWei = BigInt(Math.round(parseFloat(amount) * 1e6)) * 10n**12n; // 18 décimales
  const data = encodeCreateRequest(state.account, amountWei, dossierHash());
  try {
    const tx = await state.provider.request({
      method: "eth_sendTransaction",
      params: [{ from: state.account, to: CONFIG.SOLIDARITY_ADDRESS, data }]
    });
    msg.textContent = t("apply_sent", { tx });
  } catch (e) {
    msg.textContent = t("apply_tx_fail");
  }
}

export function initApply() {
  const form = el("apply-form");
  if (!form) return;
  document.addEventListener("bp:wallet", () => { renderStatus(); renderPreview(); });
  document.addEventListener("bp:lang", () => { renderStatus(); renderPreview(); });
  renderStatus();
  // Collage bloqué dans la description (saisie manuelle uniquement) — frein, pas garantie.
  el("apply-desc").addEventListener("paste", (e) => {
    e.preventDefault();
    el("apply-msg").textContent = t("apply_no_paste");
  });
  el("apply-file").addEventListener("change", (e) => onFile(e.target));
  ["apply-amount", "apply-provider", "apply-urgency", "apply-desc"].forEach((id) => {
    el(id).addEventListener("input", renderPreview);
    el(id).addEventListener("change", renderPreview);
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
}
