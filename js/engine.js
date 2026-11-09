/*
 * Livin' Food Stamp — order calculation & stamp rules (PRD §2 and §4.1).
 * Pure functions, no DOM. Loaded in the browser as window.LFS.engine and in
 * Node (tests) via require().
 */
(function (root) {
  'use strict';

  const TIER_DISC50 = 'TIER_5_DISC50';
  const TIER_FREE_MEAL = 'TIER_10_FREE_MEAL';

  const RULES = {
    STAMP_VALUE: 150000, // 1 stamp per Rp150.000 of food subtotal
    CYCLE_SIZE: 10,
    MILESTONES: { 5: TIER_DISC50, 10: TIER_FREE_MEAL },
    DISCOUNT_PERCENT: 50, // milestone 1 voucher
    DISCOUNT_CAP: 30000,
    NUDGE_MAX_GAP: 30000, // show the yellow "Tanggung banget!" nudge when this close to the next stamp
    VOUCHER_VALID_DAYS: 30,
    // The PRD excludes voucher discounts from the per-stamp requirement. We read that as:
    // stamps are counted on the food subtotal AFTER the voucher discount.
    // Set to 'before_discount' to count the gross food subtotal instead.
    STAMP_BASIS: 'after_discount',
  };

  function itemsSubtotal(lines) {
    return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  }

  function voucherDiscount(subtotal, voucher) {
    if (!voucher || voucher.tier !== TIER_DISC50) return 0;
    return Math.min(Math.floor((subtotal * RULES.DISCOUNT_PERCENT) / 100), RULES.DISCOUNT_CAP);
  }

  function stampBasis(subtotal, discount) {
    return RULES.STAMP_BASIS === 'after_discount' ? Math.max(0, subtotal - discount) : subtotal;
  }

  function basisForSubtotal(subtotal, voucher) {
    return stampBasis(subtotal, voucherDiscount(subtotal, voucher));
  }

  /** Smallest extra food spend (Rp) that earns one more stamp. Accounts for voucher discounts. */
  function extraSpendForNextStamp(subtotal, voucher) {
    const V = RULES.STAMP_VALUE;
    const target = (Math.floor(basisForSubtotal(subtotal, voucher) / V) + 1) * V;
    let lo = 0;
    let hi = target * 2 + RULES.DISCOUNT_CAP;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (basisForSubtotal(subtotal + mid, voucher) >= target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  /**
   * Order Calculation Engine. Food items are kept apart from every fee before
   * dividing by STAMP_VALUE; any remainder is forfeited (not carried over).
   */
  function calculateOrder({ lines, fees, voucher }) {
    const items_subtotal = itemsSubtotal(lines);
    const discount = voucherDiscount(items_subtotal, voucher);
    const stamp_basis = stampBasis(items_subtotal, discount);
    const stamps_earned = Math.floor(stamp_basis / RULES.STAMP_VALUE);
    const remainder_forfeited = stamp_basis % RULES.STAMP_VALUE;
    const delivery_fee = fees.delivery;
    const service_fee = fees.service;
    const payment_fee = fees.payment;
    return {
      items_subtotal,
      discount,
      delivery_fee,
      service_fee,
      payment_fee,
      stamp_basis,
      stamps_earned,
      remainder_forfeited,
      gap_to_next_stamp: extraSpendForNextStamp(items_subtotal, voucher),
      total: items_subtotal - discount + delivery_fee + service_fee + payment_fee,
    };
  }

  /**
   * Adds stamps to a card. card = { stamps: 0..9 in the current cycle, cycle: 1-based }.
   * Stamps beyond the 10th carry over into a fresh card.
   */
  function applyStamps(card, earned) {
    let stamps = card.stamps;
    let cycle = card.cycle;
    const steps = [];
    const milestones = [];
    for (let i = 0; i < earned; i++) {
      stamps += 1;
      steps.push({ cycle, slot: stamps });
      const tier = RULES.MILESTONES[stamps];
      if (tier) milestones.push({ cycle, slot: stamps, tier });
      if (stamps === RULES.CYCLE_SIZE) {
        stamps = 0;
        cycle += 1;
      }
    }
    return { card: { stamps, cycle }, steps, milestones };
  }

  /** Data for the checkout nudge (PRD §3.2). */
  function buildNudge(order, card) {
    const nextSlot = ((card.stamps + order.stamps_earned) % RULES.CYCLE_SIZE) + 1;
    return {
      gap: order.gap_to_next_stamp,
      strong: order.items_subtotal > 0 && order.gap_to_next_stamp <= RULES.NUDGE_MAX_GAP,
      nextTotal: order.stamps_earned + 1,
      nextSlot,
      unlocks: RULES.MILESTONES[nextSlot] || null,
    };
  }

  /**
   * Orders quick-add items: ones that earn the next stamp come first (cheapest
   * first), then the rest by price.
   */
  function rankQuickAdds(items, lines, fees, voucher) {
    const base = calculateOrder({ lines, fees, voucher });
    return items
      .map((item) => {
        const withItem = lines.concat([{ price: item.price, qty: 1 }]);
        const after = calculateOrder({ lines: withItem, fees, voucher });
        return { item, earnsStamp: after.stamps_earned > base.stamps_earned };
      })
      .sort((a, b) => (a.earnsStamp === b.earnsStamp ? a.item.price - b.item.price : a.earnsStamp ? -1 : 1));
  }

  function formatRp(n) {
    const sign = n < 0 ? '-' : '';
    return sign + 'Rp ' + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const api = {
    RULES,
    TIER_DISC50,
    TIER_FREE_MEAL,
    itemsSubtotal,
    voucherDiscount,
    calculateOrder,
    extraSpendForNextStamp,
    applyStamps,
    buildNudge,
    rankQuickAdds,
    formatRp,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.LFS = root.LFS || {};
    root.LFS.engine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
