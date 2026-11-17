import { mkdir, writeFile } from "node:fs/promises";
import { copy, languages } from "./copy.mjs";

const site = new URL("../site/", import.meta.url);
const domain = "https://billpaytoken.com/";
export const pages = {home:"",request:"demande/",court:"tribunal/",proof:"transparence/",token:"token/",lots:"lots/",wallet:"wallet/",validators:"validateurs/",council:"conseil/",bot:"antibot/"};
const localeNames = {fr:"Français",en:"English",ru:"Русский",es:"Español",ar:"العربية"};
const contracts=["BillPayProtocol","CommunityLots","SolidarityWallet","CouncilRegistry","AutoLiquidity","MonthlyVesting"];
const locationOf=(lang,page)=>`${lang==="fr"?"":`lang/${lang}/`}${pages[page]??""}`;
const esc=(s)=>String(s).replace(/[&<>"']/g,(x)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[x]);
const paths = Object.keys(pages);
const intros={home:"intro",request:"requestIntro",court:"courtIntro",proof:"proofIntro",token:"tokenIntro",lots:"lotsIntro",wallet:"walletIntro",validators:"validatorsIntro",council:"councilIntro",bot:"botIntro",missing:"jsRequired"};
const save=async (path,value)=>{const url=new URL(path,site);await mkdir(new URL("./",url),{recursive:true});await writeFile(url,value);};
for(const row of Object.values(copy)) if(row.length!==languages.length || row.some((v)=>typeof v!=="string"||!v.trim())) throw Error("Invalid translation row");

function render(page,lang) {
  const i=languages.indexOf(lang), t=(key)=>esc(copy[key][i]);
  const dir=lang==="ar"?"rtl":"ltr", path=locationOf(lang,page), depth=path.split("/").length-1;
  const root=page==="missing"?"/":"../".repeat(depth)||"./";
  const u=(key)=>root+locationOf(lang,key);
  const title=`${t(page)} · ${t("brand")}`, description=t(intros[page]);
  const word=(key,tag="span",attrs="")=>`<${tag} data-i18n="${key}" ${attrs}>${t(key)}</${tag}>`;
  const link=(key,dest=key,attrs="")=>`<a href="${u(dest)}" data-route="${dest}" data-i18n="${key}" ${attrs}>${t(key)}</a>`;
  const button=(key,id,attrs="")=>word(key,"button",`type="button" id="${id}" ${attrs}`);
  const details=(key,body)=>`<section class="surface reveal">${word(key,"h2")}${body}</section>`;
  const stats=(...keys)=>`<div class="stats">${keys.map(key=>`<article class="surface metric reveal" data-tilt>${word(key,"h3")}<output data-value="${key}" data-i18n="na">${t("na")}</output></article>`).join("")}</div>`;
  const percent=(key,p)=>`<li><i data-color="${key}" aria-hidden="true"></i>${word(key)}<b>${new Intl.NumberFormat(lang,{style:"percent"}).format(p/100)}</b></li>`;
  const chart=(key,pairs,animate=false)=>details(key,`<div class="distribution">${animate?`<div class="chart-art" data-three="chart" aria-hidden="true"><div class="ring"></div><span>${new Intl.NumberFormat(lang,{style:"percent"}).format(.1)}</span></div>`:""}<ul class="legend">${pairs.map(([k,p])=>percent(k,p)).join("")}</ul></div>`);
  const cases=()=>details("cases",`${word("rules","p")}<p id="case-cap" hidden></p><ol id="cases" class="records"></ol><div class="actions" id="case-nav" hidden>${button("previous","prev")}${button("next","next")}</div>`);
  const wallet=()=>details("connect",`<div class="actions"><label for="providers">${word("selectWallet")}<select id="providers" disabled></select></label>${button("connect","connect","disabled")}<button id="walletconnect" type="button" disabled>WalletConnect</button>${button("switch","switch","hidden")}${button("disconnect","disconnect","hidden")}</div><p role="status" id="wallet-state"></p><p id="wc-state">${t("wcOff")}</p><output id="wallet-address" dir="ltr"></output>`);
  const form=(photo)=>`<form id="${photo?"draft-form":"bot-form"}" autocomplete="off"><label for="description">${word("description")}</label><textarea id="description" minlength="12" maxlength="1200" required ${photo?'aria-describedby="paste"':""}></textarea>${photo?`${word("paste","p",'id="paste" class="muted"')}${word("keepLocal","p",'id="local-note"') }<label for="invoice">${word("image")}</label><input id="invoice" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="local-note" required><canvas id="invoice-preview" width="1" height="1" role="img" aria-label="${t("image")}" hidden></canvas>`:""}<div class="actions"><button type="submit" class="primary" data-i18n="check">${t("check")}</button><button type="reset" data-i18n="clear">${t("clear")}</button></div><output id="form-result" role="status"></output></form>`;
  const bodies={
    home:`<section class="hero"><div class="orbit-art" data-three="hero" aria-hidden="true"></div><div class="hero-copy"><p class="eyebrow"><i></i>${word("mission")}</p>${word("headline","h1")}${word("intro","p",'class="lead"')}<div class="actions">${link("prepare","request",'class="button primary"')}${link("readRules","proof",'class="button secondary"')}</div></div><span class="hero-code" aria-hidden="true">BASE // 8453</span></section><div class="section-head">${word("impact","h2")}${word("settlement","p")}</div>${stats("fund","paid","count")}${chart("flow",[["aid",5],["burn",2],["ops",2],["liquidity",1]],true)}${word("flowBody","p",'class="annotation"')}${cases()}`,
    request:`${details("prepare",form(true))}${cases()}`,
    court:`${details("court",word("voteOff","p"))}${cases()}`,
    proof:`${details("contracts",`<ul class="records" id="contracts">${contracts.map(k=>`<li><code>${k}</code> ${word("na","span",`data-contract="${k}"`)}</li>`).join("")}</ul>${button("csv","csv","disabled")}`)}${details("audit",word("hazards","p"))}`,
    token:`${stats("supply","reserve")}${chart("allocation",[["liquidity",50],["founder",20],["community",15],["growth",15]])}${details("token",word("vestingToken","p"))}`,
    lots:`${stats("pioneer","series","stock","oracle")}${wallet()}${details("unlock",`${word("unlockBody","p")}${word("txOff","p",'id="tx-off"')}<div class="actions"><button type="button" id="open-series" hidden>openSeries()</button>${button("approval","approveP","hidden")}${button("approval","approveS","hidden")}${button("buyP","buyP","hidden")}${button("buyS","buyS","hidden")}</div><ol id="grants" class="records"></ol><p role="status" id="tx-result"></p>`)}`,
    wallet:`${wallet()}${stats("walletBalance")}`,
    validators:`${wallet()}${details("validators",`<p id="eligibility">${t("na")}</p>`)}`,
    council:`${stats("rotation")}${details("seats",`<ol class="records" id="seats"></ol>`)}`,
    bot:details("bot",form(false)),
    missing:`<div class="actions">${link("back","home",'class="button primary"')}</div>`
  };
  const image=lang==="en"?"og-banner-en.png":lang==="ru"?"og-banner-ru.png":"og-banner.png";
  const csp="default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data: blob: https://*.walletconnect.com https://*.reown.com; connect-src 'self' https://cdn.jsdelivr.net https://mainnet.base.org https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.reown.com wss://*.reown.com; frame-src https://verify.walletconnect.com https://verify.walletconnect.org";
  return `<!doctype html>
<html lang="${lang}" dir="${dir}" data-page="${page}" data-root="${root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#05070d">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title data-i18n="${page}">${title}</title>
<meta name="description" content="${description}" data-i18n="${intros[page]}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${domain}assets/${image}">
<meta property="og:type" content="website">
<meta property="og:url" content="${domain}${path}">
<meta property="og:locale" content="${{fr:"fr_FR",en:"en_US",ru:"ru_RU",es:"es_ES",ar:"ar_SA"}[lang]}">
${page==="missing"?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${domain}${path}">\n${languages.map(l=>`<link rel="alternate" hreflang="${l}" href="${domain}${locationOf(l,page)}">`).join("\n")}\n<link rel="alternate" hreflang="x-default" href="${domain}${pages[page]}">`}
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png">
<link rel="stylesheet" href="${root}assets/v2.css">
<noscript><style>#nav:not(.open){display:grid}#menu{display:none}</style></noscript>
<script type="module" src="${root}js/app.js"></script>
</head>
<body>
<a class="skip" href="#main" data-i18n="skip">${t("skip")}</a>
<header class="mast"><div class="wrap top">
  <a class="brand" href="${u("home")}" data-route="home"><img src="${root}assets/favicon.svg" width="32" height="32" alt="">${word("brand")}</a>
  <div class="head-tools"><span class="network"><i></i>${word("base")}</span>
  <label class="lang"><span class="sr" data-i18n="language">${t("language")}</span><select id="language">
  ${languages.map(l=>`<option lang="${l}" value="${l}"${l===lang?" selected":""}>${localeNames[l]}</option>`).join("")}</select></label>
  ${button("menu","menu",'aria-expanded="false" aria-controls="nav"')}</div></div>
  <nav id="nav" class="wrap nav" aria-label="${t("menu")}">${paths.map(k=>link(k,k,k===page?'aria-current="page"':"")).join("")}</nav>
</header>
<div class="notice">${word("risk")}</div>
<main class="wrap" id="main">
${page==="home"?"":`<section class="inner-head"><p class="eyebrow"><i></i>${word("mission")}</p>${word(page,"h1")}${word(intros[page],"p",'class="lead"')}</section>`}
${bodies[page]}
${page==="home"?"":`<p class="back">${link("back","home")}</p>`}
<section class="status" aria-label="${t("last")}"><p><span class="status-dot" aria-hidden="true"></span><strong id="read-state" role="status">${t("na")}</strong><span class="read-time">${word("last")}: <time id="read-time">${t("na")}</time></span></p>${button("refresh","refresh")}</section>
<noscript>${word("jsRequired","p")}</noscript>
</main>
<footer><div class="wrap foot"><div>${word("brand","strong")}${word("privacy","p")}</div><a href="https://github.com/trevio-TRVO/billpay-protocol" rel="noopener" data-i18n="source">${t("source")}</a></div></footer>
</body></html>
`;
}

for (const [i,l] of languages.entries()) {
  await save(`i18n/${l}.json`,JSON.stringify(Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[i]])),null,2)+"\n");
  for(const p of paths) await save(`${locationOf(l,p)}index.html`,render(p,l));
}
await save("404.html",render("missing","fr"));
const legacy=(target)=>`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${domain}wallet/"><title data-i18n="wallet">${esc(copy.wallet[0])}</title></head><body><a href="${target}" data-i18n="wallet">${esc(copy.wallet[0])}</a></body></html>\n`;
await save("wallets.html",legacy("./wallet/"));
await save("site/wallets.html",legacy("../wallet/"));
await save("site/index.html",`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><script type="module" src="../js/legacy.js"></script><noscript><meta http-equiv="refresh" content="0;url=../"></noscript><title data-i18n="home">${esc(copy.home[0])}</title></head><body><a href="../" data-i18n="home">${esc(copy.home[0])}</a></body></html>\n`);
await save("hub/index.html",`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=../"><title data-i18n="home">${esc(copy.home[0])}</title></head><body><a href="../" data-i18n="home">${esc(copy.home[0])}</a></body></html>\n`);
await save("sitemap.xml",`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${paths.flatMap(p=>languages.map(l=>`  <url><loc>${domain}${locationOf(l,p)}</loc>${languages.map(a=>`<xhtml:link rel="alternate" hreflang="${a}" href="${domain}${locationOf(a,p)}"/>`).join("")}<xhtml:link rel="alternate" hreflang="x-default" href="${domain}${pages[p]}"/></url>`)).join("\n")}\n</urlset>\n`);
await save("robots.txt",`User-agent: *\nAllow: /\nSitemap: ${domain}sitemap.xml\n`);
