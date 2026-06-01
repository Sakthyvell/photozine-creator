import { describe, expect, it } from 'vitest';
import { createMinimalPlan } from './planner';
import type { PlannerPhoto } from './planner';

function makePhoto(overrides: Partial<PlannerPhoto> = {}): PlannerPhoto {
  const sourceOrder = overrides.sourceOrder ?? 0;

  return {
    id: overrides.id ?? `body-${sourceOrder + 1}`,
    fileName: overrides.fileName ?? `photo-${sourceOrder + 1}.jpg`,
    orientation: overrides.orientation ?? 'portrait',
    rotationQuarterTurns: overrides.rotationQuarterTurns ?? 0,
    sourceOrder,
    included: overrides.included ?? true,
  };
}

describe('minimal planner', () => {
  it('keeps planner output stable for fixed inputs in larger-photo mode', () => {
    const photos = [
      makePhoto({ sourceOrder: 0, fileName: 'alpha.jpg' }),
      makePhoto({ sourceOrder: 1, fileName: 'bravo.jpg' }),
      makePhoto({ sourceOrder: 2, fileName: 'charlie.jpg', orientation: 'landscape' }),
      makePhoto({ sourceOrder: 3, fileName: 'delta.jpg', orientation: 'landscape' }),
    ];

    const plan = createMinimalPlan(photos, 'favor-larger-photos');

    expect(plan.photoCount).toBe(4);
    expect(plan.pages).toHaveLength(3);
    expect(plan.pages.map((page) => page.layoutId)).toEqual([
      'single-portrait',
      'single-portrait',
      'two-landscapes',
    ]);
    expect(plan.pages[2]?.sourceAssetIds).toEqual(['body-3', 'body-4']);
  });

  it('pairs portrait photos in fewer-pages mode', () => {
    const photos = [
      makePhoto({ sourceOrder: 0 }),
      makePhoto({ sourceOrder: 1 }),
      makePhoto({ sourceOrder: 2 }),
    ];

    const plan = createMinimalPlan(photos, 'favor-fewer-pages');

    expect(plan.pages).toHaveLength(2);
    expect(plan.pages[0]?.layoutId).toBe('two-portraits');
    expect(plan.pages[1]?.layoutId).toBe('single-portrait');
    expect(plan.layoutCounts['two-portraits']).toBe(1);
  });

  it('never auto-uses the landscape spread layout', () => {
    const photos = [
      makePhoto({ sourceOrder: 0, orientation: 'landscape' }),
      makePhoto({ sourceOrder: 1, orientation: 'landscape' }),
      makePhoto({ sourceOrder: 2, orientation: 'landscape' }),
    ];

    const plan = createMinimalPlan(photos, 'favor-fewer-pages');

    expect(plan.pages.every((page) => page.layoutId !== 'landscape-spread')).toBe(true);
    expect(plan.layoutCounts['landscape-spread']).toBe(0);
  });

  it('ignores excluded photos and preserves source order for included assets', () => {
    const photos = [
      makePhoto({ sourceOrder: 2, id: 'body-c', fileName: 'c.jpg' }),
      makePhoto({ sourceOrder: 0, id: 'body-a', fileName: 'a.jpg' }),
      makePhoto({ sourceOrder: 1, id: 'body-b', fileName: 'b.jpg', included: false }),
    ];

    const plan = createMinimalPlan(photos, 'favor-larger-photos');

    expect(plan.photoCount).toBe(2);
    expect(plan.pages).toHaveLength(2);
    expect(plan.pages[0]?.sourceAssetIds).toEqual(['body-a']);
    expect(plan.pages[1]?.sourceAssetIds).toEqual(['body-c']);
  });
});
