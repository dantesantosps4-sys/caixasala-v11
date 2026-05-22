# CaixaSala — Sistema Financeiro Escolar

Sistema completo de controle financeiro para turma escolar, conectado ao Supabase.

## Stack

- **Frontend:** React 18 + Vite + React Router
- **Estilo:** CSS-in-JS (inline), dark mode nativo
- **Animações:** Framer Motion
- **Gráficos:** Recharts
- **Backend/DB:** Supabase (Auth + Postgres + Realtime + Storage)
- **PDF:** jsPDF
- **Notificações:** react-hot-toast

---

## Setup rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Rodar em desenvolvimento

```bash
npm run dev
# Abre em http://localhost:3000
```

### 3. Build para produção

```bash
npm run build
npm run preview
```

---

## Configuração Supabase

As credenciais já estão configuradas em `src/lib/supabase.js`:

```
URL:  https://rlpudoysvbzfmysfzkgk.supabase.co
KEY:  sb_publishable_c-OZm-N8nddYxuBJgzESRA_lnRHjyNJ
```

### SQL de setup (execute no SQL Editor do Supabase)

```sql
create table if not exists public.alunos (
  id bigserial primary key,
  nome text not null,
  created_at timestamptz default now()
);

create table if not exists public.movimentacoes (
  id bigserial primary key,
  tipo text not null check (tipo in ('entrada','saida')),
  valor numeric(10,2) not null,
  categoria text not null default 'geral',
  descricao text not null,
  data date not null,
  responsavel text not null default 'Secretária',
  created_at timestamptz default now()
);

create table if not exists public.cobrancas (
  id bigserial primary key,
  titulo text not null,
  valor numeric(10,2) not null,
  prazo date not null,
  descricao text,
  ativa boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.pagamentos (
  id bigserial primary key,
  aluno_id bigint references public.alunos(id) on delete cascade,
  cobranca_id bigint references public.cobrancas(id) on delete cascade,
  status text not null default 'pendente',
  valor numeric(10,2) not null,
  data_envio date not null default current_date,
  data_aprovacao date,
  comprovante_url text,
  created_at timestamptz default now()
);

alter table public.alunos        enable row level security;
alter table public.movimentacoes  enable row level security;
alter table public.cobrancas     enable row level security;
alter table public.pagamentos    enable row level security;

create policy "leitura_pub_alunos"  on public.alunos        for select using (true);
create policy "leitura_pub_movs"    on public.movimentacoes  for select using (true);
create policy "leitura_pub_cobs"    on public.cobrancas     for select using (true);
create policy "leitura_pub_pagtos"  on public.pagamentos    for select using (true);

create policy "escrita_auth_alunos" on public.alunos        for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "escrita_auth_movs"   on public.movimentacoes  for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "escrita_auth_cobs"   on public.cobrancas     for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "escrita_auth_pagtos" on public.pagamentos    for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
```

### Criar usuário secretária

No Supabase: **Authentication → Users → Add user**
- Email: `secretaria@turma3b.com`
- Senha: (escolha uma senha segura)

---

## Estrutura de arquivos

```
caixasala/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx              ← entrada React
    ├── App.jsx               ← rotas + estado global
    ├── lib/
    │   ├── supabase.js       ← cliente Supabase + helpers CRUD
    │   ├── pdf.js            ← gerador PDF real (jsPDF)
    │   └── utils.js          ← tokens de design, formatters
    └── components/
        ├── Login.jsx         ← tela de login (Supabase Auth)
        ├── Dashboard.jsx     ← página pública para alunos
        ├── Secretaria.jsx    ← painel admin protegido
        ├── Movimentacoes.jsx ← CRUD entradas/saídas
        └── Pagamentos.jsx    ← aprovação de pagamentos + carnês
```

## Rotas

| Rota          | Descrição                                    | Acesso        |
|---------------|----------------------------------------------|---------------|
| `/`           | Página pública — dashboard para alunos       | Todos         |
| `/login`      | Tela de login da secretária                  | Não autenticado |
| `/secretaria` | Painel administrativo completo               | Secretária autenticada |

## Funcionalidades

### Página Pública (`/`)
- Saldo, total arrecadado/gasto, inadimplentes em tempo real
- Gráficos de arrecadação mensal e gastos por categoria
- Histórico financeiro completo
- Lista de todos os alunos com status do carnê ativo
- Aluno pode clicar no nome → "Já realizei o pagamento"

### Painel Secretária (`/secretaria`)
- **Dashboard:** 6 KPIs + gráfico de caixa + donut de adimplência + ações rápidas
- **Caixa:** tabela completa com edição e exclusão + exportação CSV
- **Pagamentos:** criar carnês + fila de aprovação + histórico
- **Alunos:** busca, filtros, adicionar, excluir, ver histórico individual
- **Relatórios:** PDF real com jsPDF (histórico, pagamentos, inadimplentes)

## Deploy (Vercel)

```bash
npm i -g vercel
vercel deploy
```

Ou conecte o repositório no [vercel.com](https://vercel.com) e faça deploy automático.
