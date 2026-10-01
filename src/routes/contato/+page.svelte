<script lang="ts">
  import ContactPage from '$lib/pages/ContactPage.svelte'

  let { data } = $props()
</script>

<ContactPage {data} />
