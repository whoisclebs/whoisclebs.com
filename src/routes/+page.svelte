<script lang="ts">
  import HomePage from '$lib/pages/HomePage.svelte'

  let { data } = $props()
</script>

<HomePage {data} />
