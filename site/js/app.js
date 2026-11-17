import { amount, BASE, DAY, EXPLORER, readConfig, Reader } from "./chain.js";
import { walletController } from "./wallet.js";

const root=document.documentElement;
const {page,root:prefix}=root.dataset, lang=root.lang;
const isPreview=location.hostname==="sites.pplx.app"||location.pathname.startsWith("/sites/proxy/");
const routes={home:"",request:"demande/",court:"tribunal/",proof:"transparence/",token:"token/",lots:"lots/",wallet:"wallet/",validators:"validateurs/",council:"conseil/",bot:"antibot/"};
const langs=["fr","en","ru","es","ar"];
const site=new URL(prefix,location.href);
const pageUrl=(l,p)=>{
  const url=new URL(`${l==="fr"?"":`lang/${l}/`}${routes[p]??""}${isPreview?"index.html":""}`,site);
  if(l==="fr"&&new URL(location.href).searchParams.has("locale"))url.searchParams.set("locale","fr");
  return url;
};
const q=id=>document.getElementById(id);
const $$=(selector)=>[...document.querySelectorAll(selector)];
const getPreference=()=>{try{return localStorage.getItem("billpay-language");}catch{return null;}};
const setPreference=(language)=>{try{localStorage.setItem("billpay-language",language);}catch{/* Private and embedded browsing. */}};
const wanted=new URL(location.href).searchParams.get("lang");
const languageOf=(x)=>typeof x==="string"?x.toLowerCase().split("-")[0]:"";
const navigatorChoice=(navigator.languages??[navigator.language]).map(languageOf).find(l=>langs.includes(l));
const preferred=langs.includes(wanted)?wanted:(getPreference()??navigatorChoice);
if(langs.includes(wanted)) setPreference(wanted);
if(page!=="missing" && (langs.includes(wanted)||(lang==="fr"&&!new URL(location.href).searchParams.has("locale"))) &&
   langs.includes(preferred)&&preferred!==lang) {
  location.replace(pageUrl(preferred,page));
}
if((isPreview||new URL(location.href).searchParams.has("locale")) && page!=="missing") for(const a of $$("[data-route]")) a.href=pageUrl(lang,a.dataset.route);
root.classList.add("ready");
q("language")?.addEventListener("change",({target})=>{
  if(!langs.includes(target.value)) return;
  setPreference(target.value);
  const url=pageUrl(target.value,page);
  if(target.value==="fr") url.searchParams.set("locale","fr");
  location.assign(url);
});
q("menu")?.addEventListener("click",()=>{
  const expanded=q("nav").classList.toggle("open");
  q("menu").setAttribute("aria-expanded",String(expanded));
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&q("nav")?.classList.contains("open")){q("nav").classList.remove("open");q("menu").setAttribute("aria-expanded","false");q("menu").focus();}});

