<script lang="ts">
  /**
   * Renders one instructions string: ordinary prose as paragraphs, and any
   * embedded "> " blockquote as a styled reading passage with its hard
   * wrapping undone. See core/content/instructions.ts for the parsing rules.
   */
  import { parseInstructions } from '@core/content/instructions';

  let { source }: { source: string } = $props();

  const blocks = $derived(parseInstructions(source));
</script>

{#each blocks as block}
  {#if block.kind === 'text'}
    <p class="instruction-text">{block.text}</p>
  {:else}
    <blockquote class="passage">
      {#each block.paragraphs as paragraph}
        <p>
          {#each paragraph as line, i}
            {#if i > 0}<br />{/if}
            {#each line as run}
              {#if run.bold}<strong>{run.text}</strong>{:else}{run.text}{/if}
            {/each}
          {/each}
        </p>
      {/each}
    </blockquote>
  {/if}
{/each}

<style>
  .instruction-text { margin: 0 0 0.4rem; }
  .instruction-text:last-child { margin-bottom: 0; }

  /* Reading passage (Lesetext, Formular, Anzeige, Forumspost …). Set apart
     from the surrounding instructions so it reads as material to work from. */
  .passage {
    margin: 0.6rem 0;
    padding: 0.9rem 1.1rem;
    border-left: 4px solid var(--brand-400, #5985fc);
    background: var(--surface-2, #f8fafc);
    border-radius: 0 var(--radius, 10px) var(--radius, 10px) 0;
    color: var(--text, #0f172a);
    font-size: var(--text-md, 1rem);
    line-height: 1.7;
  }
  .passage p { margin: 0 0 0.7rem; }
  .passage p:last-child { margin-bottom: 0; }
  .passage strong { font-weight: 650; }
</style>
