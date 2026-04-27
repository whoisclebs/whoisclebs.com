---
slug: docker-healthcheck-para-servicos
title: Docker healthcheck para serviços pequenos
kicker: DEVOPS
date: 2026-04-27
excerpt: Um healthcheck simples ajuda o container a comunicar quando o processo está vivo, pronto e minimamente confiável.
published: true
---

Aprendi que um healthcheck útil não precisa tentar validar o sistema inteiro. Ele precisa responder se o processo principal está pronto para receber tráfego ou se entrou em um estado ruim conhecido.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
```

O detalhe importante é não transformar o healthcheck em uma dependência de todos os serviços externos. Quando isso acontece, o container vira refém da rede em vez de comunicar a saúde local do processo.
