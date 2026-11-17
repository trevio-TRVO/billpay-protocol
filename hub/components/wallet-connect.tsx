"use client";

import { useEffect, useRef, useState } from "react";

type Provider = {
  request: (query: { method: "eth_requestAccounts" | "eth_chainId" }) => Promise<unknown>;
  on?: (event: string, fn: (result: unknown) => void) => void;
  removeListener?: (event: string, fn: (result: unknown) => void) => void;
};

function account(value: unknown) {
  const first = Array.isArray(value) ? value[0] : null;
  return typeof first === "string" && /^0x[0-9a-f]{40}$/i.test(first) ? first : null;
}

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [chain, setChain] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const provider = useRef<Provider | null>(null);
  const connected = useRef(false);

  useEffect(() => {
    const wallet = provider.current;
    if (!address || !wallet?.on || !wallet.removeListener) return;
    const accountsChanged = (value: unknown) => {
      const next = account(value);
      connected.current = Boolean(next);
      setAddress(next);
      if (!next) setMessage("Le portefeuille a été déconnecté.");
    };
    const chainChanged = (value: unknown) => setChain(value);
    const disconnected = () => accountsChanged([]);
    wallet.on("accountsChanged", accountsChanged);
    wallet.on("chainChanged", chainChanged);
    wallet.on("disconnect", disconnected);
    return () => {
      wallet.removeListener?.("accountsChanged", accountsChanged);
      wallet.removeListener?.("chainChanged", chainChanged);
      wallet.removeListener?.("disconnect", disconnected);
    };
  }, [address]);

  async function connect() {
    const wallet = (window as Window & { ethereum?: Provider }).ethereum;
    if (!wallet?.request) {
      setMessage("Aucun portefeuille compatible détecté. Ouvrez cette page dans un navigateur équipé d’une extension ou dans le navigateur de votre portefeuille.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const selected = account(await wallet.request({ method: "eth_requestAccounts" }));
      if (!selected) {
        setMessage("Le portefeuille n’a partagé aucune adresse.");
        return;
      }
      const network = await wallet.request({ method: "eth_chainId" });
      provider.current = wallet;
      connected.current = true;
      setChain(network);
      setAddress(selected);
    } catch (error) {
      const refused = typeof error === "object" && error !== null && "code" in error && error.code === 4001;
      setMessage(refused ? "La connexion a été refusée dans le portefeuille." : "Connexion impossible. Vérifiez votre portefeuille et réessayez.");
    } finally {
      setPending(false);
    }
  }

  function disconnect() {
    if (!connected.current) return;
    connected.current = false;
    provider.current = null;
    setAddress(null);
    setChain(null);
    setMessage("L’adresse a été retirée de cette page. Vous pouvez aussi révoquer l’autorisation dans votre portefeuille.");
  }

  return <section className="data-panel wallet-panel">
    <h2>Vérifier la connexion</h2>
    {address ? <>
      <dl><dt>Adresse publique</dt><dd className="wallet-address">{address}</dd>
        <dt>Réseau du portefeuille</dt><dd>{chain === "0x2105" ? "Base" : "Autre réseau ou réseau inconnu. Sélectionnez Base dans votre portefeuille."}</dd></dl>
      <button className="action-link" type="button" onClick={disconnect}>Retirer l’adresse de cette page</button>
    </> : <button className="action-link primary-action" type="button" onClick={connect} disabled={pending}>
      {pending ? "En attente de votre portefeuille…" : "Connecter un portefeuille"}
    </button>}
    <div role="status" aria-live="polite">{message && <p>{message}</p>}</div>
  </section>;
}
