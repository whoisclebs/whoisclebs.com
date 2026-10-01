<!--
  Ilha da seção Terminal da home: escolhe o aparelho pela largura do contêiner e renderiza só um.
  Acima de 720 px, o notebook com o terminal (`../device/Laptop.svelte`); até 720 px, o celular com a gaveta de
  aplicativos (`../device/Phone.svelte`). Contrato: `{ catalog }` (`TerminalCatalog`, vem de `data.terminal`
  na home), carregado por import dinâmico. A altura de cada aparelho é a mesma que `HomeTerminal.svelte`
  reserva (mesmas fórmulas em `cqi`), então a chegada da ilha não empurra nada.
-->
<script lang="ts">
  import Laptop from '../device/Laptop.svelte'
  import Phone from '../device/Phone.svelte'
  import type { TerminalCatalog } from './catalog'

  let { catalog }: { catalog: TerminalCatalog } = $props()

  /** Corte entre os aparelhos, casado com a container query de `HomeTerminal.svelte`. */
  const WIDE_PX = 720

  let width = $state(0)
</script>

<div class="device" bind:clientWidth={width}>
  {#if width > WIDE_PX}
    <Laptop {catalog} />
  {:else if width > 0}
    <Phone {catalog} />
  {/if}
</div>

<style>
  .device {
    container-type: inline-size;
    width: 100%;
  }
</style>