const copyPromise=fetch(new URL(`i18n/${lang}.json`,site),{credentials:"omit"}).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({}));
const configPromise=readConfig(new URL("config.json",site)).catch(()=>null);
const fallback=Object.fromEntries($$("[data-i18n]").map(e=>[e.dataset.i18n,e.textContent]));
const copy=await copyPromise;
const t=(key)=>copy[key]??fallback[key]??fallback.na??"";
const cfg=await configPromise;
const fmt=new Intl.NumberFormat(lang);
const date=new Intl.DateTimeFormat(lang,{dateStyle:"medium",timeStyle:"short"});
const bill=(value)=>`${amount(value,lang)} BILL`;
const motion=matchMedia("(prefers-reduced-motion: reduce)");
const node=(tag,content)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;return e;};
const nowText=(seconds)=>date.format(new Date(seconds*1000));
function status(key,ts){
  q("read-state").textContent=t(key);
  q("read-state").closest(".status").dataset.state=key;
  if(ts!==undefined){q("read-time").textContent=date.format(ts);q("read-time").dateTime=ts.toISOString();}
}
function value(key,v){
  const e=document.querySelector(`[data-value="${key}"]`);
  if(e) e.textContent=v??t("na");
}
function recordList(id,entries){
  if(q(id))q(id).replaceChildren(...entries);
}
const routeNeeds={
  home:["SolidarityWallet","BillPayProtocol"], request:["SolidarityWallet","BillPayProtocol"],court:["SolidarityWallet","BillPayProtocol"],
  proof:[],token:["BillPayProtocol","AutoLiquidity"],lots:["CommunityLots","BillPayProtocol"],
  wallet:["BillPayProtocol"],council:["CouncilRegistry"],validators:["SolidarityWallet","BillPayProtocol","CommunityLots"]
};
let wallet=null,offset=0,seq=0,txBusy=false,exported=[];
const lotControls=["buyP","buyS","approveP","approveS","open-series"];
function cases(data){
  q("case-cap").hidden=false;
  q("case-cap").textContent=`${t("cap")} : ${bill(data.balance/5n)}`;
  const rows=data.entries.map(r=>{
    const item=node("li"),state=t(({1:"open",2:"executed",3:"cancelled"})[r.state]??"na");
    item.append(node("strong",`#${fmt.format(r.id)} · ${state} · ${bill(r.amount)}`));
    const details=[`${t("validators")} : ${fmt.format(r.validators)}`];
    if(r.weight!==undefined) details.push(`${t("council")} : ${fmt.format(r.weight)}/5`);
    if(r.when&&r.state===1) details.push(`${t("eligibleAt")} : ${nowText(r.when+DAY)}`);
    if(r.cooldown) details.push(`${t("cooldownUntil")} : ${nowText(r.cooldown)}`);
    item.append(node("span",details.join(" · ")));
    return item;
  });
  recordList("cases",rows.length?rows:[node("li",t("empty"))]);
  q("case-nav").hidden=data.count<=8n;
  q("prev").disabled=offset===0;
  q("next").disabled=BigInt(offset+8)>=data.count;
}
function renderLots(data){
  value("pioneer",`${fmt.format(data.pioneer)} / ${fmt.format(100)}`);
  value("series",`${fmt.format(data.series)} / ${fmt.format(14)}`);
  value("stock",fmt.format(data.stock));
  value("oracle",data.oracle!==null?bill(data.oracle):null);
  const transactional=cfg.transactionsEnabled&&Boolean(wallet?.chain===BASE);
  q("tx-off").hidden=cfg.transactionsEnabled;
  const allowanceKnown=typeof data.allowance==="bigint";
  const canP=transactional&&allowanceKnown&&data.hasBought===false&&data.pioneer<100n;
  const canS=transactional&&allowanceKnown&&data.hasBought===false&&data.stock>0n&&data.oracle!==null;
  q("buyP").hidden=!(canP&&data.allowance>=10_000_000n);
  q("buyS").hidden=!(canS&&data.allowance>=50_000_000n);
  q("approveP").hidden=!(canP&&data.allowance<10_000_000n);
  q("approveS").hidden=!(canS&&data.allowance<50_000_000n);
  q("approveP").textContent=`${t("approval")} · ${fmt.format(10)} USDC`;
  q("approveS").textContent=`${t("approval")} · ${fmt.format(50)} USDC`;
  q("open-series").hidden=!transactional||data.seriesStart!==0n||data.oracle===null||data.oracle>100_000n*10n**18n;
  recordList("grants",data.grants.map(g=>{
    const item=node("li"), bar=node("progress"), available=g.vested-g.claimed;
    bar.max=1000;
    bar.value=g.total?Number(g.vested*1000n/g.total):0;
    bar.setAttribute("aria-label",t("unlock"));
    item.append(node("strong",`${t("lots")} #${fmt.format(g.id+1)} · ${bill(g.total)}`),bar,node("p",`${t("claimable")} : ${bill(available)}`));
    if(transactional&&available>0n){
      const b=node("button",t("claim")); b.type="button";b.addEventListener("click",()=>trade("claim",g.id));item.append(b);
    }
    return item;
  }));
}
function link(href,label){const e=node("a",label);e.href=href;e.rel="noopener noreferrer";return e;}
function contractLinks(){
  for(const e of $$("[data-contract]")){
    const address=cfg?.contracts[e.dataset.contract];
    if(!address) continue;
    const url=`${EXPLORER}/address/${address}`;
    e.replaceChildren(link(url,address),link(`${url}#transactions`,t("transactions")),link(`${url}#events`,t("events")));
  }
}
const eventNames={BillPayProtocol:["Contribution"],CommunityLots:["Purchased","Claimed","SeriesOpened"],SolidarityWallet:["Paid","Cancelled","Validated","Approved"],CouncilRegistry:["CouncilRotated"],AutoLiquidity:["LiquidityAdded"],MonthlyVesting:["Released"]};
async function read() {
  const id=++seq, session=wallet;
  q("refresh").disabled=true;
  if(q("grants")){
    for(const k of lotControls) q(k).hidden=true;
    recordList("grants",[]);
  }
  status("reading");
  const active=()=>id===seq;
  const complete=(state,ts)=>{if(active()){status(state,ts);q("refresh").disabled=false;}};
  try {
    if(!cfg) return complete("na");
    const needed=routeNeeds[page];
    if(!needed || (page==="proof"?!Object.values(cfg.contracts).some(Boolean):!needed.some(k=>cfg.contracts[k]))) return complete("na");
    if(["wallet","validators"].includes(page)&&session?.chain!==BASE) return complete("na");
    const reader=await Reader.create(cfg);
    const observed=new Date();
    if(!active())return;
    if(["home","request","court"].includes(page)){
      const data=await reader.cases(offset,true);
      if(!active())return;
      cases(data);
      if(page!=="home") return complete("available",observed);
      value("fund",bill(data.balance));
      const totals=await reader.totals(data.count).catch(()=>null);
      if(!active())return;
      value("paid",totals&&bill(totals.total));value("count",totals&&fmt.format(totals.paid));
      return complete(totals?"available":"partial",observed);
    }
    if(page==="token"){
      const [supply,reserve]=await Promise.all([
        reader.call("BillPayProtocol","totalSupply").catch(()=>null),
        (async()=>{
          const token=await reader.call("AutoLiquidity","token");
          if(!cfg.contracts.BillPayProtocol||token.toLowerCase()!==cfg.contracts.BillPayProtocol.toLowerCase()) return null;
          return reader.call("AutoLiquidity","stockLeft");
        })().catch(()=>null)
      ]);
      if(!active())return;
      value("supply",supply!==null?bill(supply):null);value("reserve",reserve!==null?bill(reserve):null);
      return complete(supply!==null&&reserve!==null?"available":supply!==null||reserve!==null?"partial":"na",supply!==null||reserve!==null?observed:undefined);
    }
    if(page==="lots"){
      const data=await reader.lots(session?.chain===BASE?session.address:null);
      if(!active())return;
      renderLots(data);
      return complete(data.oracle===null?"partial":"available",observed);
    }
    if(page==="wallet"){
      const balance=await reader.call("BillPayProtocol","balanceOf",[session.address]);
      if(!active())return;
      value("walletBalance",bill(balance));return complete("available",observed);
    }
    if(page==="validators"){
      const ok=await reader.validator(session.address);
      if(!active())return;
      q("eligibility").textContent=t(ok?"validatorYes":"validatorNo");
      return complete("available",observed);
    }
    if(page==="council"){
      const [seats,last]=await Promise.all([reader.call("CouncilRegistry","currentCouncil"),reader.call("CouncilRegistry","lastRotation")]);
      if(!active())return;
      value("rotation",nowText(Number(last)));
      recordList("seats",seats.map((address,i)=>{
        const item=node("li"), a=link(`${EXPLORER}/address/${address}`,address);
        a.dir="ltr"; item.append(node("span",`${fmt.format(i+1)} · `),a);return item;
      }));
      return complete("available",observed);
    }
    if(page==="proof"){
      const from=Math.max(0,cfg.deploymentBlock??0,reader.block.number-1799);
      const result=await Promise.allSettled(Object.entries(eventNames).filter(([key])=>cfg.contracts[key]).map(async ([key,names])=>(await reader.events(key,names,{from})).map(row=>({key,...row}))));
      if(!active())return;
      q("recent-events")?.remove();
      const rows=result.filter(r=>r.status==="fulfilled").flatMap(r=>r.value).sort((a,b)=>b.block-a.block||b.index-a.index);
      const good=result.filter(r=>r.status==="fulfilled").length;
      exported=rows;
      q("csv").disabled=!rows.length;
      if(rows.length){
        const list=node("ul");list.id="recent-events";list.className="records";
        for(const row of rows.slice(0,20)){
          const item=node("li");item.append(node("span",`${row.key} · ${row.parsed.name} · ${fmt.format(row.block)}`),link(`${EXPLORER}/tx/${row.hash}`,t("transactions")));list.append(item);
        }
        q("csv").before(list);
      }
      return complete(good===result.length?"available":good?"partial":"na",good?observed:undefined);
    }
    complete("na");
  } catch {
    if(!active())return;
    for(const e of $$("[data-value]")) e.textContent=t("na");
    if(q("cases")){recordList("cases",[]);q("case-cap").hidden=true;q("case-nav").hidden=true;}
    if(q("grants")){recordList("grants",[]);for(const k of lotControls) q(k).hidden=true;}
    recordList("seats",[]);q("recent-events")?.remove();exported=[];
    if(q("csv")) q("csv").disabled=true;
    if(q("eligibility"))q("eligibility").textContent=t("na");
    complete("na");
  }
}
async function trade(kind,id){
  if(txBusy||!cfg?.transactionsEnabled||wallet?.chain!==BASE) return;
  const session=wallet;
  txBusy=true;
  const controls=$$("#grants button,#buyP,#buyS,#approveP,#approveS,#open-series");
  for(const control of controls) control.disabled=true;
  const out=q("tx-result");out.textContent="";
  try{
    const reader=await Reader.create(cfg);
    const hash=await reader.send(kind,id,session);
    out.append(node("span",`${t("submitted")} `),link(`${EXPLORER}/tx/${hash}`,t("transactions")));
  }catch{out.textContent=t("txFail");}
  finally{txBusy=false;for(const control of controls) control.disabled=false;void read();}
}
q("buyP")?.addEventListener("click",()=>trade("pioneer"));
q("buyS")?.addEventListener("click",()=>trade("series"));
q("approveP")?.addEventListener("click",()=>trade("approve-pioneer"));
q("approveS")?.addEventListener("click",()=>trade("approve-series"));
q("open-series")?.addEventListener("click",()=>trade("open"));
q("refresh").addEventListener("click",read);
q("prev")?.addEventListener("click",()=>{offset=Math.max(0,offset-8);void read();});
q("next")?.addEventListener("click",()=>{offset+=8;void read();});
q("csv")?.addEventListener("click",()=>{
  if(!exported.length) return;
  const csv=["block,contract,event,transaction",...exported.map(r=>[r.block,r.key,r.parsed.name,r.hash].join(","))].join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=node("a");a.href=url;a.download="billpay-base-events.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
function setupForm(){
  const form=q("draft-form")??q("bot-form");if(!form)return;
  const box=q("description"), input=q("invoice"), preview=q("invoice-preview"), result=q("form-result");
  let version=0;
  const removePreview=()=>{if(preview){preview.hidden=true;preview.width=1;preview.height=1;}};
  const flag=text=>/(.)\1{8,}/u.test(text)||/(https?:\/\/\S+\s*){3,}/iu.test(text);
  if(input)box.addEventListener("paste",event=>{event.preventDefault();result.textContent=t("paste");});
  form.addEventListener("reset",()=>{version++;removePreview();result.textContent="";});
  input?.addEventListener("change",()=>{version++;removePreview();result.textContent="";});
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const seq=++version,text=box.value.trim();
    if(text.length<12){result.textContent=t("description");return;}
    if(input){
      removePreview();
      const file=input.files?.[0];
      if(!file||!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5*1024*1024){result.textContent=t("badFile");return;}
      try{
        const [a,b,c,d,,, , ,i,j,k,l]=new Uint8Array(await file.slice(0,12).arrayBuffer());
        const valid=(a===137&&b===80&&c===78&&d===71&&file.type==="image/png")
          ||(a===255&&b===216&&c===255&&file.type==="image/jpeg")
          ||(a===82&&b===73&&c===70&&d===70&&i===87&&j===69&&k===66&&l===80&&file.type==="image/webp");
        if(!valid)throw Error("Image signature");
        if(seq!==version) return;
        const image=await createImageBitmap(file);
        try{
          if(seq!==version)return;
          const scale=Math.min(1,640/Math.max(image.width,image.height));
          preview.width=Math.max(1,Math.round(image.width*scale));
          preview.height=Math.max(1,Math.round(image.height*scale));
          const ctx=preview.getContext("2d");
          if(!ctx)throw Error("Image preview unavailable");
          ctx.drawImage(image,0,0,preview.width,preview.height);
          preview.hidden=false;
        }finally{image.close();}
      }catch{if(seq===version){removePreview();result.textContent=t("badFile");}return;}
    }
    if(seq===version) result.textContent=[input?t("draft"):"",t(flag(text)?"flag":"noFlag")].filter(Boolean).join(" ");
  });
  addEventListener("pagehide",()=>{form.reset();removePreview();});
}
setupForm();
if(page==="proof")contractLinks();
walletController({config:cfg??{walletConnectProjectId:""},t,onChange:next=>{
  wallet=next;value("walletBalance",null);
  if(q("eligibility"))q("eligibility").textContent=t("na");
  if(q("grants")){recordList("grants",[]);for(const k of lotControls) q(k).hidden=true;}
  void read();
}});
void read();

if(!motion.matches && "IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add("inview");observer.unobserve(entry.target);}});
  for(const card of $$(".reveal")) observer.observe(card);
  if(matchMedia("(pointer:fine)").matches) for(const card of $$("[data-tilt]")){
    card.addEventListener("pointermove",event=>{
      if(motion.matches)return;
      const r=card.getBoundingClientRect();
      card.style.transform=`perspective(900px) rotateX(${(0.5-(event.clientY-r.top)/r.height)*5}deg) rotateY(${((event.clientX-r.left)/r.width-0.5)*5}deg)`;
    });
    card.addEventListener("pointerleave",()=>{card.style.transform="";});
  }
  const art=$$("[data-three]");
  if(art.length&&(navigator.hardwareConcurrency??8)>=4&&(navigator.deviceMemory??8)>=4&&!navigator.connection?.saveData){
    const enable=async()=>{
      if(motion.matches||!window.WebGL2RenderingContext)return;
      try { (await import("./art.js")).mount(art,{motion,label:t("motion")}); } catch {/* SVG/CSS fallback */ }
    };
    if(typeof requestIdleCallback==="function")requestIdleCallback(enable,{timeout:2500});
    else setTimeout(enable,1500);
  }
}
