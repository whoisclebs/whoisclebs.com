<script lang="ts">
  import AgentsPage from '$lib/pages/AgentsPage.svelte'

  let { data } = $props()
</script>

<AgentsPage {data} />
