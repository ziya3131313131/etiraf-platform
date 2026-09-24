// Hədiyyə konfiqurasiyası
export const HEDIYYELER = {
  gul: {
    id: 'gul',
    ad: '🌹 Gül',
    qiymət: 1,
    emoji: '🌹',
    animasiya: 'rose',
    rəng: '#ff1744'
  },
  urek: {
    id: 'urek',
    ad: '❤️ Ürək',
    qiymət: 5,
    emoji: '❤️',
    animasiya: 'heart',
    rəng: '#e91e63'
  },
  ulduzkusu: {
    id: 'ulduzkusu',
    ad: '🌟 Ulduz',
    qiymət: 10,
    emoji: '🌟',
    animasiya: 'star',
    rəng: '#ffd700'
  },
  tort: {
    id: 'tort',
    ad: '🎂 Tort',
    qiymət: 20,
    emoji: '🎂',
    animasiya: 'cake',
    rəng: '#ff9800'
  },
  dovsan: {
    id: 'dovsan',
    ad: '🐰 Dovşan',
    qiymət: 50,
    emoji: '🐰',
    animasiya: 'bunny',
    rəng: '#9c27b0'
  },
  tac: {
    id: 'tac',
    ad: '👑 Tac',
    qiymət: 100,
    emoji: '👑',
    animasiya: 'crown',
    rəng: '#ffeb3b'
  },
  qalxan: {
    id: 'qalxan',
    ad: '🛡️ Qalxan',
    qiymət: 200,
    emoji: '🛡️',
    animasiya: 'shield',
    rəng: '#2196f3'
  },
  masin: {
    id: 'masin',
    ad: '🚗 Maşın',
    qiymət: 500,
    emoji: '🚗',
    animasiya: 'car',
    rəng: '#00bcd4'
  },
  aslan: {
    id: 'aslan',
    ad: '🦁 Aslan',
    qiymət: 1000,
    emoji: '🦁',
    animasiya: 'lion',
    rəng: '#ff5722'
  },
  ucaq: {
    id: 'ucaq',
    ad: '✈️ Uçaq',
    qiymət: 2000,
    emoji: '✈️',
    animasiya: 'plane',
    rəng: '#607d8b'
  },
  yaxta: {
    id: 'yaxta',
    ad: '🛥️ Yaxta',
    qiymət: 5000,
    emoji: '🛥️',
    animasiya: 'yacht',
    rəng: '#3f51b5'
  },
  balina: {
    id: 'balina',
    ad: '🐋 Balina',
    qiymət: 10000,
    emoji: '🐋',
    animasiya: 'whale',
    rəng: '#1976d2'
  }
};

// Hədiyyə siyahısını array kimi al
export const getHediyyeList = () => {
  return Object.values(HEDIYYELER).sort((a, b) => a.qiymət - b.qiymət);
};

// ID-yə görə hədiyyəni tap
export const getHediyyeById = (id) => {
  return HEDIYYELER[id] || null;
};
