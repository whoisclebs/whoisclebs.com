<script lang="ts">
  import ProjectPage from '$lib/pages/ProjectPage.svelte'

  let { data } = $props()
</script>

<ProjectPage {data} />
