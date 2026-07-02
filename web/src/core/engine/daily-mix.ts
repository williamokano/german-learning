// Daily Mix builder (issue #344, F9) — pure TypeScript, no UI/DOM/service imports.
// Sorts an N+M+K+L daily session sized to the learner's chosen goal (casual 5 min /
// regular 10 min / serious 20 min) and weighted by a fixed mix budget (40% new pills /
// 35% due SRS cards / 20% interleaved older-lesson drills / 5% Fehlerbuch). At ~20s
// per item this gives 15 / 30 / 60 items respectively — the orchestrator renders them
// in a single shuffled session (no resumability, mirrors `startDeepReview` precedent).
//
// `core/` rule: this module never imports from `core/services/`. State (CardStates,
// FehlerbuchEntry[]) is passed in by the caller (the Astro/Svelte page) which already
// lives above the storage layer.

import type { VocabEntryType } from '@core/content/vocab';
import { vocabDedupKey, unlockedVocab, lessonRank, type VocabSetType } from '@core/content/vocab';
import { possibleCards, vocabCardKey, shuffle, type CardFace, type FlashCard } from '@core/content/flashcards';
import { drillBank } from '@core/content/drills';
import type { DrillItem, ExerciseSetEntry } from '@core/content/drills';
import { selectBurst, type DueCandidate } from '@core/engine/sm2';
import type { FehlerbuchEntry } from '@core/engine/fehlerbuch';
import { DrillSkill } from '@core/content/schema';

export type DailyGoal = 'casual' | 'regular' | 'serious';

/** ~20s/item — empirically the cap a learner can hit without a session feeling bloated.
 *  Three items per minute × 5/10/20 minutes = 15/30/60 items. */
export const ITEMS_PER_MINUTE = 3;

export const GOAL_MINUTES: Record<DailyGoal, number> = {
  casual: 5,
  regular: 10,
  serious: 20,
};

export const GOAL_ITEM_COUNT: Record<DailyGoal, number> = {
  casual: GOAL_MINUTES.casual * ITEMS_PER_MINUTE,
  regular: GOAL_MINUTES.regular * ITEMS_PER_MINUTE,
  serious: GOAL_MINUTES.serious * ITEMS_PER_MINUTE,
};

export interface DailyMixBudget {
  /** Fraction of total items reserved for new vocab pills (default 0.40). */
  newPills: number;
  /** Fraction reserved for due SRS cards — recycles previously-learned vocab (0.35). */
  dueCards: number;
  /** Fraction reserved for drills from older lessons — spaced interleaving (0.20). */
  interleavedDrills: number;
  /** Fraction reserved for Fehlerbuch mistakes (0.05; gets min-1 bump when any exist). */
  fehlerbuch: number;
}

export const DEFAULT_DAILY_MIX_BUDGET: DailyMixBudget = {
  newPills: 0.40,
  dueCards: 0.35,
  interleavedDrills: 0.20,
  fehlerbuch: 0.05,
};

// ---- Discriminated union of items the orchestrator renders ----

export type MixItem =
  | { kind: 'vocab-card'; entry: VocabEntryType; face: CardFace; source: 'new' | 'due'; cardKey: string }
  | { kind: 'drill';       item: DrillItem; source: 'new' | 'interleaved' }
  | { kind: 'fehlerbuch';  entry: FehlerbuchEntry };

export interface BuildDailyMixStats {
  newPills: number;
  dueCards: number;
  interleavedDrills: number;
  fehlerbuch: number;
  total: number;
}

export interface BuildDailyMixResult {
  items: MixItem[];
  stats: BuildDailyMixStats;
  /** True iff the input pool was so empty that no items could be assembled (fresh
   *  user with no current path node, etc.). Caller renders an empty-state CTA. */
  empty: boolean;
}

// ---- Engine input shape (all state injected — no module-level `new Date()` etc.) ----

/** Structural subset of SrsService.CardState — see SrsService.scheduleOf: a card is
 *  unscheduled (`dueAt == null`) iff never rated. This engine only needs that fact. */
