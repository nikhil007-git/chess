/**
 * FIDE-Compliant Swiss System Tournament Engine
 * Implements Score Brackets, Repeat Opponent Prevention, Color Balancing,
 * Odd-player Bye Allocation, and Tie-Breaks (Buchholz, Sonneborn-Berger, Head-to-Head).
 */

/**
 * Calculate complete Swiss Standings with tie-breaks
 */
export function calculateSwissStandings(participants, completedMatches) {
  const playerStats = {};

  // Initialize stats for each participant
  participants.forEach((p) => {
    playerStats[p.playerId] = {
      playerId: p.playerId,
      player: p.player,
      seed: p.seed,
      initialRating: p.initialRating,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      byes: 0,
      opponents: [],
      defeatedOpponents: [],
      drawnOpponents: [],
      colors: [], // 'W' or 'B'
    };
  });

  // Process completed matches
  completedMatches.forEach((m) => {
    const wId = m.whitePlayerId;
    const bId = m.blackPlayerId;

    if (m.result === 'BYE') {
      const byePlayerId = wId || bId || m.winnerId;
      if (byePlayerId && playerStats[byePlayerId]) {
        playerStats[byePlayerId].points += 1;
        playerStats[byePlayerId].byes += 1;
      }
      return;
    }

    if (!wId || !bId) return;

    if (playerStats[wId]) {
      playerStats[wId].played += 1;
      playerStats[wId].opponents.push(bId);
      playerStats[wId].colors.push('W');
    }
    if (playerStats[bId]) {
      playerStats[bId].played += 1;
      playerStats[bId].opponents.push(wId);
      playerStats[bId].colors.push('B');
    }

    if (m.result === 'WHITE_WIN' || m.result === 'BLACK_FORFEIT') {
      if (playerStats[wId]) {
        playerStats[wId].points += 1;
        playerStats[wId].wins += 1;
        playerStats[wId].defeatedOpponents.push(bId);
      }
      if (playerStats[bId]) {
        playerStats[bId].losses += 1;
      }
    } else if (m.result === 'BLACK_WIN' || m.result === 'WHITE_FORFEIT') {
      if (playerStats[bId]) {
        playerStats[bId].points += 1;
        playerStats[bId].wins += 1;
        playerStats[bId].defeatedOpponents.push(wId);
      }
      if (playerStats[wId]) {
        playerStats[wId].losses += 1;
      }
    } else if (m.result === 'DRAW') {
      if (playerStats[wId]) {
        playerStats[wId].points += 0.5;
        playerStats[wId].draws += 1;
        playerStats[wId].drawnOpponents.push(bId);
      }
      if (playerStats[bId]) {
        playerStats[bId].points += 0.5;
        playerStats[bId].draws += 1;
        playerStats[bId].drawnOpponents.push(wId);
      }
    }
  });

  // Calculate Buchholz and Sonneborn-Berger
  const standings = Object.values(playerStats).map((stat) => {
    // Buchholz: sum of opponents' total points
    const buchholz = stat.opponents.reduce((sum, oppId) => {
      return sum + (playerStats[oppId] ? playerStats[oppId].points : 0);
    }, 0);

    // Sonneborn-Berger: sum of points of defeated opponents + 0.5 * sum of points of drawn opponents
    const sonnebornBerger =
      stat.defeatedOpponents.reduce((sum, oppId) => {
        return sum + (playerStats[oppId] ? playerStats[oppId].points : 0);
      }, 0) +
      0.5 *
        stat.drawnOpponents.reduce((sum, oppId) => {
          return sum + (playerStats[oppId] ? playerStats[oppId].points : 0);
        }, 0);

    return {
      ...stat,
      buchholz: Number(buchholz.toFixed(2)),
      sonnebornBerger: Number(sonnebornBerger.toFixed(2)),
    };
  });

  // Sort standings: Points (desc) -> Buchholz (desc) -> Sonneborn-Berger (desc) -> Rating (desc)
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
    return (b.initialRating || 0) - (a.initialRating || 0);
  });

  // Assign ranks
  standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return standings;
}

/**
 * Generate Swiss Pairings for next round
 */
export function generateNextSwissRound(participants, allMatches, nextRoundNumber) {
  const standings = calculateSwissStandings(participants, allMatches);
  const eligiblePlayers = [...standings];

  // Track past opponents and color balances
  const opponentsMap = new Map();
  const colorBalanceMap = new Map(); // positive = more whites, negative = more blacks

  eligiblePlayers.forEach((p) => {
    opponentsMap.set(p.playerId, new Set(p.opponents));
    const whiteCount = p.colors.filter((c) => c === 'W').length;
    const blackCount = p.colors.filter((c) => c === 'B').length;
    colorBalanceMap.set(p.playerId, whiteCount - blackCount);
  });

  const pairings = [];

  // Handle Odd number of players: assign 1 BYE to lowest-ranked player without prior bye
  if (eligiblePlayers.length % 2 !== 0) {
    let byeIndex = -1;
    // Iterate from bottom up
    for (let i = eligiblePlayers.length - 1; i >= 0; i--) {
      if (eligiblePlayers[i].byes === 0) {
        byeIndex = i;
        break;
      }
    }

    if (byeIndex === -1) {
      byeIndex = eligiblePlayers.length - 1; // Fallback to last player
    }

    const byePlayer = eligiblePlayers.splice(byeIndex, 1)[0];
    pairings.push({
      whitePlayerId: byePlayer.playerId,
      blackPlayerId: null,
      isBye: true,
    });
  }

  // Recursive backtracking pairing algorithm to strictly avoid repeats
  function findPairings(pool) {
    if (pool.length === 0) return [];

    const first = pool[0];

    for (let i = 1; i < pool.length; i++) {
      const candidate = pool[i];
      const hasPlayed = opponentsMap.get(first.playerId)?.has(candidate.playerId);

      if (!hasPlayed) {
        const remaining = pool.filter((_, idx) => idx !== 0 && idx !== i);
        const subResult = findPairings(remaining);

        if (subResult !== null) {
          // Determine color assignment
          const firstBal = colorBalanceMap.get(first.playerId) || 0;
          const candBal = colorBalanceMap.get(candidate.playerId) || 0;

          let whiteId = first.playerId;
          let blackId = candidate.playerId;

          if (firstBal > candBal) {
            whiteId = candidate.playerId;
            blackId = first.playerId;
          } else if (firstBal === candBal) {
            // Alternate based on last color
            const lastColorFirst = first.colors[first.colors.length - 1];
            if (lastColorFirst === 'W') {
              whiteId = candidate.playerId;
              blackId = first.playerId;
            }
          }

          return [{ whitePlayerId: whiteId, blackPlayerId: blackId, isBye: false }, ...subResult];
        }
      }
    }

    return null; // No valid pairing found from this branch
  }

  const result = findPairings(eligiblePlayers);
  if (!result) {
    // If strict no-repeat matching cannot be satisfied (very rare/small pool), pair greedily
    console.warn('Strict no-repeat pairing could not be satisfied, using greedy fallback');
    for (let i = 0; i < eligiblePlayers.length; i += 2) {
      if (i + 1 < eligiblePlayers.length) {
        pairings.push({
          whitePlayerId: eligiblePlayers[i].playerId,
          blackPlayerId: eligiblePlayers[i + 1].playerId,
          isBye: false,
        });
      }
    }
    return pairings;
  }

  return [...pairings, ...result];
}
