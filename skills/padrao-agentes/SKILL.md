---
name: padrao-agentes
description: Use ao iniciar, retomar ou compactar qualquer sessão, antes da primeira resposta, e sempre que estiver prestes a encerrar uma tarefa de código, fazer push, abrir PR, mesclar ou dizer que algo está pronto.
---

# Padrão de agentes (skill raiz)

Esta skill entra sozinha em toda sessão. Ela diz o que carregar e quais são os dois portões que nenhuma entrega de código pula. Seguir a letra é seguir o espírito: não existe "desta vez é diferente".

## 1. Ao iniciar, retomar ou compactar

Antes da primeira resposta, carregue com a ferramenta Skill, nesta ordem, sem esperar pedido:

1. `using-superpowers`
2. `ponytail`
3. `test-driven-development`
4. `systematic-debugging`
5. `verification-before-completion`

As demais entram na hora certa, pela tabela "Skills obrigatórias" das regras globais (`AGENTS.md` deste repositório, instalado como `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` ou regra do Cursor) (brainstorming, writing-plans, codigo-seguro, requesting-code-review, git-ptbr-commits-prs e as outras).

## 2. Pedido é levado até o fim

O usuário não quer ser consultado no meio. Skill que pede aprovação por etapa (`brainstorming`, `writing-plans`, escolha de caminho) não vira pergunta: escolha a opção recomendada, registre o motivo e siga. Desenho e decisões aparecem no resumo final. Pergunte só o que for decisão de produto irreversível ou credencial.

## 3. Ordem da entrega (não troque)

1. Teste primeiro, depois o código. Build, lint, tipos e testes com saída real.
2. Portão de tela.
3. Portão de revisão.
4. Só então push, PR, merge, promoção e a palavra "pronto".

Os dois portões podem rodar em paralelo. O que não pode é o passo 4 começar antes de os dois terminarem.

Só o usuário dispensa um portão, com ordem explícita para aquele caso ("pode pular o Playwright desta vez"). Pressa, "é pequeno" e "já olhei o diff" não são dispensa. Dispensou: registre no PR qual portão ficou de fora e por ordem de quem.

## 4. Portão de tela: Playwright

Vale para tudo que é visual ou integrado no front: componente, página, estilo, texto de tela, e também API ou back que uma tela consome.

- Suba o front local e exercite o fluxo alterado com Playwright, do clique ao resultado na tela. O back pode ser o local ou o de homologação; nunca o de produção.
- Fluxo que fica: spec em `tests/e2e` e `npx playwright test <spec>`. Exploração rápida: `playwright-cli`, se instalado (gasta menos contexto que o Playwright MCP).
- Mostre a evidência (saída do teste, print) na resposta e no PR.
- Não conta como validação de tela: teste unitário, lint, tsc, CI verde, ler o diff, "o usuário já olhou".
- O ambiente não subiu? Pare, registre onde parou e avise. Sem validação de tela não tem push, PR nem merge.

## 5. Portão de revisão: subagente `revisor-codigo`

Terminou de escrever ou alterar código? Despache o agente `revisor-codigo` (ferramenta Agent) com o que foi feito, o requisito e a faixa do diff. Nunca mande a sua conclusão. O roteiro está em `requesting-code-review`.

- Corrija Crítico e Importante. Correção que não é trivial volta para o revisor.
- Código sensível (auth, dados, input externo, dependência, segredo, IA): some `codigo-seguro` e `/security-review`.
- Ler o próprio diff não é revisão. `/code-review` soma, não substitui o subagente.

## 6. Subagentes

Subagente que escreve código recebe estas regras no prompt. Quem despachou responde pelos portões: edição feita por subagente também passa por Playwright e pelo revisor.

## 7. Desculpas conhecidas

| Desculpa | Realidade |
|---|---|
| "Playwright ou o navegador na mão, tanto faz" | Playwright. Fica registrado e roda de novo. |
| "Abro o PR e valido a tela enquanto o CI roda" | A tela vem antes do push. |
| "O ambiente não subiu, mesclo na main e só não promovo" | Sem tela validada não há PR nem merge. Pare e avise. |
| "É pequeno, tem pressa, o usuário já viu o diff" | Pressa e mudança pequena são onde o erro passa. Os portões cabem no prazo rodando em paralelo. |
| "Eu mesmo revisei" | Quem escreveu não enxerga o próprio erro. |
| "Os testes passaram" | Provam que o que existia não quebrou, não que a tela nova funciona. |

O hook Stop `portao-entrega` cobra os dois portões ao fim do turno, uma vez por leva de edições. Ele é a rede, não o processo: faça antes de ele precisar cobrar. Ele não enxerga edição feita por shell (sed, heredoc, git apply), edição feita por subagente, nem `.ts` de front sem tela. Nesses casos os portões valem do mesmo jeito, por sua conta.
