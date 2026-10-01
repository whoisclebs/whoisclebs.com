<script lang="ts">
  import ArticlePage from '$lib/pages/ArticlePage.svelte'

  let { data } = $props()
</script>

<ArticlePage {data} />
