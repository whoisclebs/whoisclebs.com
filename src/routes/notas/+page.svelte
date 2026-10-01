<script lang="ts">
  import NotesPage from '$lib/pages/NotesPage.svelte'

  let { data } = $props()
</script>

<NotesPage {data} />
