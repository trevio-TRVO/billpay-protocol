"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { accountClient, accountRequest, linkWallet, turnstileKey, type AccountProfile } from "@/lib/account-client";
import { useAccountSession } from "@/components/account-provider";
import { StatusPanel } from "@/components/project";

const proofLabels = { not_started: "Non démarrée", pending: "En cours", verified: "Vérifiée", rejected: "Non validée" };
const chainLabels = {
  not_linked: "Associez un wallet", unconfigured: "Contrat non raccordé", unavailable: "Lecture indisponible",
  eligible: "Admissible", ineligible: "Non admissible", available: "Disponible",
};
const codePattern = /^[0-9]{6,10}$/;
const rooms = { applicant: "Demandeur", gold: "Gold", council: "Conseil", founder: "Fondateur" };
type Role = keyof typeof rooms;
type Workspace =
  | { role: "applicant"; reference: string }
  | { role: "gold"; lots: string }
  | { role: "council"; registry: string }
  | { role: "founder"; sources: { token: boolean; lots: boolean; registry: boolean } };

function EmailAccess() {
  const [mode, setMode] = useState<"create" | "login">("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function restart() {
    setSent(false); setCaptcha(""); setCaptchaKey((key) => key + 1); setCode(""); setMessage("");
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!accountClient || !captcha || busy) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await accountClient.auth.signInWithOtp({ email: email.trim(), options: {
        shouldCreateUser: mode === "create", captchaToken: captcha,
      } });
      if (error?.code === "captcha_failed") setMessage("Le contrôle anti-bot a expiré ou a échoué. Réessayez.");
      else if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
        setMessage("Trop de tentatives. Patientez avant de demander un nouveau code.");
      } else if (error && (!error.status || error.status >= 500)) setMessage("Le service est momentanément indisponible.");
      else { setSent(true); setMessage("Si l’adresse peut recevoir un code, consultez votre boîte de réception."); }
    } catch { setMessage("Impossible de contacter le service de connexion."); }
    finally { setBusy(false); setCaptcha(""); setCaptchaKey((key) => key + 1); }
  }
  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!accountClient || !codePattern.test(code.trim()) || busy) return;
    setBusy(true); setMessage("");
    try {
      const { error, data } = await accountClient.auth.verifyOtp({ type: "email", email: email.trim(), token: code.trim() });
      if (error || !data.session) setMessage("Code invalide ou expiré. Vérifiez le code ou demandez-en un nouveau.");
    } catch { setMessage("Impossible de vérifier ce code pour le moment."); }
    finally { setBusy(false); }
  }

  return <section className="data-panel account-panel">
    <h2>{sent ? "Vérifiez votre e-mail" : mode === "create" ? "Créer un compte BillPay" : "Se connecter à BillPay"}</h2>
    {!sent && <div role="group" aria-label="Accès au compte" className="account-actions">
      <button className="account-choice" type="button" aria-pressed={mode === "login"} disabled={busy}
        onClick={() => { setMode("login"); restart(); }}>Se connecter</button>
      <button className="account-choice" type="button" aria-pressed={mode === "create"} disabled={busy}
        onClick={() => { setMode("create"); restart(); }}>Créer un compte</button>
    </div>}
    {sent ? <form className="account-form" onSubmit={confirm}>
      <p>Adresse saisie : <strong>{email}</strong></p>
      <label htmlFor="account-code">Code reçu par e-mail</label>
      <input id="account-code" inputMode="numeric" autoComplete="one-time-code" value={code}
        onChange={(e) => setCode(e.target.value)} maxLength={10} required />
      <div className="account-actions">
        <button className="action-link primary-action" type="submit" disabled={busy || !codePattern.test(code.trim())}>Vérifier le code</button>
        <button className="action-link" type="button" disabled={busy} onClick={restart}>Changer d’adresse ou redemander un code</button>
      </div>
    </form> : <form className="account-form" onSubmit={send}>
      <p>Un code à usage unique est envoyé par e-mail. Aucun mot de passe ni wallet n’est nécessaire pour créer un compte.</p>
      <label htmlFor="account-email">Adresse e-mail</label>
      <input id="account-email" type="email" autoComplete="email" maxLength={254} value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <Turnstile key={captchaKey} siteKey={turnstileKey}
        options={{ theme: "dark", language: "fr", size: "flexible" }}
        onSuccess={setCaptcha} onExpire={() => setCaptcha("")}
        onError={() => { setCaptcha(""); setMessage("Le contrôle anti-bot n’a pas chargé. Actualisez la page pour réessayer."); }} />
      <button className="action-link primary-action" type="submit" disabled={busy || !captcha}>
        {busy ? "Envoi du code…" : "Recevoir un code"}
      </button>
    </form>}
    <div className="account-message" role="status" aria-live="polite">{message}</div>
  </section>;
}