export interface CardStateLike {
  intervalDays?: number;
  dueAt?: string | null;
}

export interface BuildDailyMixInput {
  /** Path's current node, computed by `path.getCurrentNode(manifest, completedIds)`.
   *  `null` => fresh user / before the first lesson — returns the empty-state shape. */
  currentLessonId: string | null;

  vocabSets: ReadonlyArray<VocabSetType>;
  cardStates: Readonly<Record<string, CardStateLike>>;

  /** Cross-lesson drill/exercise source — every tagged exercise, fed by the page via
   *  `getCollection('exercises')`. Same structural shape as `drills.ts:ExerciseSetEntry`. */
  exerciseEntries: ReadonlyArray<ExerciseSetEntry>;

  /** Caller has already curated due mistakes via `fehlerbuch.startReview(K)`. Empty
   *  array is the no-Fehlerbuch case. */
  fehlerbuchEntries: ReadonlyArray<FehlerbuchEntry>;

  goal: DailyGoal;

  budget?: DailyMixBudget;
  /** Tests fix this; defaults to Math.random. */
  rng?: () => number;
  /** Tests fix this; defaults to `new Date()`. */
  now?: Date;
  /** Tests use this to override the goal-derived item count. */
  sizeOverride?: number;
}

// ---- Helpers (each individually testable) ----

/** Per-entry "is this a new vocab pill?" predicate. Both meaning-direction card keys
 *  must be without a schedule (state?.dueAt == null) for the entry to qualify as new.
 *  Article cards don't drive this check — an entry is "new" if its *word identity*
 *  is untouched, regardless of whether its article card has been rated.
 *
 *  Rationale (matches F3's "due wins" rule): a one-face-rated entry has been seen
 *  before, so it's "due" for the unseen face, not "new". Otherwise the same word
 *  could appear under both labels in one session, doubling up. */
function isNewVocabEntry(entry: VocabEntryType, cardStates: Readonly<Record<string, CardStateLike>>): boolean {
  return cardStates[vocabCardKey(entry, 'meaning-de-en')]?.dueAt == null
      && cardStates[vocabCardKey(entry, 'meaning-en-de')]?.dueAt == null;
}

const EN_DE = 'meaning-en-de';
const DE_EN = 'meaning-de-en';

/** Pick one meaning face for a new-pills entry. Since neither face has a schedule,
 *  there's no due-aware tie-break — fall back to the original random 50/50. */
function pickNewEntryFace(rng: () => number): CardFace {
  return rng() < 0.5 ? DE_EN : EN_DE;
}

/** Map a chosen due cardKey back to its entry + face — uses `possibleCards`'s
 *  lookup map shape. */
function flashCardFromMap(cardMap: Map<string, FlashCard>, cardKey: string): FlashCard | undefined {
  return cardMap.get(cardKey);
}

// ---- Exported pool selectors ----

export interface SelectNewPillsInput {
  currentLessonId: string;
  vocabSets: ReadonlyArray<VocabSetType>;
  cardStates: Readonly<Record<string, CardStateLike>>;
  size: number;
  rng?: () => number;
}

/** New-pill pool for a single lesson path-position. Pulls vocab from all unlocked
 *  lessons up to `currentLessonId`, filters to entries with no rating on either
 *  meaning face, random-samples `size`. Mirrors `drills.ts:selectDrillSession`. */
