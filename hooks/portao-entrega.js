#!/usr/bin/env node
// Hook Stop do Claude Code: nao deixa o turno encerrar com codigo editado nesta
// sessao sem (1) revisao por subagente e (2) Playwright, quando a edicao foi de tela.
// Cobra uma vez por leva de edicoes, nunca em loop, e falha aberta em erro.
//
// Limites conhecidos (a skill padrao-agentes vale mesmo onde o hook nao enxerga):
// - so ve Edit, Write e MultiEdit da sessao principal; edicao por shell (sed, heredoc,
//   git apply) e edicao feita por subagente ficam de fora;
// - Playwright rodado por script proprio (node x.mjs, python com sync_playwright) nao e reconhecido;
// - "tela" e pela extensao; .ts de front (service, hook, lib) nao aciona o Playwright.
const fs = require("fs");
const os = require("os");

const CODIGO = /\.(tsx?|jsx?|mjs|cjs|go|py|sql|css|scss|vue|svelte|html|proto|sh|ps1|rs|java|kt|dart)$/i;
const TELA = /\.(tsx|jsx|css|scss|vue|svelte|html)$/i;
const TESTE = /\.(test|spec)\.[a-z]+$/i;
const barras = (p) => p.replace(/\\/g, "/").toLowerCase();
const TMP = barras(os.tmpdir()) + "/";
const rascunho = (f) => { const p = barras(f); return p.startsWith(TMP) || p.startsWith("/tmp/") || p.includes("scratchpad"); };
const RODA_PLAYWRIGHT = /playwright(-cli|\s+test)|\b(run|pnpm|yarn)\s+\S*e2e/i;
const MARCA = "PORTAO DE ENTREGA";

function faltas(transcript) {
  let edicao = -1, tela = -1, revisao = -1, playwright = -1, cobrado = -1, i = 0;
  // ponytail: le o transcript inteiro a cada parada (0,3 s em 107 MB); ler so o fim do arquivo se isso pesar
  for (const linha of fs.readFileSync(transcript, "utf8").split("\n")) {
    if (!linha.includes('"tool_use"') && !linha.includes(MARCA)) continue;
    let e;
    try { e = JSON.parse(linha); } catch { continue; }
    const c = e.message?.content;
    // o feedback deste hook volta gravado como mensagem de usuario em texto puro
    if (e.type === "user" && typeof c === "string" && e.isMeta === true && c.startsWith("Stop hook feedback") && c.includes(MARCA)) cobrado = ++i;
    if (e.type !== "assistant" || !Array.isArray(c)) continue;
    for (const b of c) {
      if (b.type !== "tool_use") continue;
      i++;
      const { name, input = {} } = b;
      if (/^(Edit|Write|MultiEdit)$/.test(name)) {
        const f = input.file_path ?? "";
        if (rascunho(f)) continue;
        if (CODIGO.test(f)) edicao = i;
        if (TELA.test(f) && !TESTE.test(f)) tela = i;
      } else if (/^(Agent|Task)$/.test(name)) {
        if (/revis|review/i.test(input.subagent_type ?? "")) revisao = i;
        else if (RODA_PLAYWRIGHT.test(input.prompt ?? "")) playwright = i;
      } else if (/playwright/i.test(name) || (/^(Bash|PowerShell)$/.test(name) && RODA_PLAYWRIGHT.test(input.command ?? ""))) playwright = i;
    }
  }
  const f = [];
  if (tela > playwright && tela > cobrado)
    f.push("Voce editou arquivo de tela e nao rodou Playwright depois. Suba o front local, exercite o fluxo alterado com Playwright (spec em tests/e2e com npx playwright test, ou playwright-cli) e mostre a saida real.");
  if (edicao > revisao && edicao > cobrado)
    f.push("Voce editou codigo e nao passou pelo subagente revisor depois. Despache o agente `revisor-codigo` com o diff e os requisitos (nao com a sua conclusao) e resolva os achados criticos e importantes.");
  return f;
}

try {
  const entrada = JSON.parse(fs.readFileSync(0, "utf8"));
  if (!entrada.stop_hook_active) {
    const f = faltas(entrada.transcript_path.replace(/^~(?=[\\/])/, os.homedir()));
    if (f.length)
      console.log(JSON.stringify({
        decision: "block",
        reason: MARCA + " (padrao-agentes):\n- " + f.join("\n- ") +
          "\nSe a tarefa ainda nao terminou e voce parou so para perguntar ou relatar, ou se o portao nao se aplica (correcao trivial ja revisada, dispensa explicita do usuario), diga isso ao usuario em uma linha, com o motivo e o que ficou sem validar, e nao afirme que esta pronto. Esta cobranca nao se repete ate a proxima edicao.",
      }));
  }
} catch {
  // falha aberta: um portao quebrado nao pode prender a sessao
}
