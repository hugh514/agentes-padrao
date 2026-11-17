#!/usr/bin/env bash
# Instala o padrão de agentes (regras + skills) em Claude Code, Codex, Cursor e ~/.agents.
# Idempotente: pode rodar de novo depois de um git pull.
set -euo pipefail

command -v node >/dev/null || { echo "precisa do node instalado"; exit 1; }

REPO="$(cd "$(dirname "$0")" && pwd)"
INI='<!-- padrao-agentes:inicio -->'
FIM='<!-- padrao-agentes:fim -->'

# Substitui (ou acrescenta) o bloco marcado em $1 com o conteúdo do arquivo $2.
bloco() {
  local alvo="$1" fonte="$2"
  mkdir -p "$(dirname "$alvo")"; touch "$alvo"
  awk -v ini="$INI" -v fim="$FIM" '$0==ini{s=1;next} $0==fim{s=0;next} !s' "$alvo" > "$alvo.tmp"
  { cat "$alvo.tmp"; echo "$INI"; cat "$fonte"; echo "$FIM"; } > "$alvo"
  rm "$alvo.tmp"
  echo "regras -> $alvo"
}

# Skills: Claude e Codex sempre; Cursor e ~/.agents só se já existirem.
for dir in "$HOME/.claude/skills" "$HOME/.codex/skills" "$HOME/.cursor/skills" "$HOME/.agents/skills"; do
  case "$dir" in *cursor*|*agents*) [ -d "$(dirname "$dir")" ] || continue ;; esac
  mkdir -p "$dir"
  for s in "$REPO"/skills/*/; do
    n="$(basename "$s")"; rm -rf "${dir:?}/$n"; cp -r "$s" "$dir/$n"
  done
  echo "skills -> $dir"
done

# Regras globais
bloco "$HOME/.claude/CLAUDE.md" "$REPO/AGENTS.md"

# Subagente revisor e hook do portao de entrega (Claude Code).
mkdir -p "$HOME/.claude/agents" "$HOME/.claude/hooks"
cp "$REPO"/agents/*.md "$HOME/.claude/agents/"
cp "$REPO/hooks/portao-entrega.js" "$HOME/.claude/hooks/"
echo "agentes e hooks -> $HOME/.claude"

# Hooks do Claude Code. SessionStart injeta a skill raiz (corpo do SKILL.md, sem o
# frontmatter) em toda sessao, retomada e compactacao. Stop cobra Playwright e revisor.
awk 'f>=2; /^---$/{f++}' "$REPO/skills/padrao-agentes/SKILL.md" > "$HOME/.claude/padrao-inicio.md"
node - "$HOME/.claude/settings.json" <<'JS'
const fs = require("fs"), f = process.argv[2];
const s = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
s.hooks ??= {};
for (const [evento, cmd] of [
  ["SessionStart", 'cat "$HOME/.claude/padrao-inicio.md"'],
  ["Stop", 'node "$HOME/.claude/hooks/portao-entrega.js"'],
]) {
  s.hooks[evento] ??= [];
  const tem = s.hooks[evento].some(g => (g.hooks || []).some(h => h.command === cmd));
  if (!tem) s.hooks[evento].push({ hooks: [{ type: "command", command: cmd }] });
  console.log("hook " + evento + " -> " + f);
}
fs.writeFileSync(f, JSON.stringify(s, null, 2) + "\n");
JS
bloco "$HOME/.codex/AGENTS.md" "$REPO/AGENTS.md"
if [ -d "$HOME/.cursor" ]; then
  mkdir -p "$HOME/.cursor/rules"
  { printf -- '---\ndescription: Padrão de agentes (skills, revisão, segurança)\nalwaysApply: true\n---\n\n'; cat "$REPO/AGENTS.md"; } > "$HOME/.cursor/rules/padrao-agentes.mdc"
  echo "regras -> $HOME/.cursor/rules/padrao-agentes.mdc"
fi
echo "ok"