export function selectNewPillsForLesson(input: SelectNewPillsInput): Array<{ kind: 'vocab-card'; entry: VocabEntryType; face: CardFace; source: 'new'; cardKey: string; }> {
  const rng = input.rng ?? Math.random;
  const all = unlockedVocab(input.vocabSets as VocabSetType[], input.currentLessonId);
  // Dedup by word — `unlockedVocab` may carry cross-lesson recurrences of the same headword.
  const seenWord = new Set<string>();
  const fresh: VocabEntryType[] = [];
  for (const entry of all) {
    const key = vocabDedupKey(entry);
    if (seenWord.has(key)) continue;
    if (!isNewVocabEntry(entry, input.cardStates)) continue;
    seenWord.add(key);
    fresh.push(entry);
  }
  const sampled = shuffle(fresh, rng).slice(0, input.size);
  return sampled.map(entry => {
    // Draw face once. Two separate rng() calls could disagree — `face` would
    // render one card while `cardKey` schedules a *different* card for SRS,
    // silently desynchronizing what's shown from what gets rated.
    const face = pickNewEntryFace(rng);
    return {
      kind: 'vocab-card' as const,
      entry,
      face,
      source: 'new' as const,
      cardKey: vocabCardKey(entry, face),
    };
  });
}

export interface SelectDueCardsInput {
  currentLessonId: string;
  vocabSets: ReadonlyArray<VocabSetType>;
  cardStates: Readonly<Record<string, CardStateLike>>;
  size: number;
  now?: Date;
}

/** Due-card pool — every renderable card in the unlocked space, ranked through
 *  `selectBurst` (due-first then not-due filler, most-overdue / soonest-first).
 *  Maps chosen cardKeys back to MixItems via the `possibleCards` lookup.
 *
 *  Same-word dedup (mirrors F2's `buildSessionCardKeys`): one card per word per
 *  session. `selectBurst` is word-agnostic, so without this filter a word with
 *  multiple due cards (e.g. apfel rated on meaning-de-en, plus a separate due
 *  meaning-en-de + article) would surface 2-3 times in one session. The most-
 *  overdue direction wins; article cards lose to meaning cards since meaning is
 *  the primary recall axis. */
export function selectDueCards(input: SelectDueCardsInput): Array<{ kind: 'vocab-card'; entry: VocabEntryType; face: CardFace; source: 'due'; cardKey: string; }> {
  const now = input.now ?? new Date();
  const entries = unlockedVocab(input.vocabSets as VocabSetType[], input.currentLessonId);
  const cardMap = possibleCards(entries);

  const candidates: DueCandidate[] = [];
  for (const [cardKey] of cardMap) {
    const schedule = input.cardStates[cardKey];
    candidates.push({
      cardKey,
      schedule: schedule?.dueAt == null ? null : {
        // We only need dueAt + minimal fields for selectBurst's ranking. The date string
        // is the only ranking criterion; the structural cast is safe because `selectBurst`
        // never reads the other fields.
        reps: 0,
        intervalDays: 0,
        ease: 2.5,
        dueAt: schedule.dueAt!,
      },
    });
  }

  const chosenKeys = selectBurst(candidates, input.size, now);

  // Apply same-word dedup: keep at most one cardKey per vocabDedupKey per session.
  // After `selectBurst`'s rank-by-due sort, the first occurrence is the most-
  // overdue (or soonest-to-due) — the natural choice for "which card face to show."
  const seenWord = new Set<string>();
  const items: Array<{ kind: 'vocab-card'; entry: VocabEntryType; face: CardFace; source: 'due'; cardKey: string; }> = [];
  for (const cardKey of chosenKeys) {
    const card = flashCardFromMap(cardMap, cardKey);
    if (!card) continue;
    const wordKey = vocabDedupKey(card.entry);
    if (seenWord.has(wordKey)) continue;
    seenWord.add(wordKey);
    items.push({ kind: 'vocab-card' as const, entry: card.entry, face: card.face, source: 'due' as const, cardKey: card.key });
  }
  return items;
}

export interface SelectInterleavedDrillsInput {
  currentLessonId: string | null;
  exerciseEntries: ReadonlyArray<ExerciseSetEntry>;
  size: number;
  rng?: () => number;
}

/** Older-lesson interleaved drills — every tagged exercise across every skill whose
 *  source lesson is strictly OLDER than `currentLessonId` in `lessonRank` order.
 *  Returns [] when there are no older lessons (e.g. user still on A1/01). */
