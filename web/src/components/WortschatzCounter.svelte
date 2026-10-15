<script lang="ts">
  import { onMount } from 'svelte';
  import { countWortschatz } from '@core/engine/wortschatz';
  import { srs } from '@core/index';

  // dedupKeys: lightweight word-identity strings only (not full VocabEntryType[]) —
  // the client just needs to check them against gl:v1:srs:cards. Known, accepted
  // trade-off: the whole-course homepage payload is ~2.5k short strings (~30-45KB
  // inline JSON, shrinks under gzip) — the curriculum is capped at A1-C1, so this
  // is near its ceiling, not unboundedly growing. Not worth paginating for an
  // S-sized ticket.
  let { dedupKeys }: { dedupKeys: string[] } = $props();

  let mounted = $state(false);
  let seen = $state(0);
  let mastered = $state(0);

  onMount(() => {
    const result = countWortschatz(dedupKeys, srs.getAllCardStates());
    seen = result.seen;
    mastered = result.mastered;
    mounted = true;
  });
</script>

{#if mounted}
  <span class="wortschatz-counter" title="{mastered} Wörter gelernt, {seen} gesehen">
    <strong>{mastered}</strong> Wörter{' '}<span class="wortschatz-long">gelernt</span>
    <span class="wortschatz-seen">({seen} gesehen)</span>
  </span>
{/if}

<style>
  .wortschatz-counter { font-size: 0.875rem; color: var(--text-muted); white-space: nowrap; }
  .wortschatz-counter strong { color: var(--brand-600); }
  .wortschatz-seen { color: var(--text-subtle); }
  /* Phones: "12 Wörter" only — the full text pushed the topbar past the
     viewport and the theme toggle off-screen (issue #473). */
  @media (max-width: 900px) { .wortschatz-seen { display: none; } }
  @media (max-width: 480px) { .wortschatz-long { display: none; } }
</style>
