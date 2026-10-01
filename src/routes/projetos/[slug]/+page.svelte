<script lang="ts">
  import SimDemo from '$lib/components/sim/SimDemo.svelte'
  import ProjectPage from '$lib/pages/ProjectPage.svelte'

  let { data } = $props()
</script>

{#snippet demo()}
  {#if data.simulation}<SimDemo scenario={data.simulation} />{/if}
{/snippet}

<ProjectPage {data} demo={data.simulation ? demo : undefined} />