function SecondFactor() {
  const [factorId, setFactorId] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function begin() {
    if (!accountClient || busy) return;
    setBusy(true); setMessage("");
    try {
      const list = await accountClient.auth.mfa.listFactors();
      if (list.error) throw list.error;
      const previous = list.data.totp[0];
      if (previous) setFactorId(previous.id);
      else {
        for (const factor of list.data.all.filter((f) => f.factor_type === "totp" && f.status === "unverified")) {
          const old = await accountClient.auth.mfa.unenroll({ factorId: factor.id });
          if (old.error) throw old.error;
        }
        const enrollment = await accountClient.auth.mfa.enroll({ factorType: "totp", friendlyName: "BillPay", issuer: "BillPay Hub" });
        if (enrollment.error) throw enrollment.error;
        setSecret(enrollment.data.totp.secret);
        setFactorId(enrollment.data.id);
      }
    } catch { setMessage("La deuxième vérification n’est pas disponible actuellement."); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!accountClient || !/^[0-9]{6}$/.test(code) || busy || !factorId) return;
    setBusy(true); setMessage("");
    try {
      const result = await accountClient.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) setMessage("Code incorrect ou expiré. Essayez le nouveau code de votre application.");
      else { setSecret(""); setCode(""); }
    } catch { setMessage("Impossible de vérifier le code actuellement."); }
    finally { setBusy(false); }
  }

  return <div className="account-mfa">
    <h3>Deuxième vérification</h3>
    <p>Protégez votre compte avec une application d’authentification. Cette étape est obligatoire pour les accès Conseil et Fondateur.</p>
    {!factorId ? <button className="action-link" type="button" onClick={begin} disabled={busy}>Vérifier avec une application d’authentification</button>
      : <form className="account-form" onSubmit={verify}>
        {secret && <p>Ajoutez « BillPay » dans votre application d’authentification avec cette clé de configuration. Ne la partagez pas : <code>{secret}</code></p>}
        <label htmlFor="mfa-code">Code de l’application</label>
        <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value)} required />
        <button className="action-link primary-action" type="submit" disabled={busy || !/^[0-9]{6}$/.test(code)}>Confirmer la deuxième vérification</button>
      </form>}
    <div className="account-message" role="status" aria-live="polite">{message}</div>
  </div>;
}

