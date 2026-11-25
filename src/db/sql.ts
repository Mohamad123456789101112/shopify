/**
 * BLY security layer — applied idempotently at runtime (and shown in /admin → SQL).
 * Tables come from the Drizzle schema (`npx drizzle-kit push`); this file owns
 * CHECK constraints, the least-privilege role, RLS on EVERY table, guard triggers,
 * SECURITY DEFINER RPCs (privileged ops never run in the browser) and the public view.
 */
export const BOOTSTRAP_SQL = `
create extension if not exists pgcrypto;

-- ── least privilege client role (app connects as postgres, then SET LOCAL ROLE) ──
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'app_client') then
    create role app_client nologin;
  end if;
end $$;

grant usage on schema public to app_client;
grant select, insert, update, delete on all tables in schema public to app_client;
grant usage, select on all sequences in schema public to app_client;
revoke all on auth_users, sessions, password_resets, bly_schema_migrations, audit_logs, security_logs, rate_limits, platform_settings from app_client;
grant select on platform_settings to app_client;
grant select on audit_logs, security_logs to app_client;
revoke insert, update, delete on orders from app_client;
revoke insert, update, delete on platform_owners from app_client;
grant select, update on orders to app_client;

-- ── constraints ──
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'merchants_slug_chk') then
    alter table merchants add constraint merchants_slug_chk check (store_slug ~ '^[a-z0-9-]{2,40}$');
    alter table merchants add constraint merchants_store_name_chk check (char_length(store_name) between 2 and 40);
    alter table merchants add constraint merchants_plan_chk check (plan in ('free','growth','pro'));
    alter table merchants add constraint merchants_billing_chk check (billing in ('monthly','yearly'));
    alter table merchants add constraint merchants_sub_chk check (sub_status in ('active','grace','expired','trial'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_name_chk') then
    alter table profiles add constraint profiles_name_chk check (char_length(name) between 2 and 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stores_size_chk') then
    alter table stores add constraint stores_size_chk check (pg_column_size(site) < 1500000);
    alter table stores add constraint stores_pub_size_chk check (site_published is null or pg_column_size(site_published) < 1500000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_chk') then
    alter table products add constraint products_chk check (
      char_length(name) between 1 and 120 and price >= 0 and (compare_at is null or compare_at >= 0)
      and stock >= 0 and status in ('active','draft'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_chk') then
    alter table orders add constraint orders_chk check (
      status in ('New','Processing','Shipped','Delivered','Refunded','Cancelled')
      and payment in ('cod','wallet','instapay','card','applepay','tamara')
      and payment_status in ('unpaid','pending_review','paid','refunded')
      and subtotal >= 0 and total >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'discounts_chk') then
    alter table discounts add constraint discounts_chk check (
      code ~ '^[A-Z0-9-]{3,24}$' and type in ('percent','fixed','freeShipping') and value >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'campaigns_chk') then
    alter table campaigns add constraint campaigns_chk check (channel in ('email','whatsapp') and status in ('draft','sent'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_chk') then
    alter table notifications add constraint notifications_chk check (kind in ('info','warning','danger'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'plan_payments_chk') then
    alter table plan_payments add constraint plan_payments_chk check (
      plan in ('growth','pro') and billing in ('monthly','yearly') and method in ('wallet','instapay')
      and status in ('pending','approved','rejected') and amount >= 0 and char_length(ref) between 3 and 64);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'platform_settings_singleton') then
    alter table platform_settings add constraint platform_settings_singleton check (id = 1);
  end if;
end $$;

-- ── helpers ──
create or replace function app_uid() returns uuid language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

create or replace function is_platform_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_owners po where po.user_id = app_uid() and po.is_active)
$$;

-- ── RLS on every table ──
do $$
declare t text;
begin
  foreach t in array array['profiles','merchants','stores','products','orders','discounts','campaigns',
    'notifications','plan_payments','platform_owners','platform_settings','audit_logs','security_logs',
    'auth_users','sessions','rate_limits','password_resets','bly_schema_migrations']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

drop policy if exists p_profiles_self on profiles;
create policy p_profiles_self on profiles for all to app_client
  using (id = app_uid() or is_platform_owner()) with check (id = app_uid());

drop policy if exists p_merchants_sel on merchants;
create policy p_merchants_sel on merchants for select to app_client
  using (id = app_uid() or is_platform_owner());
drop policy if exists p_merchants_upd on merchants;
create policy p_merchants_upd on merchants for update to app_client
  using (id = app_uid() or is_platform_owner()) with check (id = app_uid() or is_platform_owner());

drop policy if exists p_stores_own on stores;
create policy p_stores_own on stores for all to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid() or is_platform_owner());

drop policy if exists p_products_own on products;
create policy p_products_own on products for all to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid() or is_platform_owner());
drop policy if exists p_products_public on products;
create policy p_products_public on products for select to app_client using (status = 'active');

drop policy if exists p_orders_sel on orders;
create policy p_orders_sel on orders for select to app_client
  using (merchant_id = app_uid() or is_platform_owner());
drop policy if exists p_orders_upd on orders;
create policy p_orders_upd on orders for update to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid() or is_platform_owner());

drop policy if exists p_discounts_own on discounts;
create policy p_discounts_own on discounts for all to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid() or is_platform_owner());

drop policy if exists p_campaigns_own on campaigns;
create policy p_campaigns_own on campaigns for all to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid() or is_platform_owner());

drop policy if exists p_notifications_own on notifications;
create policy p_notifications_own on notifications for all to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid() or is_platform_owner());

drop policy if exists p_pp_sel on plan_payments;
create policy p_pp_sel on plan_payments for select to app_client
  using (merchant_id = app_uid() or is_platform_owner());
drop policy if exists p_pp_ins on plan_payments;
create policy p_pp_ins on plan_payments for insert to app_client
  with check (merchant_id = app_uid() and status = 'pending');
drop policy if exists p_pp_upd on plan_payments;
create policy p_pp_upd on plan_payments for update to app_client
  using (is_platform_owner()) with check (is_platform_owner());

drop policy if exists p_owners_self on platform_owners;
create policy p_owners_self on platform_owners for select to app_client using (user_id = app_uid());

drop policy if exists p_settings_sel on platform_settings;
create policy p_settings_sel on platform_settings for select to app_client using (is_platform_owner());

drop policy if exists p_audit_sel on audit_logs;
create policy p_audit_sel on audit_logs for select to app_client using (is_platform_owner());
drop policy if exists p_sec_sel on security_logs;
create policy p_sec_sel on security_logs for select to app_client using (is_platform_owner());

-- ── guard triggers: merchants (plan/suspension) + orders (financial columns) ──
-- NOTE: intentionally NOT security definer, so current_user is the real caller role.
create or replace function guard_merchant_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'app_client' and not is_platform_owner() then
    if new.plan is distinct from old.plan
      or new.suspended is distinct from old.suspended
      or new.sub_status is distinct from old.sub_status
      or new.plan_expires_at is distinct from old.plan_expires_at
      or new.plan_started_at is distinct from old.plan_started_at
      or new.billing is distinct from old.billing
      or new.id is distinct from old.id then
      raise exception 'not allowed: plan/subscription fields are owner-managed';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_merchant on merchants;
create trigger trg_guard_merchant before update on merchants
for each row execute function guard_merchant_update();

create or replace function guard_order_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'app_client' and not is_platform_owner() then
    if new.subtotal is distinct from old.subtotal or new.total is distinct from old.total
      or new.discount is distinct from old.discount or new.shipping is distinct from old.shipping
      or new.items is distinct from old.items or new.customer is distinct from old.customer
      or new.tracking_code is distinct from old.tracking_code or new.merchant_id is distinct from old.merchant_id
      or new.payment is distinct from old.payment or new.receipt_url is distinct from old.receipt_url
      or new.payment_ref is distinct from old.payment_ref then
      raise exception 'not allowed: financial columns are immutable';
    end if;
    if new.payment_status not in ('paid','unpaid','pending_review','refunded') then
      raise exception 'invalid payment_status';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_order on orders;
create trigger trg_guard_order before update on orders
for each row execute function guard_order_update();

create or replace function guard_append_only() returns trigger
language plpgsql as $$ begin raise exception 'append-only table'; end $$;
drop trigger if exists trg_audit_append on audit_logs;
create trigger trg_audit_append before update or delete on audit_logs
for each row execute function guard_append_only();
drop trigger if exists trg_sec_append on security_logs;
create trigger trg_sec_append before update or delete on security_logs
for each row execute function guard_append_only();

-- ── public, safe storefront view (no emails / phones / secrets) ──
create or replace view public_stores as
  select m.store_slug as slug, m.store_name, m.suspended, m.plan, s.site_published, s.published_at,
    jsonb_build_object(
      'currency', coalesce(s.settings->>'currency','EGP'),
      'shippingFee', coalesce(s.settings->'shippingFee','0'::jsonb),
      'freeShippingThreshold', coalesce(s.settings->'freeShippingThreshold','0'::jsonb),
      'codFee', coalesce(s.settings->'codFee','0'::jsonb),
      'payments', coalesce(s.settings->'paymentsPublic','{}'::jsonb)
    ) as settings
  from merchants m join stores s on s.merchant_id = m.id
  where m.onboarded and s.site_published is not null;
grant select on public_stores to app_client;

create or replace view public_products as
  select p.id, m.store_slug as slug, p.name, p.description, p.price, p.compare_at, p.stock, p.image,
         p.category, p.collection, p.colors, p.sizes, p.badge, p.sold, p.created_at
  from products p join merchants m on m.id = p.merchant_id
  where p.status = 'active' and not m.suspended and m.onboarded
    and exists (select 1 from stores s where s.merchant_id = m.id and s.site_published is not null);
grant select on public_products to app_client;

create or replace view public_platform_settings as
  select data->'public' as data from platform_settings where id = 1;
grant select on public_platform_settings to app_client;

-- ── rate limiting (IP + action) ──
create or replace function rl_hit(p_key text, p_limit int, p_window int, p_block int default 0)
returns boolean language plpgsql security definer set search_path = public as $$
declare r rate_limits%rowtype;
begin
  insert into rate_limits(key, hits, window_start) values (p_key, 0, now()) on conflict (key) do nothing;
  select * into r from rate_limits where key = p_key for update;
  if r.blocked_until is not null and r.blocked_until > now() then return false; end if;
  if r.window_start < now() - make_interval(secs => p_window) then
    update rate_limits set hits = 1, window_start = now(), blocked_until = null where key = p_key;
    return true;
  end if;
  if r.hits + 1 > p_limit then
    update rate_limits set hits = r.hits + 1,
      blocked_until = case when p_block > 0 then now() + make_interval(secs => p_block) else null end
      where key = p_key;
    return false;
  end if;
  update rate_limits set hits = r.hits + 1 where key = p_key;
  return true;
end $$;

-- ── RPC 1: place_order (stock, pricing, shipping, discount — all server-side) ──
create or replace function place_order(
  p_slug text, p_customer jsonb, p_items jsonb, p_payment text,
  p_note text default null, p_code text default null, p_ref text default null,
  p_receipt text default null, p_ip text default 'unknown')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  m record; st record; it jsonb; p record; qty int; line numeric;
  subtotal numeric := 0; ship numeric := 0; disc numeric := 0; total numeric := 0;
  items_out jsonb := '[]'::jsonb; d record; code text; pay_status text; oid bigint; initials text;
  threshold numeric; fee numeric; codfee numeric;
begin
  if not rl_hit('order:' || p_ip || ':' || p_slug, 8, 600, 600) then
    raise exception 'rate_limited';
  end if;
  select * into m from merchants where store_slug = p_slug;
  if not found then raise exception 'store_not_found'; end if;
  if m.suspended then raise exception 'store_suspended'; end if;
  select * into st from stores where merchant_id = m.id;
  if not m.onboarded or st.site_published is null then raise exception 'store_not_found'; end if;

  if p_payment not in ('cod','wallet','instapay') or not coalesce((st.settings->'paymentsPublic'->>p_payment)::boolean, p_payment = 'cod') then
    raise exception 'payment_not_supported';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty_cart'; end if;
  if coalesce(p_customer->>'name','') = '' or char_length(regexp_replace(coalesce(p_customer->>'phone',''), '[^0-9]', '', 'g')) not between 8 and 20 then raise exception 'missing_customer'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into p from products
      where id = (it->>'productId')::uuid and merchant_id = m.id and status = 'active' for update;
    if found then
      qty := greatest(1, least(coalesce((it->>'qty')::int, 1), least(99, p.stock)));
      if p.stock > 0 then
        line := p.price * qty;
        subtotal := subtotal + line;
        items_out := items_out || jsonb_build_object('productId', p.id, 'name', p.name, 'qty', qty,
          'price', p.price, 'image', p.image);
        update products set stock = stock - qty, sold = sold + qty where id = p.id;
      end if;
    end if;
  end loop;
  if jsonb_array_length(items_out) = 0 then raise exception 'no_available_items'; end if;

  threshold := coalesce((st.settings->>'freeShippingThreshold')::numeric, 0);
  fee := coalesce((st.settings->>'shippingFee')::numeric, 0);
  codfee := coalesce((st.settings->>'codFee')::numeric, 0);
  ship := case when threshold > 0 and subtotal >= threshold then 0 else fee end;
  if p_payment = 'cod' then ship := ship + codfee; end if;

  if coalesce(p_code,'') <> '' then
    select * into d from discounts dc where dc.merchant_id = m.id and dc.code = upper(p_code) and dc.active
      and (dc.starts_at is null or dc.starts_at <= now()) and (dc.expires_at is null or dc.expires_at > now())
      and (dc.max_uses is null or dc.uses < dc.max_uses) and dc.min_order <= subtotal for update;
    if found then
      if d.once_per_customer and exists (select 1 from orders where merchant_id = m.id
        and regexp_replace(customer->>'phone', '[^0-9]', '', 'g') = regexp_replace(p_customer->>'phone', '[^0-9]', '', 'g') and history @> jsonb_build_array(jsonb_build_object('discount', d.code))) then
        raise exception 'discount_already_used';
      end if;
      if d.type = 'percent' then
        disc := round(subtotal * d.value / 100.0, 2);
        if d.max_discount is not null then disc := least(disc, d.max_discount); end if;
      elsif d.type = 'fixed' then disc := least(d.value, subtotal);
      else ship := 0; end if;
      update discounts set uses = uses + 1 where id = d.id;
    end if;
  end if;

  total := greatest(subtotal - disc, 0) + ship;
  initials := upper(coalesce(substring(regexp_replace(m.store_name, '[^a-zA-Z]', '', 'g') from 1 for 2), 'BL'));
  if char_length(initials) < 2 then initials := 'BL'; end if;
  code := initials || '-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 5));
  pay_status := case when p_payment in ('wallet','instapay')
    and (coalesce(p_ref,'') <> '' or coalesce(p_receipt,'') <> '') then 'pending_review' else 'unpaid' end;

  insert into orders(merchant_id, tracking_code, customer, items, subtotal, discount, shipping, total,
    status, payment, payment_status, payment_ref, receipt_url, note, history)
  values (m.id, code,
    jsonb_build_object('name', left(p_customer->>'name', 80), 'email', left(coalesce(p_customer->>'email',''), 120),
      'phone', left(p_customer->>'phone', 20), 'city', left(coalesce(p_customer->>'city',''), 60),
      'address', left(coalesce(p_customer->>'address',''), 200)),
    items_out, subtotal, disc, ship, total, 'New', p_payment, pay_status,
    left(nullif(p_ref,''), 64), left(nullif(p_receipt,''), 500), left(coalesce(p_note,''), 500),
    jsonb_build_array(jsonb_build_object('at', now(), 'label', 'Order placed', 'discount', upper(coalesce(p_code, '')))))
  returning id into oid;

  insert into notifications(merchant_id, kind, title, text)
  values (m.id, 'info', 'New order ' || code, 'Total ' || total::text);

  return jsonb_build_object('id', oid, 'tracking_code', code, 'total', total);
end $$;
revoke all on function place_order(text,jsonb,jsonb,text,text,text,text,text,text) from public;
grant execute on function place_order(text,jsonb,jsonb,text,text,text,text,text,text) to app_client;

-- Safe anonymous discount preview: never expose merchant/customer tables.
create or replace function check_discount(p_slug text, p_code text, p_subtotal numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d record; amount numeric := 0;
begin
  select dc.* into d from discounts dc join merchants m on m.id = dc.merchant_id
    join stores st on st.merchant_id = m.id
    where m.store_slug = p_slug and not m.suspended and m.onboarded and st.site_published is not null
      and dc.code = upper(p_code) and dc.active and dc.min_order <= greatest(p_subtotal, 0)
      and (dc.starts_at is null or dc.starts_at <= now()) and (dc.expires_at is null or dc.expires_at > now())
      and (dc.max_uses is null or dc.uses < dc.max_uses) limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'Code not valid for this order.'); end if;
  if d.type = 'percent' then
    amount := round(greatest(p_subtotal, 0) * least(d.value, 100) / 100, 2);
    if d.max_discount is not null then amount := least(amount, d.max_discount); end if;
  elsif d.type = 'fixed' then amount := least(d.value, greatest(p_subtotal, 0)); end if;
  return jsonb_build_object('ok', true, 'type', d.type, 'amount', amount);
end $$;
revoke all on function check_discount(text,text,numeric) from public;
grant execute on function check_discount(text,text,numeric) to app_client;

-- ── RPC 2: track_order (code + last-6 phone digits, minimal projection) ──
create or replace function track_order(p_slug text, p_code text, p_phone text, p_ip text default 'unknown')
returns jsonb language plpgsql security definer set search_path = public as $$
declare o record; m record;
begin
  if not rl_hit('track:' || p_ip, 20, 600, 600) then raise exception 'rate_limited'; end if;
  select * into m from merchants where store_slug = p_slug;
  if not found then raise exception 'store_not_found'; end if;
  select * into o from orders where merchant_id = m.id and upper(tracking_code) = upper(trim(p_code));
  if not found then raise exception 'not_found'; end if;
  if right(regexp_replace(coalesce(o.customer->>'phone',''), '[^0-9]', '', 'g'), 6)
     <> right(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), 6)
     or char_length(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g')) < 6 then
    raise exception 'not_found';
  end if;
  return jsonb_build_object('id', o.id, 'tracking_code', o.tracking_code, 'status', o.status,
    'payment', o.payment, 'payment_status', o.payment_status, 'carrier', o.carrier,
    'carrier_tracking', o.carrier_tracking, 'items', o.items, 'total', o.total,
    'created_at', o.created_at, 'history', o.history, 'customer_name', o.customer->>'name');
end $$;
revoke all on function track_order(text,text,text,text) from public;
grant execute on function track_order(text,text,text,text) to app_client;

-- ── RPC 3: approve_plan_payment (owner only) ──
create or replace function approve_plan_payment(p_id uuid, p_approve boolean, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pp record; m record; base timestamptz; months int;
begin
  if not is_platform_owner() then raise exception 'forbidden'; end if;
  select * into pp from plan_payments where id = p_id for update;
  if not found or pp.status <> 'pending' then raise exception 'invalid_request'; end if;
  select * into m from merchants where id = pp.merchant_id;
  if p_approve then
    months := case when pp.billing = 'yearly' then 12 else 1 end;
    base := greatest(coalesce(m.plan_expires_at, now()), now());
    update merchants set plan = pp.plan, billing = pp.billing, plan_started_at = coalesce(plan_started_at, now()),
      plan_expires_at = base + make_interval(months => months), sub_status = 'active',
      suspended = false, suspended_reason = null where id = m.id;
    update plan_payments set status = 'approved', note = p_note, decided_at = now(), decided_by = app_uid() where id = p_id;
    insert into notifications(merchant_id, kind, title, text)
      values (m.id, 'info', 'Payment approved', 'Your ' || pp.plan || ' plan is active.');
  else
    update plan_payments set status = 'rejected', note = p_note, decided_at = now(), decided_by = app_uid() where id = p_id;
    insert into notifications(merchant_id, kind, title, text)
      values (m.id, 'warning', 'Payment rejected', coalesce(p_note, 'Please check your transfer reference.'));
  end if;
  insert into audit_logs(actor, action, target_type, target_id, metadata)
    values (app_uid(), case when p_approve then 'plan_payment.approve' else 'plan_payment.reject' end,
      'plan_payment', p_id::text, jsonb_build_object('merchant', m.id, 'plan', pp.plan));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function approve_plan_payment(uuid, boolean, text) from public;
grant execute on function approve_plan_payment(uuid, boolean, text) to app_client;

-- ── RPC 4: subscription_sweep (pg_cron daily) ──
create or replace function subscription_sweep() returns jsonb
language plpgsql security definer set search_path = public as $$
declare s jsonb; grace int; warned int := 0; graced int := 0; susp int := 0;
begin
  select data into s from platform_settings where id = 1;
  grace := coalesce((s->>'graceDays')::int, 5);
  with w as (
    update merchants set sub_status = 'active' where plan <> 'free' and sub_status = 'active'
      and plan_expires_at between now() and now() + interval '3 days' returning id)
  select count(*) into warned from w;
  insert into notifications(merchant_id, kind, title, text)
    select id, 'warning', 'Subscription expiring soon', 'Renew to keep your plan features.' from merchants
    where plan <> 'free' and plan_expires_at between now() and now() + interval '3 days';
  with g as (
    update merchants set sub_status = 'grace' where plan <> 'free' and plan_expires_at < now()
      and plan_expires_at > now() - make_interval(days => grace) and sub_status <> 'grace' returning id)
  select count(*) into graced from g;
  with x as (
    update merchants set sub_status = 'expired', plan = 'free', suspended_reason = 'subscription_expired'
      where plan <> 'free' and plan_expires_at < now() - make_interval(days => grace) returning id)
  select count(*) into susp from x;
  insert into audit_logs(actor, action, target_type, metadata)
    values (null, 'subscription.sweep', 'system',
      jsonb_build_object('warned', warned, 'grace', graced, 'expired', susp));
  return jsonb_build_object('warned', warned, 'grace', graced, 'expired', susp);
end $$;

do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('bly-subscription-sweep', '0 3 * * *', 'select subscription_sweep()');
exception when others then null; end $$;

-- ── storage: private per-merchant media bucket + public copies ──
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'media_chk') then
    alter table media add constraint media_chk check (
      kind in ('logo','product','receipt','favicon')
      and mime in ('image/jpeg','image/png','image/webp','image/gif','image/avif')
      and bytes > 0 and bytes <= 5242880);
  end if;
end $$;
alter table media enable row level security;
alter table media force row level security;
drop policy if exists p_media_own on media;
create policy p_media_own on media for all to app_client
  using (merchant_id = app_uid() or is_platform_owner()) with check (merchant_id = app_uid());
drop policy if exists p_media_public on media;
create policy p_media_public on media for select to app_client using (is_public);
grant select, insert, update, delete on media to app_client;

-- ── seed platform settings ──
insert into platform_settings(id, data) values (1, jsonb_build_object(
  'walletNumber', '', 'instapayHandle', '', 'graceDays', 5,
  'prices', jsonb_build_object('growth', jsonb_build_object('monthly', 299, 'yearly', 2870),
                               'pro', jsonb_build_object('monthly', 599, 'yearly', 5750)),
  'public', jsonb_build_object('brand', 'BLY', 'supportEmail', 'support@brandly.store')))
on conflict (id) do nothing;

revoke all on function subscription_sweep() from public;
revoke all on function rl_hit(text,integer,integer,integer) from public;
-- Supabase may install default REST grants: these tables are accessed only by this server.
do $$ declare r text; t text; begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      foreach t in array array['auth_users','sessions','password_resets','bly_schema_migrations',
        'profiles','merchants','stores','products','orders','discounts','campaigns','notifications',
        'plan_payments','platform_owners','platform_settings','audit_logs','security_logs','media','rate_limits',
        'public_stores','public_products','public_platform_settings'] loop
        execute format('revoke all on %I from %I', t, r);
      end loop;
    end if;
  end loop;
end $$;
`;
