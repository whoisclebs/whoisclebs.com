<script lang="ts">
  import BooksPage from '$lib/pages/BooksPage.svelte'

  let { data } = $props()
</script>

<BooksPage {data} />
