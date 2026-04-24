-- ============================================================
-- WHATSAPP SESSIONS (instâncias do Evolution API)
-- ============================================================
create table public.whatsapp_sessions (
  id                    uuid primary key default uuid_generate_v4(),
  evolution_instance_id text not null unique,
  phone_number          text,
  display_name          text,
  is_connected          boolean not null default false,
  qr_code               text,              -- base64 do QR code atual
  session_data          jsonb default '{}',
  created_by            uuid references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.whatsapp_sessions enable row level security;

create policy "Authenticated users manage whatsapp_sessions"
  on public.whatsapp_sessions for all
  to authenticated
  using (true);

-- ============================================================
-- WHATSAPP CONTACTS (contatos que enviaram mensagens)
-- ============================================================
create table public.whatsapp_contacts (
  id          uuid primary key default uuid_generate_v4(),
  jid         text not null unique,  -- ex: 5511999999999@s.whatsapp.net
  name        text,
  phone       text,
  client_id   uuid references public.clients(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.whatsapp_contacts enable row level security;

create policy "Authenticated users manage whatsapp_contacts"
  on public.whatsapp_contacts for all
  to authenticated
  using (true);

-- ============================================================
-- WHATSAPP MESSAGES (histórico de mensagens)
-- ============================================================
create table public.whatsapp_messages (
  id              uuid primary key default uuid_generate_v4(),
  message_id      text unique,               -- ID interno do WhatsApp
  contact_id      uuid references public.whatsapp_contacts(id) on delete cascade,
  direction       text not null check (direction in ('inbound', 'outbound')),
  content         text not null,
  message_type    text not null default 'text',
  ai_replied      boolean not null default false,
  sent_by         uuid references public.profiles(id),  -- null se foi IA
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.whatsapp_messages enable row level security;

create policy "Authenticated users manage whatsapp_messages"
  on public.whatsapp_messages for all
  to authenticated
  using (true);

-- Índice para busca por contato (carrega conversa)
create index on public.whatsapp_messages (contact_id, created_at desc);

-- Índice para contar não lidas
create index on public.whatsapp_messages (direction, read_at) where direction = 'inbound';