export function selectInterleavedDrills(input: SelectInterleavedDrillsInput): Array<{ kind: 'drill'; item: DrillItem; source: 'interleaved'; }> {
  if (input.currentLessonId == null) return [];
  const rng = input.rng ?? Math.random;
  const currentRank = lessonRank(input.currentLessonId);
  if (currentRank < 0) return []; // malformed id → empty pool, no throws

  const all: DrillItem[] = [];
  // Iterate the live DrillSkill enum from schema so adding a 9th skill is automatic.
  for (const skill of DrillSkill.options) {
    for (const item of drillBank(input.exerciseEntries as ExerciseSetEntry[], skill)) {
      if (lessonRank(item.lessonId) < currentRank) all.push(item);
    }
  }

  return shuffle(all, rng).slice(0, input.size).map(item => ({
    kind: 'drill' as const,
    item,
    source: 'interleaved' as const,
  }));
}

export function selectFehlerbuchItems(entries: ReadonlyArray<FehlerbuchEntry>, size: number): Array<{ kind: 'fehlerbuch'; entry: FehlerbuchEntry; }> {
  return entries.slice(0, size).map(entry => ({ kind: 'fehlerbuch' as const, entry }));
}

// ---- Main builder ----

function roundAllocations(total: number, budget: DailyMixBudget): { n: number; d: number; i: number; f: number; } {
  return {
    n: Math.round(total * budget.newPills),
    d: Math.round(total * budget.dueCards),
    i: Math.round(total * budget.interleavedDrills),
    f: Math.round(total * budget.fehlerbuch),
  };
}

/** Composes the four pools into a single shuffled session. Empty-user contract:
 *  `currentLessonId === null` returns the empty-state shape regardless of inputs. */
export function buildDailyMix(input: BuildDailyMixInput): BuildDailyMixResult {
  if (input.currentLessonId == null) {
    return {
      items: [],
      stats: { newPills: 0, dueCards: 0, interleavedDrills: 0, fehlerbuch: 0, total: 0 },
      empty: true,
    };
  }

  const budget = input.budget ?? DEFAULT_DAILY_MIX_BUDGET;
  const total = input.sizeOverride ?? GOAL_ITEM_COUNT[input.goal];
  const alloc = roundAllocations(total, budget);

  // Fehlerbuch gets a min-1 bump when any mistakes exist, so users with mistakes
  // always see their "due" Fehlerbuch even on casual. Drops back to 0 if none.
  const fSize = input.fehlerbuchEntries.length === 0 ? 0 : Math.max(1, alloc.f);

  const newPills = selectNewPillsForLesson({
    currentLessonId: input.currentLessonId,
    vocabSets: input.vocabSets,
    cardStates: input.cardStates,
    size: alloc.n,
    rng: input.rng,
  });

  const dueCards = selectDueCards({
    currentLessonId: input.currentLessonId,
    vocabSets: input.vocabSets,
    cardStates: input.cardStates,
    size: alloc.d,
    now: input.now,
  });

  const interleavedDrills = selectInterleavedDrills({
    currentLessonId: input.currentLessonId,
    exerciseEntries: input.exerciseEntries,
    size: alloc.i,
    rng: input.rng,
  });

  const fehlerbuchItems = selectFehlerbuchItems(input.fehlerbuchEntries, fSize);

  // Defensive cross-pool dedup by entry-anchor — new-pills takes precedence (a
  // new entry that happens to also have a card in the due pool is rare but possible
  // when cross-lesson recurrences slip through).
  const newEntries = new Set(newPills.map(p => vocabDedupKey(p.entry)));
  const dueCardsFiltered = dueCards.filter(p => !newEntries.has(vocabDedupKey(p.entry)));

  const items = shuffle(
    [...newPills, ...dueCardsFiltered, ...interleavedDrills, ...fehlerbuchItems],
    input.rng ?? Math.random,
  );

  return {
    items,
    stats: {
      newPills: newPills.length,
      dueCards: dueCardsFiltered.length,
      interleavedDrills: interleavedDrills.length,
      fehlerbuch: fehlerbuchItems.length,
      total: items.length,
    },
    empty: items.length === 0,
  };
}

