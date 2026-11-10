# Livin' Food Stamp Loyalty — clickable prototype

A clickable prototype of the stamp-card loyalty feature from the PRD (target Q3 2027). The UI is in Bahasa Indonesia. Menus, prices and dashboard history are sample data.

## Open it

Double-click `index.html`. It runs in any modern browser with no install or server. Progress is kept in the browser until you press **Reset demo**.

## What's in it

| PRD section | Where to see it |
|---|---|
| §2 Stamp rules: Rp100.000 = 1 stamp, counted on the food subtotal only, leftover is lost | Cart → *Food Stamp* box; Riwayat (order history) |
| §2 Milestones: stamp 5 gives a 50% voucher (max Rp30.000), stamp 10 gives a Free Meal | Payment animation → gift box → Voucher Saya |
| §3.1 Merchant banner and stamp card (3/10) | Beranda → KFC / McDonald's |
| §3.2 Cart nudge "Tanggung banget!" with quick-add buttons | Cart with a subtotal within Rp30.000 of the next stamp |
| §3.3 Stamp drops onto the card with sound; gift box at stamps 5 and 10 | After pressing **Bayar** |
| §4.1 / §4.2 Order engine, `injectUserVoucher(userID, merchantID, rewardTier)` | Demo panel → *Log API (mock)* |
| §4.3 Merchant "Klaim Reward Loyalty" reconciliation | Demo panel → *Dashboard Merchant* |
| §5 Co-funding unit economics | Dashboard Merchant → *Unit ekonomi per 10 stamp* |

**Demo panel shortcuts:** set the stamp count to 4 or 9 to reach a milestone fast, load a Rp85.000 cart to trigger the nudge, or load a Rp220.000 cart to earn 2 stamps and see the Rp20.000 leftover lost.

## Rule decisions to confirm

These are set in `js/engine.js` → `RULES`:

- **Voucher discount vs. stamps.** The PRD excludes discounts from the per-stamp count. The prototype counts the food subtotal *after* the voucher discount (`STAMP_BASIS: 'after_discount'`). Set it to `'before_discount'` to count the gross subtotal instead.
- **When the nudge shows:** when the cart is within Rp30.000 of the next stamp (`NUDGE_MAX_GAP`).
- **Stamps past 10** carry over to a new card. Example: 9 stamps + 3 earned = Free Meal, then 2/10 on card 2.
- **Vouchers last 30 days** and only work at the merchant that issued them.

## Files

- `js/engine.js` — stamp rules (no UI code). Tested by `tests/engine.test.js`.
- `js/services.js` — mock backend: orders, stamps, `injectUserVoucher`, redemption, reconciliation.
- `js/data.js` — merchants, menus, demo carts, dashboard history.
- `js/app.js` — screens, payment animation, demo panel, merchant dashboard.
- `js/sound.js` — sound effects generated in the browser (no audio files).

Run the rule tests with Node 18+: `node --test tests/`
