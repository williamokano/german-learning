import { describe, it, expect } from 'vitest';
import { countWortschatz } from '@core/engine/wortschatz';
import type { CardStateLike } from '@core/engine/wortschatz';

const apfelKey = 'apfel noun der';
const banaeKey = 'banane noun die';

function state(intervalDays?: number): CardStateLike {
  return intervalDays === undefined ? {} : { intervalDays };
}

describe('countWortschatz', () => {
  it('counts a word as seen when either meaning face has a CardState', () => {
    const cardStates = { [`${apfelKey}|meaning-de-en`]: state(1) };
    const result = countWortschatz([apfelKey], cardStates);
    expect(result.seen).toBe(1);
    expect(result.mastered).toBe(0);
  });

  it('counts a word as seen via the OTHER direction too — either suffices', () => {
    const cardStates = { [`${apfelKey}|meaning-en-de`]: state(1) };
    const result = countWortschatz([apfelKey], cardStates);
    expect(result.seen).toBe(1);
  });

  it('excludes a word with no CardState at all from both counts', () => {
    const result = countWortschatz([apfelKey], {});
    expect(result.seen).toBe(0);
    expect(result.mastered).toBe(0);
  });

  it('ignores article-face cards entirely — they do not count as seen', () => {
    const cardStates = { [`${apfelKey}|article`]: state(30) };
    const result = countWortschatz([apfelKey], cardStates);
    expect(result.seen).toBe(0);
    expect(result.mastered).toBe(0);
  });

  it('mastery requires intervalDays >= threshold on at least one meaning face', () => {
    const notMature = { [`${apfelKey}|meaning-de-en`]: state(20) };
    expect(countWortschatz([apfelKey], notMature).mastered).toBe(0);

    const mature = { [`${apfelKey}|meaning-de-en`]: state(21) };
    expect(countWortschatz([apfelKey], mature).mastered).toBe(1);
  });

  it('mastery via either direction is sufficient, not both', () => {
    const cardStates = {
      [`${apfelKey}|meaning-de-en`]: state(21),
      [`${apfelKey}|meaning-en-de`]: state(1), // far from mature, irrelevant
    };
    const result = countWortschatz([apfelKey], cardStates);
    expect(result.seen).toBe(1);
    expect(result.mastered).toBe(1);
  });

  it('a legacy F2-shape CardState (no intervalDays field) counts as seen but never mastered', () => {
    const cardStates = { [`${apfelKey}|meaning-de-en`]: state(undefined) };
    const result = countWortschatz([apfelKey], cardStates);
    expect(result.seen).toBe(1);
    expect(result.mastered).toBe(0);
  });

  it('respects a custom matureIntervalDays override', () => {
    const cardStates = { [`${apfelKey}|meaning-de-en`]: state(5) };
    expect(countWortschatz([apfelKey], cardStates, 5).mastered).toBe(1);
    expect(countWortschatz([apfelKey], cardStates, 6).mastered).toBe(0);
  });

  it('aggregates independently across multiple words', () => {
    const cardStates = {
      [`${apfelKey}|meaning-de-en`]: state(21), // seen + mastered
      [`${banaeKey}|meaning-de-en`]: state(1),  // seen only
    };
    const result = countWortschatz([apfelKey, banaeKey], cardStates);
    expect(result.seen).toBe(2);
    expect(result.mastered).toBe(1);
  });
});
