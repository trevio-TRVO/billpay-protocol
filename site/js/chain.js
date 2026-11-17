const ETHERS = "https://cdn.jsdelivr.net/npm/ethers@6.16.0/dist/ethers.min.js";
export const BASE = 8453;
export const RPC = "https://mainnet.base.org";
export const EXPLORER = "https://basescan.org";
export const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const names = ["BillPayProtocol","CommunityLots","SolidarityWallet","CouncilRegistry","AutoLiquidity","MonthlyVesting"];
export const addressOk = (x) => typeof x === "string" && /^0x[\da-f]{40}$/i.test(x) && !/^0x0{40}$/i.test(x);
export const hashOk = (x) => typeof x === "string" && /^0x[\da-f]{64}$/i.test(x);
const same = (a,b) => addressOk(a) && addressOk(b) && a.toLowerCase() === b.toLowerCase();
const units = 10n**18n;
export const DAY = 86400;

const abis = {
  BillPayProtocol: ["function balanceOf(address) view returns (uint256)","function totalSupply() view returns (uint256)","function solidarityWallet() view returns (address)","event Contribution(address indexed trader,uint256 aid,uint256 burned,uint256 ops,uint256 liquidity)"],
  CommunityLots: ["function token() view returns (address)","function usdc() view returns (address)","function pioneerSold() view returns (uint256)","function openedSeries() view returns (uint256)","function availablePaidLots() view returns (uint256)","function seriesStart() view returns (uint256)","function lotTokens() view returns (uint256)","function hasBought(address) view returns (bool)","function grantCount(address) view returns (uint256)","function grants(address,uint256) view returns (uint128 total,uint128 claimed,uint64 start)","function vested(address,uint256) view returns (uint256)","function buyPioneer()","function buy()","function openSeries()","function claim(uint256)","event Purchased(address indexed buyer,bool pioneer,uint256 price)","event Claimed(address indexed who,uint256 indexed grantId,uint256 amount)","event SeriesOpened(uint256 time)"],
  SolidarityWallet: ["function token() view returns (address)","function lots() view returns (address)","function registry() view returns (address)","function requestCount() view returns (uint256)","function requests(uint256) view returns (address payee,uint256 amount,bytes32 invoiceHash,uint64 validatedAt,uint32 validators,uint8 status)","function approvalWeight(uint256) view returns (uint256)","function lastPaid(address) view returns (uint256)","event Paid(uint256 indexed id,address indexed payee,uint256 amount)","event Cancelled(uint256 indexed id,address indexed by)","event Validated(uint256 indexed id,address indexed validator,uint256 validators)","event Approved(uint256 indexed id,address indexed signer,uint256 weight)"],
  CouncilRegistry: ["function currentCouncil() view returns (address[10])","function lastRotation() view returns (uint256)","event CouncilRotated(address[10] oldCouncil,address[10] newCouncil,uint256 indexed epoch)"],
  AutoLiquidity: ["function token() view returns (address)","function stockLeft() view returns (uint256)","event LiquidityAdded(uint256 tokensSold,uint256 usdcAdded,uint256 tokensAdded,uint256 lpTokens)"],
  MonthlyVesting: ["event Released(address indexed token,uint256 amount)"],
  usdc: ["function allowance(address,address) view returns (uint256)","function balanceOf(address) view returns (uint256)","function approve(address,uint256) returns (bool)"]
};

