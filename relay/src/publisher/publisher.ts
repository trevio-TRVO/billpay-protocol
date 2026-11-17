import type { ChainClient } from "../client.js";
import type { Config } from "../config.js";
import { crossedMilestones, fetchChainEvents, type ChainEvent } from "../events.js";
import type { Stats } from "../reader.js";
import { ConsoleChannel, type Channel } from "./channels.js";
import type { Queue } from "./queue.js";

export interface PublisherOptions {
  /** Default true: nothing leaves the machine. */
  dryRun: boolean;
  /** Global gate (env APPROVE=true). Without it no real post is ever sent. */
  approve: boolean;
  milestones: bigint[]; // in BILL
  channels: Channel[];
  log?: (s: string) => void;
}

export function optionsFromEnv(env: Record<string, string | undefined>, channels: Channel[]): PublisherOptions {
  return {
    dryRun: env.DRY_RUN?.trim().toLowerCase() !== "false",
    approve: env.APPROVE?.trim().toLowerCase() === "true",
    milestones: (env.BURN_MILESTONES ?? "1000000,10000000,100000000")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
      .map(BigInt),
    channels,
  };
}

/** Turns new on-chain events into queued FR/EN/RU drafts. Never posts. */
export async function collect(
  client: ChainClient,
  cfg: Config,
  queue: Queue,
  getStats: () => Promise<Pick<Stats, "burned">>,
  opts: Pick<PublisherOptions, "milestones">,
): Promise<number> {
  const head = await client.getBlockNumber();
  const st = queue.state;
  // First run starts at the head: no historical backfill spam.
  const from = st.cursor === null ? head : BigInt(st.cursor) + 1n;
  const events: ChainEvent[] = from <= head ? await fetchChainEvents(client, cfg, from, head) : [];

  const burned = BigInt((await getStats()).burned);
  for (const m of crossedMilestones(burned, opts.milestones)) {
    if (st.milestonesDone.includes(m.toString())) continue;
    st.milestonesDone.push(m.toString());
    // On the very first run, pre-existing milestones are recorded silently.
    if (st.cursor !== null) events.push({ kind: "burn_milestone", key: `burn:${m}`, block: head, milestone: m, burned });
  }

  let added = 0;
  for (const e of events) if (queue.enqueue(e)) added++;
  st.cursor = head.toString();
  await queue.save();
  return added;
}

export interface FlushResult {
  sent: { id: string; channel: string; lang: string }[];
  skipped: string;
  failures?: { id: string; channel: string; lang: string }[];
}

/** Sends approved items. Requires APPROVE=true; DRY_RUN (default) only logs. */
export async function flush(queue: Queue, opts: PublisherOptions): Promise<FlushResult> {
  const log = opts.log ?? console.log;
  const approved = queue.list("approved");
  if (!approved.length) return { sent: [], skipped: "nothing approved" };
  if (!opts.approve) return { sent: [], skipped: "APPROVE is not true: nothing posted" };

  const channels = opts.dryRun ? [new ConsoleChannel(log)] : opts.channels;
  if (!channels.length) return { sent: [], skipped: "no channel configured" };

  const sent: FlushResult["sent"] = [];
  const failures: NonNullable<FlushResult["failures"]> = [];
  for (const item of approved) {
    const done = new Set(item.postedTo);
    let failed = false;
    for (const ch of channels) {
      for (const lang of ch.langs) {
        const destination = `${ch.name}:${lang}`;
        if (!opts.dryRun && done.has(destination)) continue;
        try {
          await ch.send(item.posts[lang], lang);
        } catch (err) {
          failed = true;
          failures.push({ id: item.id, channel: ch.name, lang });
          log(`error ${item.id} ${ch.name}:${lang}: ${err instanceof Error ? err.message : err}`);
          continue;
        }
        sent.push({ id: item.id, channel: ch.name, lang });
        if (!opts.dryRun) {
          done.add(destination);
          item.postedTo = [...done];
          // Persist each confirmed delivery before attempting the next one.
          await queue.save();
        }
      }
    }
    // A failed destination keeps the item approved for an operator to review.
    if (!opts.dryRun && !failed) {
      item.status = "posted";
      item.postedTo = [...done];
    }
  }
  if (!opts.dryRun) await queue.save();
  return { sent, skipped: "", ...(failures.length ? { failures } : {}) };
}
