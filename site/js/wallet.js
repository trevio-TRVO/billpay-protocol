import { addressOk, BASE, RPC, EXPLORER } from "./chain.js";
const WC = "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.21.1/+esm";

export function walletController({config, t, onChange}) {
  const q=(id)=>document.getElementById(id);
  const select=q("providers"), connect=q("connect"), wc=q("walletconnect");
  if(!select) return;
  const state=q("wallet-state"), addressOut=q("wallet-address"), switchButton=q("switch"), disconnect=q("disconnect");
  const available=new Map();
  let current=null,listeners=[],generation=0,busy=false,remote=false;
  const announce=({detail})=>{
    if(typeof detail?.provider?.request!=="function"||typeof detail?.info?.uuid!=="string") return;
    const {provider,info}=detail;
    for(const [key,item] of available) if(item.provider===provider) available.delete(key);
    available.set(info.uuid.slice(0,90),{provider,name:String(info.name??"Wallet").slice(0,45)});
    populate();
  };
  const populate=()=>{
    const value=select.value;
    select.replaceChildren(...[...available].map(([k,{name}])=>new Option(name,k)));
    if(available.has(value)) select.value=value;
    select.disabled=busy||!available.size;
    connect.disabled=busy||!available.size;
    if(!current&&!busy) state.textContent=available.size?"":t("noWallet");
  };
  const publish=(next,key)=>{
    current=next;
    state.textContent=key?t(key):current?t(current.chain===BASE?"connected":"wrong"):available.size?"":t("noWallet");
    addressOut.textContent=current?.address??"";
    switchButton.hidden=!current||current.chain===BASE;
    disconnect.hidden=!current;
    onChange(current);
  };
  const detach=()=>{
    for(const [provider,event,listener] of listeners) provider.removeListener?.(event,listener);
    listeners=[];
  };
  async function attach(provider,requestAccounts,initialRemote=false) {
    const sequence=++generation;
    const [accounts,chain]=await Promise.all([provider.request({method:requestAccounts?"eth_requestAccounts":"eth_accounts"}),provider.request({method:"eth_chainId"})]);
    if(sequence!==generation) return;
    if(!addressOk(accounts?.[0])) throw Error("Missing account");
    const sync=async()=>{
      const n=++generation;
      try {
        const [addresses,chain]=await Promise.all([provider.request({method:"eth_accounts"}),provider.request({method:"eth_chainId"})]);
        if(n===generation) publish(addressOk(addresses?.[0])?{provider,address:addresses[0],chain:Number(chain)}:null);
      }catch{if(n===generation) publish(null,"txFail");}
    };
    const disconnectLocal=()=>{generation++;detach();publish(null);};
    if(remote&&current?.provider&&current.provider!==provider) void Promise.resolve(current.provider.disconnect?.()).catch(()=>{});
    detach();
    remote=initialRemote;
    for(const [event,listener] of [["accountsChanged",sync],["chainChanged",sync],["disconnect",disconnectLocal]]){
      provider.on?.(event,listener);
      listeners.push([provider,event,listener]);
    }
    publish({provider,address:accounts[0],chain:Number(chain)});
  }
  async function operate(run){
    if(busy) return;
    busy=true;populate();wc.disabled=true;switchButton.disabled=true;disconnect.disabled=true;
    try{await run();}catch{state.textContent=t("txFail");}
    finally{busy=false;populate();wc.disabled=!config.walletConnectProjectId;switchButton.disabled=false;disconnect.disabled=false;}
  }
  addEventListener("eip6963:announceProvider",announce);
  dispatchEvent(new Event("eip6963:requestProvider"));
  const legacy=window.ethereum;
  if(legacy?.request) for(const [i,provider] of (Array.isArray(legacy.providers)?legacy.providers:[legacy]).entries()){
    if(![...available.values()].some(x=>x.provider===provider)&&typeof provider.request==="function") available.set(`legacy-${i}`,{provider,name:provider.isCoinbaseWallet?"Coinbase Wallet":provider.isMetaMask?"MetaMask":"EIP-1193"});
  }
  populate();
  wc.disabled=!config.walletConnectProjectId;
  q("wc-state").hidden=Boolean(config.walletConnectProjectId);
  connect.addEventListener("click",()=>operate(()=>attach(available.get(select.value)?.provider,true)));
  wc.addEventListener("click",()=>operate(async()=>{
    const {EthereumProvider}=await import(WC);
    const provider=await EthereumProvider.init({projectId:config.walletConnectProjectId,chains:[BASE],showQrModal:true,
      rpcMap:{[BASE]:RPC},methods:["eth_sendTransaction","wallet_switchEthereumChain"],events:["accountsChanged","chainChanged"],
      metadata:{name:"BillPay Hub",description:"BillPay Hub",url:"https://billpaytoken.com",icons:["https://billpaytoken.com/assets/favicon-32.png"]}});
    try { await provider.connect(); await attach(provider,false,true); }
    catch(e){await Promise.resolve(provider.disconnect?.()).catch(()=>{});throw e;}
  }));
  switchButton.addEventListener("click",()=>operate(async()=>{
    const {provider}=current??{};
    if(!provider) return;
    try{await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x2105"}]});}
    catch(error){
      if(Number(error?.code)!==4902) throw error;
      await provider.request({method:"wallet_addEthereumChain",params:[{chainId:"0x2105",chainName:"Base",nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},rpcUrls:[RPC],blockExplorerUrls:[EXPLORER]}]});
      await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x2105"}]});
    }
    await attach(provider,false,remote);
  }));
  disconnect.addEventListener("click",()=>operate(async()=>{
    generation++;detach();
    const provider=current?.provider;
    publish(null);
    if(remote&&provider?.disconnect) await provider.disconnect();
    remote=false;
  }));
}
