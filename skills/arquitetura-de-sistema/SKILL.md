---
name: arquitetura-de-sistema
description: Use quando a tarefa cria serviço ou módulo novo, integra com sistema externo ou entre serviços, atravessa mais de um serviço, troca o dono de um dado, ou adota fila, banco, cache ou outra peça estrutural. Não é para feature dentro de um serviço que segue padrão existente.
---

# Arquitetura de sistema

Lente técnica para decisão estrutural. Entra dentro de `brainstorming` ou `writing-plans`; não conduz conversa própria e não para para perguntar (decide a opção recomendada, registra o motivo e segue). Ponytail vale aqui: a melhor arquitetura costuma ser a que já existe.

## 1. Ler tudo antes de concluir

Leia, não só liste. Se você mesmo escreveu "não abri X, e a conclusão depende de X", abra X antes de entregar.

1. As decisões do projeto: pasta de ADR (`docs/adr`, `docs/decisions`, `adr/`), o README dela (formato de revisão e adendo) e as ADRs que tocam o tema. Ache-as buscando no conteúdo (grep pelos termos do tema: o serviço, o evento, o sistema externo), não só pelo título.
2. Specs e planos relacionados (`docs/specs`, `docs/plans`), o `AGENTS.md` do repositório e o documento de segurança ou zero-trust do projeto (e a ADR dele). Esses dois são leitura obrigatória sempre que a linha "Segurança" da tabela tiver algo a dizer.
3. O código do dono do dado e de quem já faz algo parecido. Procure o que já existe antes de desenhar: outbox, webhook, fila, job, cliente HTTP, cache. Achou? A proposta parte dele.
4. A memória e as skills do projeto (decisões do usuário vencem preferência técnica).

## 2. Responder por escrito (todas)

Linha que não se aplica vira uma frase dizendo por quê; nenhuma fica em branco.

| Pergunta | O que precisa ficar claro |
|---|---|
| Dono do dado | Qual serviço grava e é a fonte da verdade; quem só lê |
| Fronteira | O que fica dentro e o que fica fora do sistema; o que uma ADR já decidiu |
| Comunicação | Chamada síncrona (gRPC/HTTP) ou evento (fila, outbox); por quê |
| Consistência | Transação única, outbox ou eventual; idempotência e deduplicação |
| Falha | Retry, backoff, fila morta, o que o usuário vê quando a outra ponta cai |
| Ordem | Mensagem atrasada ou fora de ordem: quem descarta e como |
| Segurança | Permissão por recurso, segredo, dado pessoal (LGPD), SSRF em URL configurável |
| Auditoria | O que fica registrado e onde |
| Migração e volta | Como entra em produção aos poucos e como se desfaz sem perder dado |
| Custo de operar | Processo novo, banco novo, credencial nova, alerta, runbook |

## 3. Alternativas

De duas a três, sempre incluindo a mínima (reusar o que existe, configurar em vez de codar, ou não fazer). Para cada uma: o que muda, o que custa, por que fica ou sai. Serviço, banco ou dependência nova só com justificativa que a mínima não cobre.

## 4. Mercado

Se a decisão depende de prática de mercado ("como se faz X em escala", "qual ferramenta"), use a skill `pesquisa-de-mercado` em vez de opinar de memória.

## 5. Saída

- Decisão nova: ADR no formato e na numeração do projeto, com o status de proposta no vocabulário do README das ADRs (ex.: `proposto`) até o usuário aprovar. Sem pasta de ADR, um `docs/adr/NNN-titulo.md` com: contexto, decisão, alternativas, consequências.
- Decisão que fecha algo deixado em aberto numa ADR existente: adendo datado nessa ADR, não ADR nova, no formato que o README das ADRs define.
- O que depende do usuário (produto, contrato com terceiro, credencial) vai numa lista "Pendente do usuário" no fim, sem travar o resto: o desenho segue com a opção mais segura e reversível. Se a escolha entre alternativas depende de uma dessas respostas, diga qual resposta troca a recomendação e para qual alternativa.

## Erros comuns

| Erro | Correção |
|---|---|
| Desenhar serviço novo sem procurar o que já existe | Seção 1, item 3, antes de qualquer desenho |
| Concluir com documentos-chave não lidos | Ler e só então concluir. A lista "não abri" só pode ter o que não muda a conclusão |
| Escolher ADR pelo título | Grep no conteúdo pelos termos do tema |
| Escolher síncrono por ser mais simples | Responder a linha "Falha": se a outra ponta cair, o fluxo principal para? |
| Esquecer dado pessoal, auditoria ou volta | A tabela da seção 2 é inteira, não à escolha |
| Parar numa pergunta ao usuário | Decidir o reversível, listar o pendente, entregar |
