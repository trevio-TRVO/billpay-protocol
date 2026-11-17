import { formatUnits } from "viem";
import type { ChainEvent } from "../events.js";

export type Lang = "fr" | "en" | "ru";
export const LANGS: Lang[] = ["fr", "en", "ru"];
export type Posts = Record<Lang, string>;

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function group(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
}

export function fmt(wei: bigint, decimals: number, maxFrac = 2): string {
  const [i = "0", f = ""] = formatUnits(wei, decimals).split(".");
  const frac = f.slice(0, maxFrac).replace(/0+$/, "");
  return group(i) + (frac ? `,${frac}` : "");
}

/** Pure, deterministic content; do not expose a solidarity recipient or case reference. */
export function render(e: ChainEvent): Posts {
  switch (e.kind) {
    case "lot_sold": {
      const usdc = fmt(e.priceUsdc, 6);
      const kind = { fr: e.pioneer ? "lot pionnier" : "lot de série", en: e.pioneer ? "pioneer lot" : "series lot", ru: e.pioneer ? "лот первопроходца" : "лот серии" };
      return {
        fr: `🎟️ Un ${kind.fr} BillPay vient d'être acquis (${usdc} USDC) par ${short(e.buyer)}. Merci à la communauté ! #BillPay #BILL #Base`,
        en: `🎟️ A BillPay ${kind.en} was just acquired (${usdc} USDC) by ${short(e.buyer)}. Thank you, community! #BillPay #BILL #Base`,
        ru: `🎟️ Только что приобретён ${kind.ru} BillPay (${usdc} USDC): ${short(e.buyer)}. Спасибо сообществу! #BillPay #BILL #Base`,
      };
    }
    case "bill_paid": {
      return {
        fr: `Un transfert de BILL du Fonds solidaire a été enregistré sur Base. Cet événement ne confirme pas le règlement d'une facture par le fournisseur. #BillPay`,
        en: `A BILL transfer from the Solidarity Fund was recorded on Base. This event does not confirm that the utility bill was settled. #BillPay`,
        ru: `В Base зарегистрирован перевод BILL из Фонда солидарности. Это событие не подтверждает оплату счёта поставщику. #BillPay`,
      };
    }
    case "burn_milestone": {
      const m = fmt(e.milestone, 18, 0);
      return {
        fr: `🔥 Jalon de burn atteint : plus de ${m} BILL détruits définitivement. #BillPay #BILL`,
        en: `🔥 Burn milestone reached: over ${m} BILL permanently destroyed. #BillPay #BILL`,
        ru: `🔥 Достигнут рубеж сжигания: более ${m} BILL уничтожено навсегда. #BillPay #BILL`,
      };
    }
  }
}
