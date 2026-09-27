<script lang="ts">
  import ProjectsPage from '$lib/pages/ProjectsPage.svelte'

  let { data } = $props()
</script>

<ProjectsPage {data} />
