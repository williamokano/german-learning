<script lang="ts">
  /**
   * Renders the lines of a passage: bold runs marked up, one <br /> between
   * lines of a paragraph, a blank line between paragraphs. Shared by the
   * reading passages inside instructions, listening transcripts, and
   * free-write stimuli / model answers.
   */
  import type { PassageParagraph } from '@core/content/instructions';

  let { paragraphs }: { paragraphs: PassageParagraph[] } = $props();
</script>

{#each paragraphs as paragraph}
  <p>
    {#each paragraph as line, i}
      {#if i > 0}<br />{/if}
      {#each line as run}
        {#if run.bold}<strong>{run.text}</strong>
        {:else if run.italic}<em>{run.text}</em>
        {:else}{run.text}{/if}
      {/each}
    {/each}
  </p>
{/each}

<style>
  p { margin: 0 0 0.7rem; }
  p:last-child { margin-bottom: 0; }
  strong { font-weight: 650; }
  em { font-style: italic; }
</style>
