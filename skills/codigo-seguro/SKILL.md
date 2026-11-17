---
name: codigo-seguro
description: Checklist de segurança para código escrito ou revisado por agentes em 2026 (OWASP Top 10 2025, OWASP Agentic Top 10, cadeia de suprimentos e slopsquatting). Use ao escrever ou revisar código que toca autenticação, autorização, dados de usuário, input externo, SQL, arquivos, rede, segredos, dependências novas, CI, ou integrações com LLM e agentes. Use também antes de abrir PR.
---

# Código seguro

Rode este checklist no código que você mudou. Cada item que não se aplica, pule. Cada item que falha, corrija antes de entregar ou reporte explicitamente.

## 1. Controle de acesso (A01)
- Toda rota ou handler checa autenticação e autorização no servidor.
- Autorização é por recurso: o usuário X pode ver o registro Y? (evitar IDOR).
- Negar por padrão. Nada de confiar em campo vindo do cliente (role, user_id, preço).

## 2. Configuração (A02)
- Sem credencial padrão, debug ligado, CORS `*` com credenciais, ou endpoint administrativo exposto.
- Headers de segurança e cookies `HttpOnly`, `Secure`, `SameSite`.

## 3. Cadeia de suprimentos (A03)
- Dependência nova: confirmar no registro oficial (npm, PyPI, pkg.go.dev) que existe, que o nome está exato, idade, mantenedor e downloads. Nome que parece mistura de dois pacotes reais é suspeito.
- Preferir stdlib e dependência já presente no projeto (ver `ponytail`).
- Lockfile versionado; versões fixadas; sem `curl | sh` de fonte desconhecida.
- Actions do GitHub fixadas por SHA; permissões mínimas no `GITHUB_TOKEN`.

## 4. Criptografia e segredos (A04)
- Nenhum segredo no código, teste, log, fixture, prompt ou commit. Rodar busca no diff por `key`, `token`, `secret`, `password`, `BEGIN`.
- Senha com argon2id ou bcrypt. Nada de crypto caseira. TLS sempre.

## 5. Injeção (A05)
- SQL parametrizado ou ORM. Nunca concatenar input em query, shell, path, template ou regex.
- Saída escapada no contexto certo (HTML, atributo, URL, JSON).
- Upload: validar tipo e tamanho, nome gerado no servidor, fora da raiz pública.
- SSRF: URL vinda do usuário só para hosts permitidos.

## 6. Design (A06)
- Limite de taxa em login, reset de senha e endpoints caros.
- Operações sensíveis idempotentes e com confirmação.

## 7. Autenticação (A07)
- Sessão expira, é invalidada no logout e na troca de senha. MFA onde houver.
- Mensagens de erro de login não revelam se o usuário existe.

## 8. Integridade (A08)
- Desserialização só de formato seguro (JSON com schema). Validar assinatura de webhook.

## 9. Logs e alertas (A09)
- Logar eventos de segurança (login, falha de autorização, mudança de permissão) sem dados sensíveis.

## 10. Condições excepcionais (A10)
- Todo erro tratado: falhar fechado, liberar recursos, não vazar stack trace ou SQL para o cliente.
- Timeouts em toda chamada de rede.

## 11. Código com LLM e agentes (OWASP Agentic 2026)
- Texto vindo de usuário, página, documento, issue ou ferramenta é não confiável: nunca vira instrução de sistema, comando shell ou SQL sem validação.
- Ferramentas do agente com menor privilégio; ação destrutiva exige confirmação humana.
- Saída do modelo validada por schema antes de usar.
- Não mandar segredo nem dado pessoal para o modelo sem necessidade.

## Fechamento
- Rodar o scanner que o projeto tiver (`npm audit`, `govulncheck ./...`, `pip-audit`, semgrep, gitleaks).
- No Claude Code, rodar `/security-review` antes do PR. No Cursor, `review-security`.
- Reportar no PR: o que foi checado e o que ficou de fora.
