/* Demo data. Menus and prices are sample values for the prototype. */
(function () {
  'use strict';
  window.LFS = window.LFS || {};

  window.LFS.data = {
    user: { id: 'U-20931', name: 'Rina', account: 'Tabungan Mandiri •••• 4821' },
    fees: { service: 2000, payment: 1000 },
    merchants: [
      {
        id: 'kfc',
        name: 'KFC',
        short: 'KFC',
        emoji: '🍗',
        branch: 'KFC Gatot Subroto',
        color: '#D7192D',
        rating: 4.8,
        eta: '25–35 mnt',
        distance: '1,2 km',
        deliveryFee: 9000,
        categories: ['Paket Ayam', 'Burger & Box', 'Snack & Dessert'],
        reward: { name: 'Paket Super Besar 1', retail: 42000, hpp: 25000 },
        menu: [
          { id: 'kfc-sb2', cat: 'Paket Ayam', emoji: '🍗', name: 'Paket Super Besar 2', desc: '2 ayam, nasi, minuman', price: 45000, best: true },
          { id: 'kfc-bento', cat: 'Paket Ayam', emoji: '🍱', name: 'Paket Bento', desc: 'Ayam teriyaki, nasi, sup', price: 40000 },
          { id: 'kfc-bucket', cat: 'Paket Ayam', emoji: '🪣', name: 'Bucket 6 Ayam', desc: '6 potong ayam original/crispy', price: 115000 },
          { id: 'kfc-zinger', cat: 'Burger & Box', emoji: '🍔', name: 'Zinger Burger', desc: 'Fillet ayam pedas, selada, mayo', price: 35000 },
          { id: 'kfc-box', cat: 'Burger & Box', emoji: '📦', name: 'Crispy Box', desc: 'Ayam crispy, nasi, saus keju', price: 32000 },
          { id: 'kfc-fries', cat: 'Snack & Dessert', emoji: '🍟', name: 'Kentang Goreng Large', desc: 'Renyah, porsi besar', price: 18000, quick: true },
          { id: 'kfc-mocha', cat: 'Snack & Dessert', emoji: '🥤', name: 'Mocha Float', desc: 'Kopi mocha + es krim', price: 15000, quick: true },
          { id: 'kfc-perkedel', cat: 'Snack & Dessert', emoji: '🥔', name: 'Perkedel', desc: '2 pcs', price: 9000, quick: true },
          { id: 'kfc-ice', cat: 'Snack & Dessert', emoji: '🍦', name: 'Es Krim Cone', desc: 'Vanila lembut', price: 7000, quick: true },
        ],
      },
      {
        id: 'mcd',
        name: "McDonald's",
        short: 'McD',
        emoji: '🍔',
        branch: "McDonald's Sudirman",
        color: '#DB0007',
        rating: 4.7,
        eta: '20–30 mnt',
        distance: '1,8 km',
        deliveryFee: 10000,
        categories: ['Paket Nasi', 'Burger', 'Snack & Dessert'],
        reward: { name: 'Paket PaNas 2', retail: 46000, hpp: 23000 },
        menu: [
          { id: 'mcd-panas2', cat: 'Paket Nasi', emoji: '🍗', name: 'PaNas 2', desc: '2 ayam, nasi, minuman', price: 46000, best: true },
          { id: 'mcd-family', cat: 'Paket Nasi', emoji: '🧺', name: 'Paket Keluarga', desc: '6 ayam, 4 nasi, 4 minuman', price: 168000 },
          { id: 'mcd-bigmac', cat: 'Burger', emoji: '🍔', name: 'Big Mac Meal', desc: 'Big Mac, kentang, minuman', price: 62000 },
          { id: 'mcd-cheese', cat: 'Burger', emoji: '🧀', name: 'Cheeseburger', desc: 'Daging sapi, keju, acar', price: 25000 },
          { id: 'mcd-nugget', cat: 'Burger', emoji: '🍤', name: 'McNuggets 9 pcs', desc: 'Dengan 2 saus pilihan', price: 48000 },
          { id: 'mcd-fries', cat: 'Snack & Dessert', emoji: '🍟', name: 'French Fries Medium', desc: 'Kentang goreng klasik', price: 17000, quick: true },
          { id: 'mcd-flurry', cat: 'Snack & Dessert', emoji: '🍦', name: 'McFlurry Oreo', desc: 'Es krim + oreo', price: 16000, quick: true },
          { id: 'mcd-sundae', cat: 'Snack & Dessert', emoji: '🍨', name: 'Sundae Coklat', desc: 'Saus coklat', price: 12000, quick: true },
          { id: 'mcd-tea', cat: 'Snack & Dessert', emoji: '🧋', name: 'Iced Lemon Tea', desc: 'Medium', price: 11000, quick: true },
        ],
      },
    ],

    // Ready-made carts for the demo panel.
    demoCarts: {
      // near: Rp85.000 / Rp87.000 (just short of 1 stamp). multi: Rp220.000 (2 stamps + Rp20.000 leftover).
      kfc: { near: { 'kfc-sb2': 1, 'kfc-bento': 1 }, multi: { 'kfc-bucket': 1, 'kfc-sb2': 2, 'kfc-mocha': 1 } },
      mcd: { near: { 'mcd-bigmac': 1, 'mcd-cheese': 1 }, multi: { 'mcd-family': 1, 'mcd-cheese': 1, 'mcd-flurry': 1, 'mcd-tea': 1 } },
    },

    // Program totals before this demo session, shown on the Merchant Dashboard (sample data).
    history: {
      kfc: { gmv: 561240000, stamps: 4712, disc50Issued: 418, disc50Redeemed: 371, avgDisc: 27600, freeMealIssued: 196, freeMealRedeemed: 152 },
      mcd: { gmv: 402880000, stamps: 3365, disc50Issued: 301, disc50Redeemed: 262, avgDisc: 26900, freeMealIssued: 128, freeMealRedeemed: 97 },
    },
  };
})();
