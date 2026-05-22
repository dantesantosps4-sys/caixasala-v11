-- ═══════════════════════════════════════════════════════════════════════════
--  CaixaSala — SQL COMPLETO (Sistema de Saldo Devedor)
--  Execute no Supabase: SQL Editor → New query → Run
--  Idempotente: pode rodar múltiplas vezes
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Extensão UUID ────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 2. Tabela alunos (com saldo_devedor) ────────────────────────────────────
create table if not exists public.alunos (
  id            bigserial primary key,
  nome          text          not null,
  turma         text          not null default '2A',
  saldo_devedor numeric(10,2) not null default 0.00,
  ativo         boolean       not null default true,
  created_at    timestamptz   default now()
);
-- Adiciona coluna saldo_devedor se tabela já existia
alter table public.alunos add column if not exists saldo_devedor numeric(10,2) not null default 0.00;
alter table public.alunos add column if not exists turma   text    default '2A';
alter table public.alunos add column if not exists ativo   boolean default true;

create unique index if not exists alunos_nome_uq on public.alunos (nome);

-- ── 3. Tabela movimentacoes (caixa geral da turma) ──────────────────────────
create table if not exists public.movimentacoes (
  id          bigserial primary key,
  tipo        text          not null check (tipo in ('entrada','saida')),
  valor       numeric(10,2) not null,
  categoria   text          not null default 'geral',
  descricao   text          not null,
  data        date          not null,
  responsavel text          not null default 'Secretária',
  created_at  timestamptz   default now()
);

-- ── 4. Tabela movimentacoes_financeiras (caderneta por aluno) ───────────────
--
--  Cada linha representa:
--    tipo = 'debito'    → secretária adicionou dívida ao aluno
--    tipo = 'credito'   → pagamento aprovado; reduz saldo_devedor
--
--  Quando um comprovante é aprovado:
--    1. movimentacoes_financeiras recebe linha tipo='credito'
--    2. alunos.saldo_devedor -= valor
--    3. comprovantes.status   = 'aprovado'
--
create table if not exists public.movimentacoes_financeiras (
  id          bigserial primary key,
  aluno_id    bigint        not null references public.alunos(id) on delete cascade,
  tipo        text          not null check (tipo in ('debito','credito')),
  valor       numeric(10,2) not null,
  descricao   text          not null,
  origem      text          not null default 'manual'
                            check (origem in ('manual','comprovante')),
  referencia_id bigint,     -- id do comprovante que gerou o crédito (opcional)
  criado_por  text          not null default 'Secretária',
  created_at  timestamptz   default now()
);

create index if not exists idx_movfin_aluno on public.movimentacoes_financeiras (aluno_id);
create index if not exists idx_movfin_tipo  on public.movimentacoes_financeiras (tipo);

-- ── 5. Tabela comprovantes (upload do aluno) ─────────────────────────────────
--
--  Status:
--    aguardando → aluno enviou, aguarda secretária
--    aprovado   → secretária aprovou; crédito já aplicado
--    rejeitado  → secretária rejeitou
--
create table if not exists public.comprovantes (
  id               bigserial primary key,
  aluno_id         bigint        not null references public.alunos(id) on delete cascade,
  valor            numeric(10,2) not null,
  status           text          not null default 'aguardando'
                   check (status in ('aguardando','aprovado','rejeitado')),
  descricao        text,
  comprovante_url  text,
  storage_path     text,
  observacao_aluno text,
  motivo_recusa    text,
  enviado_em       timestamptz   default now(),
  analisado_em     timestamptz,
  created_at       timestamptz   default now()
);

create index if not exists idx_comp_aluno  on public.comprovantes (aluno_id);
create index if not exists idx_comp_status on public.comprovantes (status);

-- ── 6. RLS ──────────────────────────────────────────────────────────────────

-- alunos
alter table public.alunos enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where tablename='alunos' and policyname='rls_alunos_read') then
    create policy "rls_alunos_read" on public.alunos for select using (true); end if;
  if not exists(select 1 from pg_policies where tablename='alunos' and policyname='rls_alunos_auth') then
    create policy "rls_alunos_auth" on public.alunos for all
      using (auth.role()='authenticated') with check (auth.role()='authenticated'); end if;
end $$;

-- movimentacoes
alter table public.movimentacoes enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where tablename='movimentacoes' and policyname='rls_movs_read') then
    create policy "rls_movs_read" on public.movimentacoes for select using (true); end if;
  if not exists(select 1 from pg_policies where tablename='movimentacoes' and policyname='rls_movs_auth') then
    create policy "rls_movs_auth" on public.movimentacoes for all
      using (auth.role()='authenticated') with check (auth.role()='authenticated'); end if;
end $$;

-- movimentacoes_financeiras
alter table public.movimentacoes_financeiras enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where tablename='movimentacoes_financeiras' and policyname='rls_movfin_read') then
    create policy "rls_movfin_read" on public.movimentacoes_financeiras for select using (true); end if;
  if not exists(select 1 from pg_policies where tablename='movimentacoes_financeiras' and policyname='rls_movfin_auth') then
    create policy "rls_movfin_auth" on public.movimentacoes_financeiras for all
      using (auth.role()='authenticated') with check (auth.role()='authenticated'); end if;
end $$;

