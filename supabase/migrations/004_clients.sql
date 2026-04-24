-- ============================================================
-- CLIENTS (Clientes do escritório de contabilidade)
-- ============================================================
create table public.clients (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  cnpj        text,
  email       text,
  phone       text,
  regime      text check (regime in ('simples', 'presumido', 'real', 'mei', 'isento')),
  areas       text[] default '{}',  -- ['fiscal', 'dp', 'contabil', 'societario', 'legal']
  notes       text,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Authenticated users read clients"
  on public.clients for select
  to authenticated
  using (true);

create policy "Authenticated users insert clients"
  on public.clients for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users update clients"
  on public.clients for update
  to authenticated
  using (true);

create policy "Authenticated users delete clients"
  on public.clients for delete
  to authenticated
  using (true);
