import { describe, it, expect } from 'vitest';
import { detectConfusionPairs } from '@core/engine/confusion-pairs';

describe('detectConfusionPairs', () => {
  it('groups a pair regardless of which side was given vs expected', () => {
    const pairs = detectConfusionPairs([
      { given: 'der', expected: 'das' },
      { given: 'das', expected: 'der' },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ a: 'das', b: 'der', count: 2 });
  });

  it('folds case and umlauts via normalize() before comparing', () => {
    const pairs = detectConfusionPairs([
      { given: 'Seid', expected: 'seit' },
      { given: 'seid', expected: 'Seit' },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].count).toBe(2);
  });

  it('excludes multi-word given/expected (e.g. Order-style assembled sentences)', () => {
    const pairs = detectConfusionPairs([
      { given: 'Ich gehe nach Hause', expected: 'Ich gehe nach Hause morgen' },
      { given: 'Ich gehe nach Hause', expected: 'Ich gehe nach Hause morgen' },
    ]);
    expect(pairs).toHaveLength(0);
  });

  it('excludes an empty given', () => {
    const pairs = detectConfusionPairs([
      { given: '', expected: 'bin' },
      { given: '', expected: 'bin' },
    ]);
    expect(pairs).toHaveLength(0);
  });

  it('excludes a pair where given equals expected after normalization', () => {
    const pairs = detectConfusionPairs([
      { given: 'Bin', expected: 'bin' },
      { given: 'Bin', expected: 'bin' },
    ]);
    expect(pairs).toHaveLength(0);
  });

  it('respects the minOccurrences threshold (default 2)', () => {
    const once = detectConfusionPairs([{ given: 'wenn', expected: 'wann' }]);
    expect(once).toHaveLength(0);

    const twice = detectConfusionPairs([
      { given: 'wenn', expected: 'wann' },
      { given: 'wenn', expected: 'wann' },
    ]);
    expect(twice).toHaveLength(1);
  });

  it('supports a custom minOccurrences override', () => {
    const pairs = detectConfusionPairs([{ given: 'wenn', expected: 'wann' }], 1);
    expect(pairs).toHaveLength(1);
  });

  it('sorts by count descending', () => {
    const pairs = detectConfusionPairs([
      { given: 'der', expected: 'das' },
      { given: 'der', expected: 'das' },
      { given: 'wenn', expected: 'wann' },
      { given: 'wenn', expected: 'wann' },
      { given: 'wenn', expected: 'wann' },
    ]);
    expect(pairs.map(p => `${p.a}/${p.b}`)).toEqual(['wann/wenn', 'das/der']);
  });

  it('caps examples at 5 while count keeps growing', () => {
    const candidates = Array.from({ length: 7 }, () => ({ given: 'der', expected: 'das' }));
    const pairs = detectConfusionPairs(candidates);
    expect(pairs[0].count).toBe(7);
    expect(pairs[0].examples).toHaveLength(5);
  });
});
