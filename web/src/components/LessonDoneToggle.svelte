<script lang="ts">
  import { onMount } from 'svelte';
  import { path } from '@core/index';
  import type { PathNodeId } from '@core/content/path';

  // Manual "done" toggle for one learning-path node (issue #466). Passing a
  // lesson's exercises completes it automatically; this lets a learner mark a
  // lesson they already know, or reset one to revisit it.

  let { nodeId }: { nodeId: PathNodeId } = $props();

  let done = $state(false);
  let mounted = $state(false);

  onMount(() => {
    done = path.isComplete(nodeId);
    mounted = true;
  });

  function toggle(): void {
    if (done) path.unmarkComplete(nodeId);
    else path.markComplete(nodeId);
    done = path.isComplete(nodeId);
  }
</script>

{#if mounted}
  <button type="button" class="btn btn-ghost done-toggle" aria-pressed={done} onclick={toggle}>
    {#if done}<span aria-hidden="true">✓</span> Erledigt — zurücksetzen{:else}Als erledigt markieren{/if}
  </button>
{/if}

<style>
  .done-toggle[aria-pressed='true'] { color: var(--ok-fg); }
</style>
