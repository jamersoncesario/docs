-- Enable pgvector extension
create extension if not exists vector;

-- ============================================================
-- POP CHUNKS (for RAG)
-- ============================================================
create table public.pop_chunks (
  id          uuid primary key default uuid_generate_v4(),
  pop_id      uuid not null references public.pops(id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  embedding   vector(1536),
  created_at  timestamptz not null default now()
);

alter table public.pop_chunks enable row level security;

create policy "Authenticated users read pop_chunks"
  on public.pop_chunks for select
  to authenticated
  using (true);

create policy "Service role insert pop_chunks"
  on public.pop_chunks for insert
  to service_role
  with check (true);

-- IVFFlat index for approximate nearest neighbor search
create index on public.pop_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- SIMILARITY SEARCH FUNCTION
-- ============================================================
create or replace function match_pop_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count     int default 5
)
returns table (
  id          uuid,
  pop_id      uuid,
  pop_title   text,
  content     text,
  similarity  float
)
language sql stable as $$
  select
    pc.id,
    pc.pop_id,
    p.title as pop_title,
    pc.content,
    1 - (pc.embedding <=> query_embedding) as similarity
  from public.pop_chunks pc
  join public.pops p on p.id = pc.pop_id
  where 1 - (pc.embedding <=> query_embedding) > match_threshold
  order by pc.embedding <=> query_embedding
  limit match_count;
$$;
