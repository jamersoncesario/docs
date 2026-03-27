-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'member',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CHAT CONVERSATIONS
-- ============================================================
create table public.conversations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null default 'Nova conversa',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Users manage own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users read own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users insert own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- DOCUMENTS (NF-e, extratos, contratos)
-- ============================================================
create table public.documents (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  file_name       text not null,
  file_path       text not null,
  file_type       text not null check (file_type in ('nfe', 'bank_statement', 'contract', 'other')),
  status          text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  extracted_data  jsonb,
  raw_text        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users manage own documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- ============================================================
-- POPs (Procedimentos Operacionais Padrão)
-- ============================================================
create table public.pops (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  file_path   text,
  content     text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pops enable row level security;

create policy "Authenticated users read pops"
  on public.pops for select
  to authenticated
  using (true);

create policy "Authenticated users insert pops"
  on public.pops for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users update pops"
  on public.pops for update
  to authenticated
  using (auth.uid() = created_by);

create policy "Authenticated users delete pops"
  on public.pops for delete
  to authenticated
  using (auth.uid() = created_by);
