/*
 * Mock backend. Each call mutates the demo state and writes an entry to the
 * API log shown in the demo panel, so stakeholders can see what the real
 * integrations (PRD §4) would receive.
 */
(function () {
  'use strict';
  const E = window.LFS.engine;
  const D = window.LFS.data;

  function rid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function log(state, method, path, body, response) {
    state.apiLog.unshift({ id: rid('L'), at: Date.now(), method, path, body, response });
    state.apiLog = state.apiLog.slice(0, 25);
  }

  function rewardTitle(merchant, tier) {
    return tier === E.TIER_DISC50 ? 'Diskon 50% (maks. Rp30.000)' : '1x Free Meal: ' + merchant.reward.name;
  }

  const S = {
    /** POST /v1/orders — the calculation engine runs server-side on the split arrays. */
    createOrder(state, merchant, lines, calc, voucher) {
      const order = {
        id: rid('ORD'),
        merchantId: merchant.id,
        at: Date.now(),
        lines: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        voucherId: voucher ? voucher.id : null,
        ...calc,
      };
      state.orders.unshift(order);
      log(
        state,
        'POST',
        '/v1/orders',
        {
          merchant_id: merchant.id,
          items_subtotal: lines.map((l) => ({ sku: l.id, qty: l.qty, price: l.price })),
          delivery_fee: calc.delivery_fee,
          service_fee: calc.service_fee,
          payment_fee: calc.payment_fee,
          voucher_id: order.voucherId,
        },
        {
          order_id: order.id,
          items_subtotal: calc.items_subtotal,
          discount: calc.discount,
          stamp_basis: calc.stamp_basis,
          stamps_earned: calc.stamps_earned,
          remainder_forfeited: calc.remainder_forfeited,
          total_paid: calc.total,
        }
      );
      return order;
    },

    /** POST /v1/loyalty/stamps — adds stamps and returns any milestones crossed. */
    awardStamps(state, merchant, order) {
      const card = state.cards[merchant.id];
      const before = { stamps: card.stamps, cycle: card.cycle };
      const result = E.applyStamps(before, order.stamps_earned);
      card.stamps = result.card.stamps;
      card.cycle = result.card.cycle;
      card.lifetime += order.stamps_earned;
      if (order.stamps_earned > 0) {
        log(
          state,
          'POST',
          '/v1/loyalty/stamps',
          { user_id: D.user.id, merchant_id: merchant.id, order_id: order.id, stamps: order.stamps_earned },
          { card_before: before, card_after: result.card, milestones: result.milestones.map((m) => m.tier) }
        );
      }
      return { before, result };
    },

    /** Livin' Promo Engine: injectUserVoucher(userID, merchantID, rewardTier). */
    injectUserVoucher(state, userID, merchantID, rewardTier, sourceOrderId) {
      const merchant = D.merchants.find((m) => m.id === merchantID);
      const now = Date.now();
      const voucher = {
        id: rid(rewardTier === E.TIER_DISC50 ? 'V50' : 'VFM'),
        merchantId: merchantID,
        tier: rewardTier,
        title: rewardTitle(merchant, rewardTier),
        issuedAt: now,
        expiresAt: now + E.RULES.VOUCHER_VALID_DAYS * 86400000,
        status: 'active',
        sourceOrderId,
      };
      state.vouchers.unshift(voucher);
      log(state, 'CALL', 'injectUserVoucher', { userID, merchantID, rewardTier }, { voucher_id: voucher.id, expires_at: new Date(voucher.expiresAt).toISOString().slice(0, 10) });
      return voucher;
    },

    /** POST /v1/vouchers/{id}/redeem — recorded for merchant reconciliation. */
    redeemVoucher(state, voucher, order, merchant) {
      voucher.status = 'used';
      voucher.usedAt = Date.now();
      voucher.orderId = order.id;
      voucher.cost = voucher.tier === E.TIER_DISC50 ? order.discount : merchant.reward.hpp;
      voucher.recon = 'pending';
      log(state, 'POST', '/v1/vouchers/' + voucher.id + '/redeem', { order_id: order.id }, { reward_tier: voucher.tier, merchant_cost: voucher.cost, funded_by: 'merchant (100%)' });
    },

    /** POST /v1/merchant/loyalty/reconciliation — merchant confirms redeemed rewards. */
    submitReconciliation(state, merchantId, rowIds) {
      log(state, 'POST', '/v1/merchant/loyalty/reconciliation', { merchant_id: merchantId, redemption_ids: rowIds }, { status: 'SUBMITTED', count: rowIds.length });
    },
  };

  window.LFS.services = S;
})();
