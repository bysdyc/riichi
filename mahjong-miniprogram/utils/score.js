function calculateScore(han, fu, isDealer, honba = 0, isTsumo = false) {
  const honbaBonusTsumo = honba * 100;
  const honbaBonusRon = honba * 300;

  let base = 0;
  let isMangan = false;

  if (han >= 13) {
    const yakumanMultiplier = Math.floor(han / 13);
    base = yakumanMultiplier * (isDealer ? 48000 : 32000);
    isMangan = true;
  } else if (han >= 11) {
    base = isDealer ? 36000 : 24000;
    isMangan = true;
  } else if (han >= 8) {
    base = isDealer ? 24000 : 16000;
    isMangan = true;
  } else if (han >= 6) {
    base = isDealer ? 18000 : 12000;
    isMangan = true;
  } else if (han === 5) {
    base = isDealer ? 12000 : 8000;
    isMangan = true;
  } else {
    let basicPoints = fu * Math.pow(2, 2 + han);
    if (basicPoints > 2000) {
      base = isDealer ? 12000 : 8000;
      isMangan = true;
    } else {
      if (isDealer) {
        const nonDealerPays = Math.ceil((basicPoints * 2) / 100) * 100;
        if (isTsumo) {
          const each = nonDealerPays + honbaBonusTsumo;
          return { total: each * 3, each };
        }
        return { total: Math.ceil((basicPoints * 6) / 100) * 100 + honbaBonusRon };
      }
      const dealerPays = Math.ceil((basicPoints * 2) / 100) * 100;
      const nonDealerPays = Math.ceil(basicPoints / 100) * 100;
      if (isTsumo) {
        const dealer = dealerPays + honbaBonusTsumo;
        const nonDealer = nonDealerPays + honbaBonusTsumo;
        return { total: dealer + nonDealer * 2, dealer, nonDealer };
      }
      return { total: Math.ceil((basicPoints * 4) / 100) * 100 + honbaBonusRon };
    }
  }

  if (isMangan) {
    if (isTsumo) {
      if (isDealer) {
        const each = Math.ceil(base / 3 / 100) * 100 + honbaBonusTsumo;
        return { total: each * 3, each };
      }
      const dealer = Math.ceil(base / 2 / 100) * 100 + honbaBonusTsumo;
      const nonDealer = Math.ceil(base / 4 / 100) * 100 + honbaBonusTsumo;
      return { total: dealer + nonDealer * 2, dealer, nonDealer };
    }
    return { total: base + honbaBonusRon };
  }

  return null;
}

function getScoreDistribution({
  analysis,
  scoreData,
  winnerIndex,
  loserIndex,
  isTsumo,
  currentDealerIndex,
  riichiSticks,
  playerCount = 4
}) {
  const changes = Array(playerCount).fill(0);
  if (!analysis || !scoreData || winnerIndex == null) return changes;

  const riichiBonus = (riichiSticks || 0) * 1000;
  const isDealerWin = winnerIndex === currentDealerIndex;

  if (isTsumo) {
    if (isDealerWin) {
      const each = scoreData.each || 0;
      changes.forEach((_, idx) => {
        if (idx === winnerIndex) {
          changes[idx] = (scoreData.total || 0) + riichiBonus;
        } else {
          changes[idx] = -each;
        }
      });
    } else {
      const dealerLoss = scoreData.dealer || 0;
      const nonDealerLoss = scoreData.nonDealer || 0;
      changes.forEach((_, idx) => {
        if (idx === winnerIndex) {
          changes[idx] = (scoreData.total || 0) + riichiBonus;
        } else if (idx === currentDealerIndex) {
          changes[idx] = -dealerLoss;
        } else {
          changes[idx] = -nonDealerLoss;
        }
      });
    }
  } else if (loserIndex != null) {
    changes[winnerIndex] = (scoreData.total || 0) + riichiBonus;
    changes[loserIndex] = - (scoreData.total || 0);
  }

  return changes;
}

function calculateMultiWinScores({
  playerCount,
  multiWinners = [],
  multiWinLoser = null,
  multiWinHanFu = {},
  currentDealerIndex = 0,
  honba = 0
}) {
  const size = Number.isInteger(playerCount) && playerCount > 0 ? playerCount : 4;
  const scores = Array(size).fill(0);
  if (multiWinLoser == null) return scores;

  multiWinners.forEach(winnerIdx => {
    const data = multiWinHanFu[winnerIdx];
    if (!data) return;
    const { han = 0, fu = 0 } = data;
    const isDealer = winnerIdx === currentDealerIndex;
    const scoreData = calculateScore(han, fu, isDealer, honba, false);
    if (!scoreData || !scoreData.total) return;

    scores[winnerIdx] += scoreData.total;
    scores[multiWinLoser] -= scoreData.total;
  });

  return scores;
}

module.exports = {
  calculateScore,
  getScoreDistribution,
  calculateMultiWinScores
};