-- comprovantes
alter table public.comprovantes enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where tablename='comprovantes' and policyname='rls_comp_read') then
    create policy "rls_comp_read" on public.comprovantes for select using (true); end if;
  if not exists(select 1 from pg_policies where tablename='comprovantes' and policyname='rls_comp_insert') then
    create policy "rls_comp_insert" on public.comprovantes for insert with check (true); end if;
  if not exists(select 1 from pg_policies where tablename='comprovantes' and policyname='rls_comp_auth') then
    create policy "rls_comp_auth" on public.comprovantes for update
      using (auth.role()='authenticated') with check (auth.role()='authenticated'); end if;
end $$;

-- ── 7. Storage bucket comprovantes ──────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes','comprovantes',true,5242880,'{"image/jpeg","image/png","image/webp","image/gif","application/pdf"}')
on conflict (id) do nothing;

do $$ begin
  if not exists(select 1 from pg_policies where tablename='objects' and schemaname='storage' and policyname='storage_comp_upload') then
    create policy "storage_comp_upload" on storage.objects for insert with check (bucket_id='comprovantes'); end if;
  if not exists(select 1 from pg_policies where tablename='objects' and schemaname='storage' and policyname='storage_comp_read') then
    create policy "storage_comp_read"  on storage.objects for select using (bucket_id='comprovantes'); end if;
end $$;

-- ── 8. Inserir 44 alunos da Turma 2A ────────────────────────────────────────
insert into public.alunos (nome, turma, saldo_devedor) values
  ('ANA BEATRIZ RAMOS DE SOUZA',               '2A', 0),
  ('ANA GABRIELLY DE OLIVEIRA BARROS',          '2A', 0),
  ('ANA KELLEN CAVALCANTE OLIVEIRA',            '2A', 0),
  ('ANGELA NICOLE ARAUJO SILVA',                '2A', 0),
  ('ANTONIA ISNAELY DO NASCIMENTO BARBOSA',     '2A', 0),
  ('ANTONIA SUELLEN BARROS DE SOUSA',           '2A', 0),
  ('ANTONIO PAULO VITOR SILVA DE MELO',         '2A', 0),
  ('ANTONIO RAVI BARBOSA DE SOUSA',             '2A', 0),
  ('BENEDITO BENICIO PESSOA ALVES',             '2A', 0),
  ('BRUNA MARTINS BENEVINUTO',                  '2A', 0),
  ('CARLOS FILIPE ALVES SOARES',                '2A', 0),
  ('CARLOS GABRIEL FERNANDES DOS SANTOS',       '2A', 0),
  ('CAYLANNE COELHO DE SOUSA',                  '2A', 0),
  ('CLARA DE OLIVEIRA FURTADO',                 '2A', 0),
  ('DANIELE DA COSTA MACIEL',                   '2A', 0),
  ('DANTE SANTOS MELO',                         '2A', 0),
  ('EMANUELA ALVES DE SOUZA',                   '2A', 0),
  ('ENZO RENAN DE SOUSA SANTOS',                '2A', 0),
  ('FERNANDA PALOMA SILVA DOS SANTOS',          '2A', 0),
  ('FRANCISCA CIBELLE SOUSA COSTA',             '2A', 0),
  ('GABRIELLY VIEIRA DO NASCIMENTO',            '2A', 0),
  ('GIOVANNA DO NASCIMENTO MARTINS ALCANTARA',  '2A', 0),
  ('GUSTAVO PEQUENO VIEIRA',                    '2A', 0),
  ('IASMIN FERREIRA COSTA',                     '2A', 0),
  ('ISABELE DA SILVA NASCIMENTO',               '2A', 0),
  ('JOAO EZIO SILVA BARBOSA',                   '2A', 0),
  ('JULIA RIBEIRO DE MAGALHAES',                '2A', 0),
  ('LEORGENIS JESUS BEGUE TAMAYO',              '2A', 0),
  ('LETICIA NASCIMENTO SOUZA',                  '2A', 0),
  ('LORRANE DA SILVA ARAUJO',                   '2A', 0),
  ('LUAN RODRIGUES ALENCAR',                    '2A', 0),
  ('LUIZ AUGUSTO SOUSA DA SILVA',               '2A', 0),
  ('MARCUS ALBERTO TORRES DA SILVA FARIAS',     '2A', 0),
  ('MARIA ANGELINA DE MESQUITA',                '2A', 0),
  ('MARIA CLARA DE SOUSA ALVES',                '2A', 0),
  ('MARIA CLARA RODRIGUES DE SOUSA',            '2A', 0),
  ('MARIA PAULA MARINHO MESQUITA',              '2A', 0),
  ('MAYSA GOMES DE SOUSA',                      '2A', 0),
  ('NICOLAS ARAUJO SAMPAIO',                    '2A', 0),
  ('RICARDO DO NASCIMENTO SANTOS',              '2A', 0),
  ('RUAN CARLOS RODRIGUES BRAGA',               '2A', 0),
  ('STEFANY PENELLOPY DA SILVA',                '2A', 0),
  ('VINICIUS SOUZA NUNES',                      '2A', 0),
  ('YVANDERSON DA SILVA GRACIANO',              '2A', 0)
on conflict (nome) do update set turma = '2A', ativo = true;

-- ── 9. Verificação ──────────────────────────────────────────────────────────
select
  (select count(*) from public.alunos where turma='2A')        as alunos_2a,
  (select count(*) from public.movimentacoes_financeiras)       as mov_financeiras,
  (select count(*) from public.comprovantes)                    as comprovantes,
  (select coalesce(sum(saldo_devedor),0) from public.alunos)    as divida_total_turma;
