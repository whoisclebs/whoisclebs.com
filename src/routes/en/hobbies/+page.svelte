<script lang="ts">
  import HobbiesPage from '$lib/pages/HobbiesPage.svelte'

  let { data } = $props()
</script>

<HobbiesPage {data} />
