---
name: git-ptbr-commits-prs
description: >-
  Use when o usuário pedir commit, branch, push, PR/pull request, ou decidir
  o que sobe pro GitHub versus o que fica local — inclusive em Next.js com
  agentes (AGENTS.md, .cursor/rules, Spec Kit, specs/).
---

# Git pt-BR: branches, commits e PRs

Aplicar **sempre** que o usuário falar em commit, branch, push, PR ou “o que versionar”.

## Regras absolutas

1. **Idioma:** branches, mensagens de commit, títulos e corpos de PR em **pt-BR**.
2. **Sem Co-authored-by:** nunca incluir trailer `Co-authored-by` (nem de agente/Cursor).
3. **Sem menção a IA:** nenhum texto de commit/PR/branch cita IA, agente, Claude, Cursor, Copilot, GPT, LLM, Spec Kit, etc.
4. **Stage consciente:** sobe o que o **time precisa** para build, teste, deploy e contexto compartilhado — não “tudo que o agente gerou”.
5. **Conventional Commits** + **commits atômicos** (um propósito por commit).
6. **Branches:** `feat|fix|chore|refactor|docs|test|ci/<escopo-curto-kebab>`.
7. Só commit/PR quando o usuário pedir. Sem `--no-verify`. Sem force-push em main/master.
8. **Sem numeração de spec em texto público do Git:** branch, subject/body de commit e título/corpo de PR **nunca** usam `001`, `002`, `003-…`, `specs/00N-…`, “feature 004”, etc. Sempre descrever a **funcionalidade** (o que mudou no produto). Numeração Spec Kit fica só dentro de `specs/` e `.specify/` — não vaza para GitHub.

### Nomear pelo que foi feito (obrigatório)

Quem lê a branch/PR precisa entender a mudança **sem** abrir a pasta `specs/`.

| Evitar | Preferir |
|--------|----------|
| `feat/003-hardening-…` | `feat/hardening-ui-email-idempotency` |
| `feat/004-rbac-…` | `feat/rbac-grupos-permissoes` |
| `feat/002-gestao-usuarios` | `feat/gestao-usuarios` |
| commit `docs(specs): fecha 003` | `docs(specs): documenta trava de email e idempotency` |
| PR “Implementa feature 004” | PR “Grupos e permissões no lugar de papéis fixos” |

Escopo da branch = kebab **específico e legível** do momento (ex.: `ui-kit-modais`, `email-dominio-cliente`, `rbac-grupos-permissoes`), não o id do Spec Kit.

---

## Estrutura Next.js + IA (o que é o quê)

Separar **produto**, **contexto de agente compartilhado** e **lixo/sessão local**.

### Código da aplicação (sempre candidato a subir)

```text
src/
  app/                 # rotas finas (page/layout/route) — sem regra de negócio pesada
  features/<domínio>/  # UI + hooks + schemas + services do domínio
  components/          # UI compartilhada (ex.: ui/, layout/) — sem domínio
  server/              # server-only (auth, integrações); preferir import 'server-only'
  lib/ | shared/       # utilitários, clientes, helpers
  config/              # navegação, constantes de app
public/
e2e/ | **/*.test.ts    # testes do produto
supabase/ | prisma/    # schema/migrations versionáveis do produto
```

Convenções:

- `app/` orquestra; domínio vive em `features/`.
- Route groups `(auth)`, `(app)` para layouts/auth sem poluir URL.
- Não inventar pastas paralelas (`pages/`, `services/` soltos) se o repo já usa `features/` + `server/`.
- Seguir o `AGENTS.md` / constituição do repo quando existirem.

### Contexto de agente (compartilhado vs local)

| Artefato | Papel | GitHub? |
|----------|--------|---------|
| `AGENTS.md` | Padrão cross-tool (stack, comandos, limites) — curto | **Sim** (time) |
| `CLAUDE.md` | Ponte/`@AGENTS.md` ou extras Claude | **Sim** se o time usa |
| `.cursor/rules/*.mdc` | Regras do **projeto** (globs / alwaysApply) | **Sim** |
| `.cursor/commands/` Speckit do time | Fluxo Spec Kit compartilhado | **Sim** se já versionado no remote |
| `.specify/memory/constitution.md` + templates | Constituição Spec Kit do repo | **Sim** se o remote já tem `.specify/` |
| `specs/**` Spec Kit | Spec/plan/tasks da feature | **Só se** o remote já versiona `specs/` **ou** o usuário pedir; senão **não** misturar no PR de produto |
| `AGENTS.override.md`, `CLAUDE.local.md` | Override pessoal | **Não** |
| `.cursor/settings.json` | Preferência de IDE | **Não** |
| Rules/skills pessoais no projeto (ex. caveman, ui-ux-pro-max) | Preferência do dev | **Não** (gitignore) |
| `.agents/`, `.skills/`, `.claude/` runtime, `.roo/`, `.windsurf/` | Tooling local | **Não** |
| `HANDOFF*`, planos de sessão, prompts one-off | Rascunho de agente | **Não** |
| `.env`, `.env.local`, credenciais, `*.pem` | Segredos | **Nunca** |
| `.env.example` | Contrato de env sem segredo | **Sim** |
| Scripts `send-*-test.mjs` / one-off local | Smoke manual | **Não**, salvo pedido explícito |

Regra de ouro: **contexto que alinha o time → sobe; preferência/sessão/segredo → fica.**

Precedência no repo: se `git ls-files` já mostra `specs/` ou `.specify/`, trate como processo versionado (commits `docs(specs): …` separados do `feat`). Se só existe local/untracked e o usuário não pediu, **não stagear**.

### `.gitignore` mínimo para IA (sugerir se faltar)

