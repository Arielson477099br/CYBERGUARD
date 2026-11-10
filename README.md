# CYBERGUARD — Plataforma Inteligente de Cibersegurança

Aplicação web para registro, acompanhamento e consulta de incidentes de segurança digital. Esta versão utiliza **Supabase Auth + PostgreSQL + Row Level Security (RLS)** para autenticação e persistência dos dados.

## Stack

- HTML5, CSS3 e JavaScript ES Modules
- Vite para desenvolvimento e build
- Supabase JavaScript SDK (`@supabase/supabase-js`)
- Supabase Auth para autenticação
- PostgreSQL com políticas RLS para autorização por linha

> O navegador usa somente a chave pública `anon`/publishable do Supabase. **Nunca** inclua a `service_role` key no frontend, no `.env` do projeto web ou no GitHub.

## Estrutura

```text
CYBERGUARD_SUPABASE/
├── assets/
│   └── favicon.svg
├── js/
│   ├── supabase.js       # inicialização do client
│   ├── store.js          # camada de acesso e CRUD
│   ├── auth.js           # login
│   ├── register.js       # cadastro
│   ├── dashboard.js
│   ├── incidents.js
│   ├── threats.js
│   ├── reports.js
│   └── audit.js
├── supabase/
│   └── schema.sql        # tabelas, índices, trigger, seed e RLS
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
├── login.html
├── cadastro.html
├── incidentes.html
├── ameacas.html
├── relatorios.html
├── auditoria.html
├── style.css
└── responsive.css
```

## Pré-requisitos

- Node.js 20.19+ ou 22.12+ (versão LTS recomendada)
- npm
- Projeto criado no [Supabase](https://supabase.com/dashboard)

## Configuração do Supabase

1. Crie um projeto no Supabase Dashboard.
2. Abra **SQL Editor** e execute o conteúdo completo de [`supabase/schema.sql`](supabase/schema.sql).
3. Em **Project Settings → API**, copie o Project URL e a chave pública (`anon` ou publishable).
4. Na raiz do projeto, crie um arquivo `.env` baseado em `.env.example`:

   ```dotenv
   SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
   ```

5. Em **Authentication → URL Configuration**, configure a URL local de desenvolvimento (`http://127.0.0.1:5173`) e as URLs de produção/redirect apropriadas.
6. Em **Authentication → Providers → Email**, ajuste confirmação de e-mail e requisitos de senha conforme a política do projeto.

A função de trigger cria um perfil com papel `LEITURA` ao cadastrar usuário. O cliente não pode atribuir a si mesmo os papéis `ADMIN` ou `ANALISTA`. Para promover uma conta, primeiro identifique o UUID em **Authentication → Users** e execute no SQL Editor, somente por um administrador autorizado:

```sql
update public.profiles
set perfil = 'ADMIN'
where id = 'UUID_DO_USUARIO';
```

Ajuste `ADMIN` para `ANALISTA` quando apropriado. Não conceda privilégios elevados a usuários não confiáveis.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço informado pelo Vite (normalmente `http://127.0.0.1:5173`). Para validar o build de produção:

```bash
npm run build
npm run preview
```

O diretório `dist/` é o artefato de build e não deve ser versionado.

## Recursos

- Login, cadastro e encerramento de sessão com Supabase Auth.
- Dashboard com indicadores e distribuição dos incidentes.
- Consulta, filtragem, criação, mudança de status e arquivamento de incidentes.
- Catálogo de tipos de ameaça.
- Exportação de relatórios em CSV.
- Trilha de auditoria para eventos registrados.
- Controle de acesso por perfil e políticas PostgreSQL RLS.

## Segurança e limitações operacionais

- A autorização real é aplicada no PostgreSQL por RLS; esconder botões na interface não é controle de segurança.
- A chave pública do Supabase é feita para uso no cliente. O acesso aos dados depende das políticas RLS.
- A chave `service_role` ignora RLS e deve permanecer exclusivamente em ambiente de servidor seguro.
- Para produção, configure domínio HTTPS, Auth redirect URLs, monitoramento, backup/retention e revisão de políticas antes de disponibilizar dados reais.
- A trilha de auditoria do frontend registra eventos básicos; para auditoria inviolável ou eventos administrativos, implemente funções/triggers no banco e controles server-side adicionais.
- As policies não substituem revisão de permissões: teste com contas `LEITURA`, `ANALISTA` e `ADMIN` antes do deploy.
- Este repositório não contém credenciais reais nem usuários de demonstração.

## Publicação no GitHub

```bash
git init
git add .
git commit -m "feat: migrate CYBERGUARD to Supabase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/CYBERGUARD.git
git push -u origin main
```

Antes de enviar, confirme que `.env` não está staged:

```bash
git status --short
```

No GitHub, não publique credenciais, dumps de banco, dados de incidentes ou arquivos de configuração privados.

## Contribuição

1. Crie uma branch (`git checkout -b feat/minha-melhoria`).
2. Faça alterações pequenas e teste os fluxos de autenticação e RLS.
3. Execute `npm run build`.
4. Abra um Pull Request descrevendo a mudança, o impacto no banco e os testes realizados.
5. Para mudanças de schema, inclua uma migração SQL revisável e atualize esta documentação.

## Licença

Defina a licença do projeto antes de aceitar contribuições externas.
