<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { contactData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof contactData> } = $props()

  const copy = $derived(getMessages(data.locale).contact)
  const notes = $derived(copy.profileNotes as Record<string, string>)
</script>

<header class="page-header">
  <div class="page contact-header">
    <h1>{copy.title}</h1>
    <p class="lead">{copy.intro}</p>
  </div>
</header>

<div class="page page-body">
<div class="contact">
  <section class="contact__email" aria-labelledby="contact-email">
    <h2 id="contact-email" class="eyebrow contact__label">{copy.emailLabel}</h2>
    <p><a class="contact__mail link-lit" href={`mailto:${data.email}`}>{data.email}</a></p>
    <p class="contact__note">{copy.emailNote}</p>
  </section>

  <section aria-labelledby="contact-profiles">
    <h2 id="contact-profiles" class="eyebrow contact__label">{copy.profilesLabel}</h2>
    <ul class="profiles">
      {#each data.socialLinks as link (link.href)}
        <li>
          <a href={link.href} rel="noopener noreferrer me">{link.label}</a>
          {#if notes[link.label]}<span>{notes[link.label]}</span>{/if}
        </li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="contact-other">
    <h2 id="contact-other" class="eyebrow contact__label">{copy.otherLabel}</h2>
    <ul class="other">
      <li><a href="/rss/blog.xml" type="application/rss+xml">RSS</a> <span>{copy.rss}</span></li>
      <li><a href="/.well-known/security.txt">security.txt</a> <span>{copy.security}</span></li>
    </ul>
    <p class="contact__note">{copy.noForm}</p>
  </section>
</div>
</div>

<style>
  .contact-header .lead {
    max-width: 44ch;
  }

  .contact {
    display: grid;
    gap: var(--space-8);
  }

  .contact__label {
    margin-block-end: var(--space-3);
    font-family: var(--font-text);
  }

  .contact__mail {
    font-family: var(--font-display);
    font-size: var(--step-4);
    line-height: var(--leading-heading);
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }

  .contact__note {
    max-width: var(--measure-narrow);
    margin-block-start: var(--space-3);
    color: var(--color-text-soft);
  }

  .profiles,
  .other {
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .profiles li,
  .other li {
    display: grid;
    gap: var(--space-1) var(--space-5);
    padding-block: var(--space-4);
    border-block-end: var(--border-hairline) solid var(--color-rule-soft);
  }

  .profiles a {
    font-family: var(--font-display);
    font-size: var(--step-2);
    font-weight: var(--weight-display);
    letter-spacing: -0.01em;
  }

  .profiles span,
  .other span {
    color: var(--color-text-soft);
  }

  @media (min-width: 960px) {
    .contact {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .contact__email {
      grid-column: 1 / -1;
    }

    .contact > section:nth-child(2) {
      grid-column: 1 / span 7;
    }

    .contact > section:nth-child(3) {
      grid-column: 9 / -1;
    }

    .profiles li {
      grid-template-columns: 10rem minmax(0, 1fr);
      align-items: baseline;
    }
  }
</style>
