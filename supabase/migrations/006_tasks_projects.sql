-- ============================================================
-- PROJECTS (Projetos por área do escritório)
-- ============================================================
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  area        text not null check (area in ('fiscal', 'dp', 'contabil', 'societario', 'legal')),
  status      text not null default 'active'
                check (status in ('active', 'paused', 'done', 'cancelled')),
  client_id   uuid references public.clients(id) on delete set null,
  created_by  uuid references public.profiles(id),
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Authenticated users manage projects"
  on public.projects for all
  to authenticated
  using (true);

-- ============================================================
-- TASK TEMPLATES (Prazos fiscais pré-cadastrados)
-- ============================================================
create table public.task_templates (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  area        text not null check (area in ('fiscal', 'dp', 'contabil', 'societario', 'legal')),
  description text,
  recurrence  text not null check (recurrence in ('monthly', 'annual', 'sporadic')),
  due_day     integer,   -- dia do mês (recorrência mensal)
  due_month   integer,   -- mês (recorrência anual, 1-12)
  is_system   boolean not null default false
);

alter table public.task_templates enable row level security;

create policy "Authenticated users read task_templates"
  on public.task_templates for select
  to authenticated
  using (true);

create policy "Authenticated users manage custom task_templates"
  on public.task_templates for insert update delete
  to authenticated
  using (not is_system);

-- ============================================================
-- SEED: Prazos fiscais pré-cadastrados (obrigações principais)
-- ============================================================
insert into public.task_templates (title, area, description, recurrence, due_day, due_month, is_system) values
  -- Mensais
  ('DCTF Mensal',             'fiscal',   'Declaração de Débitos e Créditos Tributários Federais',         'monthly', 20,   null),
  ('EFD Contribuições',       'fiscal',   'Escrituração Fiscal Digital de PIS/COFINS',                     'monthly', 10,   null),
  ('EFD ICMS/IPI',            'fiscal',   'Escrituração Fiscal Digital de ICMS e IPI',                     'monthly', 15,   null),
  ('GIA (SP)',                 'fiscal',   'Guia de Informação e Apuração do ICMS - São Paulo',             'monthly', 16,   null),
  ('eSocial Periódico',       'dp',       'Folha de pagamento e eventos periódicos do eSocial',            'monthly', 7,    null),
  ('FGTS Digital',            'dp',       'Guia de recolhimento do FGTS via sistema digital',              'monthly', 7,    null),
  ('GPS (INSS)',               'dp',       'Guia da Previdência Social — recolhimento patronal',            'monthly', 20,   null),
  ('DAS Simples Nacional',    'fiscal',   'Documento de Arrecadação do Simples Nacional',                  'monthly', 20,   null),
  ('DARF IRPJ Estimativa',    'fiscal',   'Recolhimento mensal estimado do IRPJ (lucro real)',             'monthly', 30,   null),

  -- Anuais
  ('DIRF',                    'fiscal',   'Declaração do Imposto de Renda Retido na Fonte',                'annual',  null, 2),
  ('DEFIS',                   'fiscal',   'Declaração de Informações Socioeconômicas e Fiscais (Simples)', 'annual',  null, 3),
  ('DASN-Simei',              'fiscal',   'Declaração Anual do Simples Nacional para MEI',                 'annual',  null, 5),
  ('SPED Contábil (ECD)',     'contabil', 'Escrituração Contábil Digital',                                 'annual',  null, 6),
  ('ECF',                     'fiscal',   'Escrituração Contábil Fiscal — IRPJ/CSLL anual',               'annual',  null, 7),
  ('RAIS',                    'dp',       'Relação Anual de Informações Sociais',                          'annual',  null, 3),
  ('CAGED Anual',             'dp',       'Cadastro Geral de Empregados e Desempregados — revisão anual', 'annual',  null, 1),
  ('Balanço Patrimonial',     'contabil', 'Elaboração e fechamento do balanço anual',                     'annual',  null, 3),
  ('Assembleia Geral Ordinária', 'societario', 'AGO para aprovação das demonstrações contábeis',          'annual',  null, 4);

-- ============================================================
-- TASKS (Tarefas esporádicas e recorrentes)
-- ============================================================
create table public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  area            text not null check (area in ('fiscal', 'dp', 'contabil', 'societario', 'legal')),
  status          text not null default 'todo'
                    check (status in ('todo', 'in_progress', 'review', 'done')),
  priority        text not null default 'medium'
                    check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date        date,
  is_recurring    boolean not null default false,
  recurrence      text check (recurrence in ('monthly', 'annual')),
  template_id     uuid references public.task_templates(id) on delete set null,
  client_id       uuid references public.clients(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  assigned_to     uuid references public.profiles(id) on delete set null,
  created_by      uuid references public.profiles(id),
  notify_whatsapp boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Authenticated users manage tasks"
  on public.tasks for all
  to authenticated
  using (true);

create index on public.tasks (area, status);
create index on public.tasks (due_date) where status != 'done';
create index on public.tasks (assigned_to) where status != 'done';
