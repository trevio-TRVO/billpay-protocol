begin;

-- No documents, invoice content, email, or names are stored in these tables.
create table public.billpay_applicant_checks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  identity_status text not null check (identity_status in ('pending', 'verified', 'rejected')),
  updated_at timestamptz not null default now()
);

create table public.billpay_invoice_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'verified', 'rejected')),
  updated_at timestamptz not null default now()
);
create index billpay_invoice_checks_latest on public.billpay_invoice_checks(user_id, updated_at desc);

create table public.billpay_founder_account (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict
);

create table public.billpay_wallet_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  address text not null unique check (address ~ '^0x[0-9a-f]{40}$' and address <> '0x0000000000000000000000000000000000000000'),
  linked_at timestamptz not null default now()
);

create table public.billpay_wallet_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  address text not null check (address ~ '^0x[0-9a-f]{40}$'),
  nonce text not null unique check (nonce ~ '^[0-9a-f]{32}$'),
  message text not null check (length(message) between 1 and 2048),
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  check (expires_at > issued_at and expires_at <= issued_at + interval '6 minutes')
);

alter table public.billpay_applicant_checks enable row level security;
alter table public.billpay_invoice_checks enable row level security;
alter table public.billpay_founder_account enable row level security;
alter table public.billpay_wallet_links enable row level security;
alter table public.billpay_wallet_challenges enable row level security;

revoke all on public.billpay_applicant_checks, public.billpay_invoice_checks,
  public.billpay_founder_account, public.billpay_wallet_links, public.billpay_wallet_challenges
  from public, anon, authenticated, service_role;
grant select on public.billpay_applicant_checks, public.billpay_invoice_checks, public.billpay_founder_account,
  public.billpay_wallet_links, public.billpay_wallet_challenges to service_role;
-- Future integration receives a scoped, separately managed writer; the Hub
-- itself cannot approve applicant checks or assign the founder.

create function public.billpay_issue_wallet_challenge(p_user uuid, p_address text, p_nonce text,
  p_message text, p_issued timestamptz, p_expires timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.billpay_wallet_links where user_id = p_user) then
    return false;
  end if;
  insert into public.billpay_wallet_challenges (user_id,address,nonce,message,issued_at,expires_at)
    values (p_user,p_address,p_nonce,p_message,p_issued,p_expires)
  on conflict (user_id) do update
    set address = excluded.address, nonce = excluded.nonce, message = excluded.message,
        issued_at = excluded.issued_at, expires_at = excluded.expires_at, used_at = null
    where public.billpay_wallet_challenges.issued_at < now() - interval '10 seconds';
  return found;
end;
$$;

create function public.billpay_complete_wallet_challenge(p_user uuid, p_address text, p_nonce text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.billpay_wallet_challenges
    set used_at = now()
    where user_id = p_user and address = p_address and nonce = p_nonce
      and expires_at > now() and used_at is null;
  if not found then return false; end if;
  insert into public.billpay_wallet_links (user_id,address) values (p_user,p_address)
    on conflict do nothing;
  return found;
end;
$$;

revoke all on function public.billpay_issue_wallet_challenge(uuid,text,text,text,timestamptz,timestamptz),
  public.billpay_complete_wallet_challenge(uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function public.billpay_issue_wallet_challenge(uuid,text,text,text,timestamptz,timestamptz),
  public.billpay_complete_wallet_challenge(uuid,text,text) to service_role;

commit;
