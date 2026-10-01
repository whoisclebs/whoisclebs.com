<!--
  A face de uma lombada: cor, filetes, título na vertical e autor miúdo. A mesma marcação serve à
  prateleira e à face lateral do livro em 3D; as medidas de texto saem de unidades de contêiner
  (`cqw`/`cqh`), então a lombada fica igual em qualquer escala.
-->
<script lang="ts">
  let { title, author, color, ink }: { title: string; author: string; color: string; ink: string } = $props()

  // Na lombada vai só o sobrenome, como nas edições de verdade; o nome inteiro está no rótulo do botão.
  const surname = $derived(author.trim().split(/\s+/).at(-1) ?? author)
</script>

<span class="spine" style:--spine={color} style:--ink={ink} style:--title-len={Math.max(title.length, 8)} style:--author-len={Math.max(surname.length, 4)} aria-hidden="true">
  <span class="spine__body">
    <span class="spine__rule"></span>
    <span class="spine__title">{title}</span>
    <span class="spine__author">{surname}</span>
    <span class="spine__rule"></span>
  </span>
</span>

<style>
  /* O contêiner não tem padding: as unidades `cq*` dos filhos medem a lombada inteira. */
  .spine {
    container-type: size;
    /* Preenche o pai posicionado (o botão da prateleira ou a face do livro em 3D). */
    position: absolute;
    inset: 0;
    color: var(--ink);
    /* Volume da lombada: sombra nas bordas e um brilho fosco perto do meio, como tecido sobre papelão. */
    background:
      linear-gradient(90deg, rgb(0 0 0 / 0.32), transparent 16%, rgb(255 255 255 / 0.09) 38%, transparent 62%, rgb(0 0 0 / 0.36)),
      var(--spine);
    overflow: hidden;
  }

  .spine__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding-block: 7cqh 6cqh;
    gap: 3cqh;
  }

  .spine__rule {
    flex: none;
    width: 70%;
    height: max(1px, 0.5cqh);
    background: currentColor;
    opacity: 0.55;
  }

  .spine__title,
  .spine__author {
    writing-mode: vertical-rl;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 100%;
    line-height: 1;
  }

  .spine__title {
    flex: 1 1 auto;
    min-height: 0;
    font-family: var(--font-display);
    font-weight: 600;
    /* O corpo cabe na altura: uns 60 % da lombada para o título, pelo número de letras. */
    font-size: min(32cqw, 7cqh, calc(107cqh / var(--title-len)));
    letter-spacing: -0.01em;
  }

  .spine__author {
    flex: 0 1 auto;
    min-height: 0;
    font-family: var(--font-text);
    font-weight: 500;
    font-size: min(21cqw, 4.4cqh, calc(30cqh / var(--author-len)));
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.85;
  }
</style>
