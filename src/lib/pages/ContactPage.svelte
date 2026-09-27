<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { contactData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof contactData> } = $props()

  const copy = $derived(getMessages(data.locale).contact)
</script>

<header class="page-header">
  <h1>{copy.title}</h1>
  <p class="lead">{copy.intro}</p>
</header>

<dl class="contact">
  <div>
    <dt class="eyebrow">{copy.emailLabel}</dt>
    <dd><a href={`mailto:${data.email}`}>{data.email}</a></dd>
  </div>
  <div>
    <dt class="eyebrow">{copy.profilesLabel}</dt>
    <dd>
      <ul class="list-reset">
        {#each data.socialLinks as link (link.href)}
          <li><a href={link.href} rel="noopener noreferrer me">{link.label}</a></li>
        {/each}
      </ul>
    </dd>
  </div>
</dl>

<style>
  .contact {
    display: grid;
    gap: var(--space-6);
    margin: 0;
  }

  .contact dd {
    margin: var(--space-2) 0 0;
    font-size: var(--step-2);
  }
</style>
