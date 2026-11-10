// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');

const FEES = { delivery: 9000, service: 2000, payment: 1000 };
const line = (price, qty = 1) => ({ price, qty });
const disc50 = { tier: E.TIER_DISC50 };

test('1 stamp is Rp100.000', () => {
  assert.equal(E.RULES.STAMP_VALUE, 100000);
});

test('Rp220.000 earns 2 stamps and forfeits Rp20.000', () => {
  const o = E.calculateOrder({ lines: [line(220000)], fees: FEES });
  assert.equal(o.stamps_earned, 2);
  assert.equal(o.remainder_forfeited, 20000);
});

test('fees never count toward stamps', () => {
  const o = E.calculateOrder({ lines: [line(95000)], fees: FEES });
  assert.equal(o.total, 107000);
  assert.equal(o.stamps_earned, 0);
});

test('Rp85.000 shows a strong nudge for Rp15.000', () => {
  const o = E.calculateOrder({ lines: [line(45000), line(40000)], fees: FEES });
  const n = E.buildNudge(o, { stamps: 3, cycle: 1 });
  assert.equal(n.gap, 15000);
  assert.equal(n.strong, true);
  assert.equal(n.nextSlot, 4);
});

test('Rp60.000 is too far for the yellow nudge', () => {
  const o = E.calculateOrder({ lines: [line(60000)], fees: FEES });
  assert.equal(E.buildNudge(o, { stamps: 3, cycle: 1 }).strong, false);
});

test('nudge flags when the next stamp unlocks a milestone', () => {
  const o = E.calculateOrder({ lines: [line(90000)], fees: FEES });
  assert.equal(E.buildNudge(o, { stamps: 4, cycle: 1 }).unlocks, E.TIER_DISC50);
  assert.equal(E.buildNudge(o, { stamps: 9, cycle: 1 }).unlocks, E.TIER_FREE_MEAL);
});

test('50% voucher is capped at Rp30.000 and reduces the stamp basis', () => {
  const o = E.calculateOrder({ lines: [line(100000)], fees: FEES, voucher: disc50 });
  assert.equal(o.discount, 30000);
  assert.equal(o.stamp_basis, 70000);
  assert.equal(o.stamps_earned, 0);
  assert.equal(o.gap_to_next_stamp, 30000);
});

test('gap accounts for an uncapped discount', () => {
  // 40k subtotal -> 20k discount. Basis reaches 100k at 130k subtotal (discount capped at 30k).
  const o = E.calculateOrder({ lines: [line(40000)], fees: FEES, voucher: disc50 });
  assert.equal(o.gap_to_next_stamp, 90000);
});

test('stamp 5 triggers milestone 1', () => {
  const r = E.applyStamps({ stamps: 3, cycle: 1 }, 2);
  assert.deepEqual(r.steps.map((s) => s.slot), [4, 5]);
  assert.deepEqual(r.milestones, [{ cycle: 1, slot: 5, tier: E.TIER_DISC50 }]);
  assert.deepEqual(r.card, { stamps: 5, cycle: 1 });
});

test('stamps past 10 carry into a new card', () => {
  const r = E.applyStamps({ stamps: 9, cycle: 1 }, 3);
  assert.deepEqual(r.steps, [
    { cycle: 1, slot: 10 },
    { cycle: 2, slot: 1 },
    { cycle: 2, slot: 2 },
  ]);
  assert.deepEqual(r.milestones.map((m) => m.tier), [E.TIER_FREE_MEAL]);
  assert.deepEqual(r.card, { stamps: 2, cycle: 2 });
});

test('one big order can hit both milestones', () => {
  const r = E.applyStamps({ stamps: 4, cycle: 1 }, 6);
  assert.deepEqual(r.milestones.map((m) => m.slot), [5, 10]);
  assert.deepEqual(r.card, { stamps: 0, cycle: 2 });
});

test('quick-adds that close the gap come first, cheapest first', () => {
  const items = [
    { id: 'ice', price: 7000 },
    { id: 'fries', price: 18000 },
    { id: 'mocha', price: 15000 },
    { id: 'perkedel', price: 9000 },
  ];
  const ranked = E.rankQuickAdds(items, [line(85000)], FEES);
  assert.deepEqual(ranked.map((r) => r.item.id), ['mocha', 'fries', 'ice', 'perkedel']);
  assert.deepEqual(ranked.map((r) => r.earnsStamp), [true, true, false, false]);
});

test('formatRp uses Indonesian thousands separators', () => {
  assert.equal(E.formatRp(1000000), 'Rp 1.000.000');
  assert.equal(E.formatRp(-30000), '-Rp 30.000');
});