function SignedInAccount({ token, email }: { token: string; email?: string }) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [setupMfa, setSetupMfa] = useState(false);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    setProfile(null);
    setWorkspace(null);
    accountRequest<AccountProfile>(token, "profile").then((result) => {
      if (active) { setProfile(result); setStatus("loaded"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [token, revision]);

  async function openWorkspace(role: Role) {
    if (busy) return;
    setBusy(true); setMessage(""); setWorkspace(null);
    try {
      setWorkspace(await accountRequest<Workspace>(token, "workspace", { role }));
    } catch {
      setMessage("Cet accès n’a pas pu être confirmé. Actualisez vos droits et réessayez.");
    } finally { setBusy(false); }
  }

  async function associate() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      await linkWallet(token);
      setMessage("Portefeuille associé. Les droits sont en cours de vérification.");
      setRevision((value) => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Association impossible.");
    } finally { setBusy(false); }
  }
  async function signOut() {
    if (!accountClient || busy) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await accountClient.auth.signOut({ scope: "local" });
      if (error) setMessage("La déconnexion n’a pas abouti. Réessayez ou fermez cet onglet.");
    } catch { setMessage("La déconnexion n’a pas abouti. Réessayez ou fermez cet onglet."); }
    finally { setBusy(false); }
  }

  return <section className="data-panel account-panel">
    <div className="section-heading"><div><h2>Votre compte</h2>{email && <p>{email}</p>}</div>
      <button className="action-link" type="button" onClick={signOut} disabled={busy}>Se déconnecter</button></div>
    {status === "loading" && <p role="status">Vérification de vos droits…</p>}
    {status === "error" && <p role="alert">Impossible de vérifier vos droits pour le moment. Aucun accès n’est confirmé.</p>}
    {profile && <>
      <dl className="account-rules">
        <div><dt>Demandeur : {profile.access.applicant ? "Dossier vérifié" : "Non vérifié"}</dt>
          <dd>Identité : {proofLabels[profile.verification.identity]}. Dernière facture : {proofLabels[profile.verification.invoice]}.</dd></div>
        <div><dt>Gold : {profile.access.gold ? "Actif" : "Non confirmé"}</dt><dd>{chainLabels[profile.chain.gold]}</dd></div>
        <div><dt>Conseil : {profile.access.council ? "Actif" : "Non confirmé"}</dt><dd>{chainLabels[profile.chain.council]}</dd></div>
        {profile.access.founder && <div><dt>Fondateur : actif</dt><dd>Votre deuxième vérification est confirmée.</dd></div>}
      </dl>
      {!profile.elevated && (profile.requiresMfa || setupMfa ? <SecondFactor /> :
        <button className="action-link" type="button" onClick={() => setSetupMfa(true)}>Configurer la deuxième vérification</button>)}
      {Object.values(profile.access).some(Boolean) && <div className="account-actions">
        {(Object.keys(rooms) as Role[]).filter((role) => profile.access[role]).map((role) =>
          <button key={role} className="account-choice" type="button" disabled={busy}
            aria-pressed={workspace?.role === role} onClick={() => openWorkspace(role)}>Ouvrir l’espace {rooms[role]}</button>)}
      </div>}
      {workspace && <section className="account-mfa" aria-label={`Espace ${rooms[workspace.role]}`}>
        <h3>Espace {rooms[workspace.role]}</h3>
        {workspace.role === "applicant" && <p>Votre dernier dossier vérifié : <code>{workspace.reference}</code>. Le dépôt de nouveaux justificatifs n’est pas ouvert.</p>}
        {workspace.role === "gold" && <p>Lots enregistrés pour votre wallet : <strong>{workspace.lots}</strong>. Aucun achat ni retrait n’est disponible depuis cet espace.</p>}
        {workspace.role === "council" && <p>Votre mandat est actif dans le <a className="action-link" href={`https://basescan.org/address/${workspace.registry}`}>registre du conseil</a>. Cet espace n’autorise pas encore la signature d’approbations.</p>}
        {workspace.role === "founder" && <dl className="account-rules">
          <div><dt>Jeton BILL</dt><dd>{workspace.sources.token ? "Source configurée" : "Non raccordé"}</dd></div>
          <div><dt>Contrat des lots</dt><dd>{workspace.sources.lots ? "Source configurée" : "Non raccordé"}</dd></div>
          <div><dt>Registre du conseil</dt><dd>{workspace.sources.registry ? "Source configurée" : "Non raccordé"}</dd></div>
        </dl>}
        <button className="action-link" type="button" onClick={() => setWorkspace(null)}>Fermer cet espace</button>
      </section>}
      <div className="account-wallet">
        <h3>Wallet sur Base</h3>
        {profile.wallet ? <p className="wallet-address">{profile.wallet}</p> : <>
          <p>L’association demande une signature de message. Aucun achat, envoi ou accès à vos jetons n’est autorisé.</p>
          <button className="action-link primary-action" onClick={associate} type="button" disabled={busy}>Associer un wallet externe</button>
        </>}
        <p>Solde BILL : {profile.chain.bill === "available" && profile.chain.balance !== null
          ? <strong>{profile.chain.balance} BILL</strong> : chainLabels[profile.chain.bill]}</p>
        {profile.chain.tokenAddress && <a className="action-link" href={`https://basescan.org/token/${profile.chain.tokenAddress}`}>Vérifier le contrat sur Basescan</a>}
      </div>
    </>}
    {status !== "loading" && <button className="action-link" type="button" disabled={busy}
      onClick={() => { setMessage(""); setRevision((value) => value + 1); }}>Actualiser les droits</button>}
    <div className="account-message" role="status" aria-live="polite">{message}</div>
  </section>;
}

export function AccountPanel() {
  const session = useAccountSession();
  if (!accountClient) return <StatusPanel title="La création de comptes n’est pas encore ouverte">
    Le service d’authentification sécurisé et sa protection anti-bot doivent être activés avant de recueillir une adresse e-mail.
  </StatusPanel>;
  return session ? <SignedInAccount key={session.user.id} token={session.access_token} email={session.user.email} /> : <EmailAccess />;
}
