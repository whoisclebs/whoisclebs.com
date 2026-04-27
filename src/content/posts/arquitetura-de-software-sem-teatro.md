---
slug: arquitetura-de-software-sem-teatro
title: Arquitetura de software sem teatro
kicker: ARQUITETURA
date: 2026-04-20
readingTime: 7 MIN DE LEITURA
author: whoisclebs
excerpt: Como separar decisões reais de cerimônias vazias ao desenhar sistemas que precisam sobreviver ao dia dois.
cover: https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80
coverAlt: Estrutura arquitetural geométrica em preto e branco
published: true
---

Arquitetura útil não nasce de diagramas bonitos. Ela aparece quando um time consegue explicar quais decisões reduzem custo de mudança, quais riscos foram aceitos e qual parte do sistema pode quebrar sem derrubar o negócio.

## Decisão antes de desenho

Um ADR curto, escrito antes de espalhar a regra pelo código, costuma valer mais que uma apresentação com cinco camadas e nenhum tradeoff. O objetivo é dar contexto para o próximo engenheiro, não vencer uma disputa estética.

```typescript
type ArchitectureDecision = {
  context: string
  decision: string
  tradeoffs: string[]
  rollbackSignal: string
}

const decision: ArchitectureDecision = {
  context: 'Pedidos precisam ser conciliados sem bloquear checkout',
  decision: 'Publicar eventos idempotentes por pedido aprovado',
  tradeoffs: ['consistência eventual', 'observabilidade obrigatória'],
  rollbackSignal: 'fila com idade acima de 5 minutos',
}
```

O teatro começa quando a arquitetura vira vocabulário de status. A prática começa quando ela vira limite explícito, teste, métrica e plano de rollback.
