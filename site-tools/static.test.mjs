import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { BASE, RPC, EXPLORER, Reader, readConfig } from "../site/js/chain.js";

const root=new URL("../site/",import.meta.url);
const read=p=>readFile(new URL(p,root),"utf8");
const routes=["","demande/","tribunal/","transparence/","token/","lots/","wallet/","validateurs/","conseil/","antibot/"];
const locales=["fr","en","ru","es","ar"];

test("all 50 static routes exist with native titles, correct direction and hreflang",async()=>{
  const keys=Object.keys(JSON.parse(await read("i18n/fr.json"))).sort();
  for(const l of locales){
    const dictionary=JSON.parse(await read(`i18n/${l}.json`));
    assert.deepEqual(Object.keys(dictionary).sort(),keys);
    for(const route of routes){
      const p=`${l==="fr"?"":`lang/${l}/`}${route}index.html`;
      const html=await read(p);
      assert.match(html,new RegExp(`<html lang="${l}" dir="${l==="ar"?"rtl":"ltr"}"`));
      assert.match(html,/<meta name="description" content="[^"]{14,}"/);
      assert.equal([...html.matchAll(/hreflang="/g)].length,6);
      assert.match(html,/<main[^>]*id="main"/);
      assert.match(html,/id="read-state"/);
      assert.match(html,/form-action 'none'/);
      for(const match of html.matchAll(/data-i18n="([^"]+)"/g))assert.notEqual(dictionary[match[1]],undefined);
      for(const match of html.matchAll(/(?:href|src)="(\.\.?\/[^"#]*)"/g)) {
        const u=new URL(match[1],new URL(p,root));
        if(u.pathname.endsWith("/"))await stat(new URL("index.html",u));else await stat(u);
      }
    }
  }
});
test("release defaults have no addresses, WalletConnect identifier or transactions",async()=>{
  const conf=JSON.parse(await read("config.json"));
  assert.equal(conf.chainId,8453);
  assert.equal(conf.transactionsEnabled,false);
  assert.equal(conf.walletConnectProjectId,"");
  assert.equal(conf.deploymentBlock,null);
  assert.equal(Object.keys(conf.contracts).length,6);
  assert.ok(Object.values(conf.contracts).every(v=>v===""));
  assert.match(await read("404.html"),/noindex/);
  assert.match(await read("robots.txt"),/https:\/\/billpaytoken\.com\/sitemap\.xml/);
  assert.equal((await read("sitemap.xml")).match(/<loc>/g).length,50);
});

test("configured SolidarityWallet is retained and reads never invent counts or totals",async(t)=>{
  const token=`0x${"1".repeat(40)}`, fund=`0x${"2".repeat(40)}`;
  t.mock.method(globalThis,"fetch",async()=>new Response(JSON.stringify({
    chainId:BASE,rpcUrl:RPC,explorer:EXPLORER,contracts:{BillPayProtocol:token,SolidarityWallet:fund}
  })));
  const cfg=await readConfig("https://example.test/config.json");
  assert.equal(cfg.contracts.SolidarityWallet,fund);
  const reader=new Reader(cfg,"0x1",{number:1,now:1600000000},{});
  const rows=[
    {status:2,amount:12n,validatedAt:0,validators:5},
    {status:1,amount:14n,validatedAt:1599999999,validators:5,payee:token},
    {status:3,amount:20n,validatedAt:0,validators:1}
  ];
  reader.call=async(_contract,fn,args)=>({
    solidarityWallet:fund,token,requestCount:3n,balanceOf:100n,
    approvalWeight:5n,lastPaid:1599999998n,requests:rows[Number(args?.[0])]
  })[fn];
  const data=await reader.cases(0,true);
  assert.equal(data.balance,100n);
  assert.deepEqual(data.entries.map(({state})=>state),[3,1,2]);
  assert.equal(data.entries[1].cooldown,1599999998+30*86400);
  assert.deepEqual(await reader.totals(data.count),{paid:1n,total:12n});
  await assert.rejects(reader.totals(161n),/Complete history unavailable/);
});

test("USDC approval cannot substitute for a purchase; refusal and changed network never send",async(t)=>{
  const token=`0x${"1".repeat(40)}`, lots=`0x${"2".repeat(40)}`, account=`0x${"3".repeat(40)}`, hash=`0x${"a".repeat(64)}`;
  const cfg={transactionsEnabled:true,contracts:{BillPayProtocol:token,CommunityLots:lots}};
  const encode=(name,args)=>`${name}:${args.join(",")}`;
  const reader=new Reader(cfg,"0x1",{number:1},{
    CommunityLots:{encodeFunctionData:encode},usdc:{encodeFunctionData:encode,decodeFunctionResult:()=>[true]}
  });
  const sim=[],sent=[];
  let allowance=0n, sold=20n, chain="0x2105", refuse=false, drift=false;
  t.mock.method(globalThis,"fetch",async(url,init)=>{
    assert.equal(url,RPC);
    const {id,method,params}=JSON.parse(init.body);
    assert.equal(method,"eth_call");
    assert.equal(params[1],"latest");
    sim.push(params[0].data);
    if(drift)chain="0x1";
    return new Response(JSON.stringify(refuse?{id,error:{code:3}}:{id,result:"0x"}));
  });
  reader.check=async k=>reader.addr(k);
  reader.call=async(_k,f)=>({token,usdc:reader.addr("usdc"),allowance,balanceOf:60_000_000n,hasBought:false,pioneerSold:sold})[f];
  const provider={request:async({method,params})=>{
    if(method==="eth_accounts")return [account];
    if(method==="eth_chainId")return chain;
    assert.equal(method,"eth_sendTransaction");
    sent.push(params[0].data);return hash;
  }};
  const session={address:account,chain:BASE,provider};
  await assert.rejects(reader.send("pioneer",null,session),/Allowance changed/);
  sold=100n;
  await assert.rejects(reader.send("approve-pioneer",null,session),/Lot unavailable/);
  sold=20n;
  await assert.rejects(reader.send("approve-pioneer",null,{...session,chain:1}),/Transactions disabled/);
  assert.deepEqual(sent,[]);
  assert.equal(await reader.send("approve-pioneer",null,session),hash);
  assert.deepEqual(sent,[`approve:${lots},10000000`]);
  allowance=10_000_000n;
  await assert.rejects(reader.send("approve-pioneer",null,session),/Allowance changed/);
  refuse=true;
  await assert.rejects(reader.send("pioneer",null,session),/RPC rejected/);
  refuse=false;
  drift=true;
  await assert.rejects(reader.send("pioneer",null,session),/Active account changed/);
  assert.equal(sent.length,1);
  drift=false;chain="0x2105";
  assert.equal(await reader.send("pioneer",null,session),hash);
  assert.equal(sent[1],"buyPioneer:");
  assert.equal(sim.length,4);
});
