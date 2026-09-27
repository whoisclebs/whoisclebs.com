<script lang="ts">
  import NotePage from '$lib/pages/NotePage.svelte'

  let { data } = $props()
</script>

<NotePage {data} />
