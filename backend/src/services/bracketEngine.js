/**
 * Single Elimination Bracket Generator & Advancement Engine
 * FIDE standard knockout brackets with powers of 2, standard seeding pairing,
 * automatic byes, and next-match linkage.
 */

// Generate standard tournament seeding array for bracket size N (power of 2)
// e.g. for N=8: [1, 8, 4, 5, 2, 7, 3, 6]
export function generateSeedOrder(size) {
  let rounds = Math.log2(size) - 1;
  let pls = [1, 2];
  for (let i = 0; i < rounds; i++) {
    const nextPls = [];
    const sum = pls.length * 2 + 1;
    for (let j = 0; j < pls.length; j++) {
      nextPls.push(pls[j]);
      nextPls.push(sum - pls[j]);
    }
    pls = nextPls;
  }
  return pls;
}

// Calculate nearest power of 2 >= count
export function calculateBracketSize(participantCount) {
  let size = 2;
  while (size < participantCount) {
    size *= 2;
  }
  return Math.max(size, 2);
}

// Get round names
export function getRoundName(roundNumber, totalRounds) {
  const roundsRemaining = totalRounds - roundNumber + 1;
  if (roundsRemaining === 1) return 'Final';
  if (roundsRemaining === 2) return 'Semifinals';
  if (roundsRemaining === 3) return 'Quarterfinals';
  if (roundsRemaining === 4) return 'Round of 16';
  if (roundsRemaining === 5) return 'Round of 32';
  return `Round ${roundNumber}`;
}