export async function readConfig(url) {
  const response = await fetch(url,{signal:AbortSignal.timeout(5000),credentials:"omit"});
  if (!response.ok) throw Error("config");
  const raw = await response.json();
  if (raw.chainId!==BASE || raw.rpcUrl!==RPC || raw.explorer!==EXPLORER) throw Error("unexpected network");
  return Object.freeze({
    chainId:BASE, transactionsEnabled:raw.transactionsEnabled===true,
    walletConnectProjectId:/^[\da-f]{32}$/i.test(raw.walletConnectProjectId ?? "") ? raw.walletConnectProjectId : "",
    deploymentBlock:Number.isSafeInteger(raw.deploymentBlock)&&raw.deploymentBlock>0 ? raw.deploymentBlock:null,
    contracts:Object.freeze(Object.fromEntries(names.map((k)=>[k,addressOk(raw.contracts?.[k])?raw.contracts[k]:""])))
  });
}
let rpcId=0;
async function rpc(method,params=[]) {
  const id=++rpcId;
  const res = await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",method,params,id}),referrerPolicy:"no-referrer",credentials:"omit",signal:AbortSignal.timeout(6500)});
  if(!res.ok) throw Error("RPC unavailable");
  const data=await res.json();
  if(data.id!==id || data.error || !Object.hasOwn(data,"result")) throw Error("RPC rejected");
  return data.result;
}
const hex=(n)=>`0x${n.toString(16)}`;
let ethers;
export class Reader {
  constructor(cfg,tag,block,iface) { this.cfg=cfg;this.tag=tag;this.block=block;this.iface=iface;this.checked=new Map(); }
  static async create(cfg) {
    const [chain,block,lib]=await Promise.all([rpc("eth_chainId"),rpc("eth_getBlockByNumber",["latest",false]),ethers??=import(ETHERS).catch(e=>{ethers=null;throw e;})]);
    if (Number(chain)!==BASE || !block?.number || !block.timestamp) throw Error("Wrong RPC network");
    return new Reader(cfg,block.number,{number:Number(block.number),now:Number(block.timestamp)},Object.fromEntries(Object.entries(abis).map(([k,a])=>[k,new lib.Interface(a)])));
  }
  addr(k) { return k==="usdc"?USDC:this.cfg.contracts[k]; }
  async check(k) {
    const addr=this.addr(k);
    if (!addr) throw Error("Missing address");
    if(!this.checked.has(k)) this.checked.set(k,rpc("eth_getCode",[addr,this.tag]).then(code=>{if(!/^0x(?:[\da-f]{2})+$/i.test(code)) throw Error("No code");}));
    await this.checked.get(k);
    return addr;
  }
  async call(k,fn,args=[]) {
    const to=await this.check(k), a=this.iface[k], data=a.encodeFunctionData(fn,args);
    const value=await rpc("eth_call",[{to,data},this.tag]);
    const result=a.decodeFunctionResult(fn,value);
    return result.length===1?result[0]:result;
  }
  async fundCheck() {
    const [linked,token]=await Promise.all([this.call("BillPayProtocol","solidarityWallet"),this.call("SolidarityWallet","token")]);
    if (!same(linked,this.addr("SolidarityWallet")) || !same(token,this.addr("BillPayProtocol"))) throw Error("Unexpected fund");
  }
  async lotsCheck() {
    const token=await this.call("CommunityLots","token");
    await this.check("BillPayProtocol");
    if(!same(token,this.addr("BillPayProtocol"))) throw Error("Unexpected lot token");
  }
  async events(k,names,{from,to=this.block.number,chunk=700}={}) {
    if (!Number.isSafeInteger(from)||from<0||from>to||to-from>50000) throw Error("Unsupported log window");
    const address=await this.check(k), iface=this.iface[k], topics=[names.map(n=>iface.getEvent(n).topicHash)];
    let rows=[];
    for(let i=from;i<=to;i+=chunk) {
      const logs=await rpc("eth_getLogs",[{address,topics,fromBlock:hex(i),toBlock:hex(Math.min(i+chunk-1,to))}]);
      if(!Array.isArray(logs)) throw Error("Invalid log response");
      rows=rows.concat(logs.filter(l=>!l.removed&&hashOk(l.transactionHash)&&same(l.address,address))
        .map(l=>({block:Number(l.blockNumber),index:Number(l.logIndex),hash:l.transactionHash,parsed:iface.parseLog(l)})));
    }
    return rows;
  }
  async cases(offset=0,detail=false) {
    await this.fundCheck();
    const [count,balance]=await Promise.all([this.call("SolidarityWallet","requestCount"),this.call("BillPayProtocol","balanceOf",[this.addr("SolidarityWallet")])]);
    const start=count>BigInt(offset)?count-BigInt(offset):0n;
    const ids=Array.from({length:Number(start<8n?start:8n)},(_,i)=>start-BigInt(i)-1n);
    const entries=await Promise.all(ids.map(async id=>{
      const r=await this.call("SolidarityWallet","requests",[id]);
      const state=Number(r.status), row={id,amount:r.amount,when:Number(r.validatedAt),validators:r.validators,state};
      if(detail && state===1){
        const [weight,last]=await Promise.all([this.call("SolidarityWallet","approvalWeight",[id]),this.call("SolidarityWallet","lastPaid",[r.payee])]);
        row.weight=weight;row.cooldown=last?Number(last)+30*DAY:0;
      }
      return row;
    }));
    return {count,balance,entries};
  }
  async totals(count) {
    if(count<=160n) {
      let paid=0n,total=0n;
      for(let offset=0;offset<Number(count);offset+=8){
        const rows=await Promise.all(Array.from({length:Math.min(8,Number(count)-offset)},(_,i)=>this.call("SolidarityWallet","requests",[offset+i])));
        for(const r of rows) if(Number(r.status)===2){paid++;total+=r.amount;}
      }
      return {paid,total};
    }
    const from=this.cfg.deploymentBlock;
    if (!from || this.block.number-from>12000) throw Error("Complete history unavailable");
    const logs=await this.events("SolidarityWallet",["Paid"],{from});
    const unique = new Map(logs.map((row)=>[row.parsed.args.id.toString(),row.parsed.args.amount]));
    return {paid:BigInt(unique.size),total:[...unique.values()].reduce((a,b)=>a+b,0n)};
  }
  async lots(account) {
    await this.lotsCheck();
    const [pioneer,series,stock,seriesStart,oracle]=await Promise.all([
      this.call("CommunityLots","pioneerSold"),this.call("CommunityLots","openedSeries"),
      this.call("CommunityLots","availablePaidLots"),this.call("CommunityLots","seriesStart"),
      this.call("CommunityLots","lotTokens").catch(()=>null)]);
    const values={pioneer,series,stock,seriesStart,oracle,grants:[]};
    if(account) {
      Object.assign(values,await this.lotAccount(account));
      if(this.cfg.transactionsEnabled) {
        values.allowance=await (async()=>{
          if(!same(await this.call("CommunityLots","usdc"),USDC))throw Error("Unexpected USDC");
          return this.call("usdc","allowance",[account,this.addr("CommunityLots")]);
        })().catch(()=>null);
      }
    }
    return values;
  }
  async lotAccount(account) {
    await this.lotsCheck();
    const [hasBought,count]=await Promise.all([this.call("CommunityLots","hasBought",[account]),this.call("CommunityLots","grantCount",[account])]);
    // The V3 max per address is bounded by the series count plus a paid lot.
    if(count>64n) throw Error("Unexpected number of grants");
    const grants=[];
    for(let i=0;i<Number(count);i+=8) grants.push(...await Promise.all(Array.from({length:Math.min(8,Number(count)-i)},async(_,j)=>{
      const id=i+j;
      const [g,vested]=await Promise.all([this.call("CommunityLots","grants",[account,id]),this.call("CommunityLots","vested",[account,id])]);
      return {id,total:g.total,claimed:g.claimed,start:Number(g.start),vested};
    })));
    return {hasBought,grants};
  }
  async validator(account) {
    await this.fundCheck();
    if(!same(await this.call("SolidarityWallet","lots"),this.addr("CommunityLots"))) throw Error("Unexpected validator contract");
    const {hasBought,grants}=await this.lotAccount(account);
    return hasBought&&grants.some(g=>this.block.now>=g.start+30*DAY);
  }
  async send(kind,id,session) {
    if(!this.cfg.transactionsEnabled || !session?.provider || !addressOk(session.address) || session.chain!==BASE) throw Error("Transactions disabled");
    await this.lotsCheck();
    const {provider,address:from}=session;
    const ensureActive=async()=>{
      const [chain,accounts]=await Promise.all([provider.request({method:"eth_chainId"}),provider.request({method:"eth_accounts"})]);
      if(Number(chain)!==BASE||!same(from,accounts?.[0])) throw Error("Active account changed");
    };
    await ensureActive();
    let key="CommunityLots", fn, args=[];
    if(kind==="claim"){
      if(!Number.isSafeInteger(id)||id<0) throw Error("Invalid grant");
      fn="claim";args=[id];
    } else if(kind==="open") fn="openSeries";
    else if(["pioneer","series","approve-pioneer","approve-series"].includes(kind)){
      if(!same(await this.call(key,"usdc"),USDC)) throw Error("Unexpected USDC");
      const pioneer=kind.endsWith("pioneer"), approval=kind.startsWith("approve-");
      const price=pioneer?10_000_000n:50_000_000n;
      const [allowance,balance]=await Promise.all([this.call("usdc","allowance",[from,this.addr(key)]),this.call("usdc","balanceOf",[from])]);
      if(balance<price) throw Error("Insufficient USDC");
      if(approval&&allowance<price){
        const [bought,stock]=await Promise.all([this.call(key,"hasBought",[from]),this.call(key,pioneer?"pioneerSold":"availablePaidLots")]);
        if(bought||(pioneer?stock>=100n:stock===0n)) throw Error("Lot unavailable");
        if(!pioneer&&await this.call(key,"lotTokens")===0n) throw Error("Oracle unavailable");
        args=[this.addr(key),price];key="usdc";fn="approve";
      }
      else if(!approval&&allowance>=price) fn=pioneer?"buyPioneer":"buy";
      else throw Error("Allowance changed, refresh");
    } else throw Error("Unknown action");
    const to=await this.check(key), data=this.iface[key].encodeFunctionData(fn,args), tx={from,to,data,value:"0x0"};
    const result=await rpc("eth_call",[tx,"latest"]);
    if(fn==="approve"&&!this.iface.usdc.decodeFunctionResult("approve",result)[0]) throw Error("Approval failed");
    await ensureActive();
    const hash=await provider.request({method:"eth_sendTransaction",params:[tx]});
    if(!hashOk(hash)) throw Error("Unrecognized transaction response");
    return hash;
  }
}

export function amount(value, locale, maxDigits=4) {
  if (typeof value!=="bigint" || value<0n) return "";
  const formatter = new Intl.NumberFormat(locale);
  const [whole,fraction]=[value/units,(value%units).toString().padStart(18,"0").slice(0,maxDigits).replace(/0+$/,"")];
  if(!fraction) return whole===0n && value>0n ? `< ${new Intl.NumberFormat(locale,{maximumFractionDigits:maxDigits}).format(10**(-maxDigits))}` : formatter.format(whole);
  const sep=formatter.formatToParts(1.1).find(p=>p.type==="decimal")?.value??".";
  const digit=new Intl.NumberFormat(locale,{useGrouping:false});
  return formatter.format(whole)+sep+[...fraction].map(n=>digit.format(Number(n))).join("");
}
