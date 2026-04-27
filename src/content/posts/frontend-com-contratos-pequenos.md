---
slug: frontend-com-contratos-pequenos
title: Frontend com contratos pequenos
kicker: FRONTEND
date: 2026-03-28
readingTime: 5 MIN DE LEITURA
author: whoisclebs
excerpt: Componentes duráveis dependem menos de frameworks e mais de contratos pequenos, previsíveis e fáceis de testar.
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
coverAlt: Código em monitor com luz baixa
published: true
---

O componente que atravessa anos de produto normalmente tem uma API pequena. Ele não conhece todos os fluxos, não tenta ser inteligente demais e deixa o estado de negócio perto de quem entende o problema.

- Props com nomes de domínio, não de layout interno.
- Estados vazios tratados como parte do contrato.
- Eventos explícitos em vez de efeitos colaterais escondidos.

Quando a superfície pública é pequena, trocar biblioteca, refatorar visual ou adicionar acessibilidade deixa de ser um projeto de resgate.
