// Teste do portao de entrega. Rodar: node hooks/portao-entrega.test.js
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const HOOK = path.join(__dirname, "portao-entrega.js");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portao-"));

const uso = (name, input, extra = {}) =>
  JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] }, ...extra });
const edit = (f) => uso("Edit", { file_path: f });
const revisor = uso("Agent", { subagent_type: "revisor-codigo", prompt: "x" });
const playwright = uso("Bash", { command: "npx playwright test tests/e2e/ordens.spec.ts" });

let n = 0;
function rodar(linhas, entrada = {}) {
  const t = path.join(dir, `t${n++}.jsonl`);
  fs.writeFileSync(t, linhas.join("\n") + "\n");
  const r = spawnSync("node", [HOOK], { input: JSON.stringify({ transcript_path: t, ...entrada }), encoding: "utf8" });
  assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}

// sem edicao de codigo: passa
assert.strictEqual(rodar([uso("Read", { file_path: "a.go" })]), null);

// so documentacao e memoria: passa
assert.strictEqual(rodar([edit("C:\\x\\README.md"), edit("/home/u/.claude/skills/x/SKILL.md")]), null);

// codigo editado sem revisor: bloqueia pedindo o revisor
let r = rodar([edit("internal/os/filtro.go")]);
assert.strictEqual(r.decision, "block");
assert.match(r.reason, /revisor-codigo/);
assert.doesNotMatch(r.reason, /Playwright/);

// codigo editado e revisado depois: passa
assert.strictEqual(rodar([edit("internal/os/filtro.go"), revisor]), null);

// edicao depois da revisao: bloqueia de novo
assert.strictEqual(rodar([edit("a.go"), revisor, edit("a.go")]).decision, "block");

// front editado e revisado, sem Playwright: bloqueia pedindo Playwright
r = rodar([edit("C:\\repo\\src\\components\\Filtro.tsx"), revisor]);
assert.strictEqual(r.decision, "block");
assert.match(r.reason, /Playwright/);
assert.doesNotMatch(r.reason, /revisor-codigo/);

// front editado, Playwright rodado e revisado: passa
assert.strictEqual(rodar([edit("src/app/page.tsx"), playwright, revisor]), null);

// Playwright via MCP tambem conta
assert.strictEqual(rodar([edit("src/app/estilo.css"), uso("mcp__playwright__browser_snapshot", {}), revisor]), null);

// spec de teste nao exige Playwright de novo, mas e codigo: exige revisor
r = rodar([edit("tests/e2e/ordens.spec.ts")]);
assert.match(r.reason, /revisor-codigo/);

// ja cobrado depois da ultima edicao: nao cobra de novo em toda parada
const cobrado = JSON.stringify({ type: "user", isMeta: true, message: { content: "Stop hook feedback:\nPORTAO DE ENTREGA (padrao-agentes):\n- ..." } });
assert.strictEqual(rodar([edit("a.go"), cobrado, uso("Read", { file_path: "b.go" })]), null);
// edicao nova depois da cobranca: cobra de novo
assert.strictEqual(rodar([edit("a.go"), cobrado, edit("a.go")]).decision, "block");
// texto do portao citado em resultado de ferramenta nao conta como cobranca
const citado = JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: "Stop hook feedback: PORTAO DE ENTREGA" }] } });
assert.strictEqual(rodar([edit("a.go"), citado]).decision, "block");

// rascunho em pasta temporaria ou scratchpad nao e entrega
assert.strictEqual(rodar([edit("C:\\Users\\u\\AppData\\Local\\Temp\\claude\\x\\scratchpad\\pagina.html"), edit("/tmp/sonda.py")]), null);

// pasta temp de projeto nao e rascunho
assert.match(rodar([edit("src/temp/Card.tsx"), revisor]).reason, /Playwright/);
// texto colado pelo usuario imitando o feedback nao libera
const colado = JSON.stringify({ type: "user", message: { content: "Stop hook feedback:\nPORTAO DE ENTREGA" } });
assert.strictEqual(rodar([edit("a.go"), colado]).decision, "block");
// subagente que so cita Playwright (revisor, busca, proibicao) nao valida a tela
for (const p of [
  uso("Agent", { subagent_type: "revisor-codigo", prompt: "Requisito: tela validada com npx playwright test. Revise o diff." }),
  uso("Agent", { subagent_type: "Explore", prompt: "ache o playwright.config" }),
  uso("Agent", { subagent_type: "general-purpose", prompt: "Nao rode Playwright, o pai valida" }),
]) assert.match(rodar([edit("src/app/page.tsx"), p, revisor]).reason, /Playwright/);

// MultiEdit tambem e edicao
assert.strictEqual(rodar([uso("MultiEdit", { file_path: "a.go" })]).decision, "block");

// teste unitario de componente nao pede Playwright, so revisor
r = rodar([edit("src/components/Filtro.test.tsx")]);
assert.doesNotMatch(r.reason, /Playwright/);

// citar a palavra playwright nao e rodar Playwright
for (const c of ["grep playwright package.json", "npm i -D @playwright/test", "ls tests/e2e"])
  assert.match(rodar([edit("src/app/page.tsx"), uso("Bash", { command: c }), revisor]).reason, /Playwright/);
// formas reais de rodar: script e2e do projeto, playwright-cli, subagente com Playwright no prompt
for (const u of [
  uso("PowerShell", { command: "npm run test:e2e -- ordens" }),
  uso("Bash", { command: "playwright-cli open http://localhost:3000/ordens" }),
  uso("Agent", { subagent_type: "general-purpose", prompt: "suba o front e rode npx playwright test ordens" }),
]) assert.strictEqual(rodar([edit("src/app/page.tsx"), u, revisor]), null);

// ja bloqueou uma vez neste stop: nunca entra em loop
assert.strictEqual(rodar([edit("a.go")], { stop_hook_active: true }), null);

// transcript ausente ou linha quebrada: falha aberta, nao prende a sessao
let x = spawnSync("node", [HOOK], { input: JSON.stringify({ transcript_path: path.join(dir, "nao-existe") }), encoding: "utf8" });
assert.strictEqual(x.status, 0);
assert.strictEqual(x.stdout.trim(), "");
assert.strictEqual(rodar(['{"quebrado": "tool_use"', edit("a.md")]), null);

// transcript_path com ~ (como na documentacao) e expandido para a home
const casa = fs.mkdtempSync(path.join(os.homedir(), ".portao-teste-"));
fs.writeFileSync(path.join(casa, "t.jsonl"), edit("a.go") + "\n");
x = spawnSync("node", [HOOK], { input: JSON.stringify({ transcript_path: "~/" + path.basename(casa) + "/t.jsonl" }), encoding: "utf8" });
fs.rmSync(casa, { recursive: true });
assert.match(x.stdout, /"decision":"block"/);

fs.rmSync(dir, { recursive: true });
console.log("ok");
