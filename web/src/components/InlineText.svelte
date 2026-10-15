<script lang="ts">
  import { parseInline } from '@core/content/instructions';

  // Renders authoring markdown inside short strings — exercise titles, item
  // prompts, gap-text runs — so `code`, **bold** and *italic* don't show as raw
  // markers (issue #477).
  let { text }: { text: string } = $props();
  const runs = $derived(parseInline(text));
</script>

{#each runs as run}{#if run.code}<code>{run.text}</code>{:else if run.bold}<strong>{run.text}</strong>{:else if run.italic}<em>{run.text}</em>{:else}{run.text}{/if}{/each}