```gitignore
# env
.env
.env.local
.env.*.local
!.env.example

# overrides pessoais de agente
AGENTS.override.md
CLAUDE.local.md
.cursor/settings.json

# tooling local (não compartilhado)
.agents/
.skills/
.roo/
.claude/
.windsurf/
.opencode/
skills-lock.json
```

Não gitignorar `AGENTS.md` nem `.cursor/rules/` do time — Cursor/Codex/Copilot leem isso no clone.

---

## Fluxo

### 1. Inventário

Em paralelo:

```bash
git status -sb
git diff --stat
git diff --cached --stat
git log -8 --oneline
git branch -vv
git ls-files AGENTS.md CLAUDE.md 'specs/*' '.cursor/rules/*' '.specify/*' 2>/dev/null | head -40
```

Agrupar por **feature/bug** independente. Cada grupo → branch própria (ou a pedida).

### 2. Filtrar o que sobe

Checklist antes do `git add`:

1. É necessário para **build / test / deploy** do produto? → stage.
2. É **contexto compartilhado** já adotado no remote (`AGENTS.md`, rules do time, Spec Kit versionado)? → stage em commit próprio se não for o mesmo propósito do feat.
3. É override pessoal, sessão, secret, one-off, pasta de tooling local? → **fora**.
4. `specs/` untracked sem precedente no remote e sem pedido? → **fora** deste PR.

Confirmar com `git status` / `git diff --cached` antes do commit.

### 3. Branch

Se várias features no working tree:

1. `git stash push -u -m "wip-separacao"` (se precisar isolar)
2. Base correta (`main`/`master` ou feature relacionada)
3. `git checkout -b feat/escopo-curto`
4. Restaurar **só** paths do grupo
5. Commits atômicos → push → PR
6. Repetir

Exemplos: `feat/login-com-google`, `fix/leads-filtro-status`, `feat/rbac-grupos-permissoes`.

**Proibido** no nome da branch: prefixo/número de spec (`001-`, `002-`, `003-hardening`, `feat/004-…`). O número pode existir na pasta `specs/00N-…` no disco; a branch espelha a **função**, não o índice.

### 4. Commits atômicos

```text
tipo(escopo): resumo imperativo ≤72 chars

[corpo opcional: por quê, 1–3 linhas]
```

Tipos: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`, `perf`.

Ordem típica: tipos/utils → server/lib → UI → testes. Specs versionadas: commit `docs(specs): …` **separado** do `feat`.

Subject/body descrevem a mudança funcional — **sem** “spec 003”, “US-004”, “fecha tasks T010”. Ex.: `feat(users): aplica idempotency nas mutacoes`, não `feat(003): …`.

Por commit:

1. `git add` **só** paths do pedaço
2. `git diff --cached` — validar que não entrou lixo (`.env`, HANDOFF, override local, `node_modules`)
3. Commit via HEREDOC **sem** `Co-authored-by`:

```bash
git commit -m "$(cat <<'EOF'
feat(auth): valida sessão no middleware

EOF
)"
```

Se o ambiente injetar `Co-authored-by` e o projeto reprovar isso, corrija os commits locais **antes do push** (por exemplo com `git rebase -i` ou `git commit --amend`) e só depois de confirmar com quem manda no repositório. Nunca reescreva histórico já publicado.

Não mencionar IA ao limpar o histórico.

### 5. Push e PR

Descrição do PR — **curta e simples**:

- 1 parágrafo ou no máx. 2–3 bullets
- Linguagem de produto, pt-BR
- **Sem** `## Resumo`, `## Como testar`, Task, checklist longo, jargão interno
- O que muda para usuário/ops — não arquitetura de agente

```bash
git push -u origin HEAD
# Se faltar autenticação: gh auth login
gh pr create --title "título pt-BR" --body "$(cat <<'EOF'
Frase curta do que muda.

EOF
)"
```

Se `gh pr edit` falhar por `read:org`, editar via REST `PATCH /repos/{owner}/{repo}/pulls/{number}`.

Sem rodapé “Made with …” / menção a ferramenta.

Base: `main` ou `master` conforme o repo (ex.: `master` em repositórios antigos, `main` nos novos), salvo indicação contrária.

### 6. Vários repositórios

Repetir o fluxo em cada repo citado, com branches/PRs alinhadas ao tema quando fizer sentido.

---

## Erros comuns

| Erro | Correção |
|------|----------|
| Stagear `specs/` + feat no mesmo commit “porque o agente criou” | Separar ou omitir specs se o remote não versiona / usuário não pediu |
| Gitignorar `AGENTS.md` / `.cursor/rules` do time | Versionar; overrides pessoais é que ficam fora |
| Subir `.cursor/settings.json` ou rule pessoal | Manter local / gitignore |
| Commitar `.env.local` “só desta vez” | Nunca; usar `.env.example` |
| PR com Test plan / menção a Cursor | Corpo curto de produto, sem IA |
| Um commit gigante misturando chore de agente + feat | Atômico: produto ≠ docs de spec ≠ chore de rules |
| Branch/PR/commit com `003`, `004`, `specs/002-…` no nome ou texto | Renomear/reescrever pela funcionalidade (`rbac-grupos-permissoes`, etc.) |

## Checklist rápido

- [ ] Branch descreve a **funcionalidade** (sem número de spec)
- [ ] Commits atômicos + Conventional Commits em pt-BR (sem “spec N” no subject)
- [ ] Sem `Co-authored-by` / sem menção a IA
- [ ] Stage só produto + contexto compartilhado do time (precedente no remote)
- [ ] Sem secrets, overrides locais, HANDOFF, tooling pessoal
- [ ] PR pt-BR, descrição curta, linguagem de produto (sem “feature 00N”)
- [ ] URL do PR devolvida ao usuário
