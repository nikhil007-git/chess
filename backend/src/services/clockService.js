import prisma from '../db.js';

/**
 * Server-Authoritative Clock Computation (PRD 8.4)
 * Calculates true remaining seconds dynamically based on authoritative last timestamp.
 */
export function getAuthoritativeClockState(match) {
  if (!match) return null;

  let whiteRemaining = match.whiteTimeRemaining;
  let blackRemaining = match.blackTimeRemaining;
  let isFlagFall = false;
  let flaggedPlayer = null;

  if (match.clockStatus === 'RUNNING' && match.lastClockUpdate && match.activePlayer) {
    const elapsedSeconds = (Date.now() - new Date(match.lastClockUpdate).getTime()) / 1000;

    if (match.activePlayer === 'WHITE') {
      whiteRemaining = Math.max(0, match.whiteTimeRemaining - elapsedSeconds);
      if (whiteRemaining === 0) {
        isFlagFall = true;
        flaggedPlayer = 'WHITE';
      }
    } else if (match.activePlayer === 'BLACK') {
      blackRemaining = Math.max(0, match.blackTimeRemaining - elapsedSeconds);
      if (blackRemaining === 0) {
        isFlagFall = true;
        flaggedPlayer = 'BLACK';
      }
    }
  }

  return {
    whiteTimeRemaining: Number(whiteRemaining.toFixed(2)),
    blackTimeRemaining: Number(blackRemaining.toFixed(2)),
    activePlayer: match.activePlayer,
    clockStatus: match.clockStatus,
    serverTimestamp: Date.now(),
    lastClockUpdate: match.lastClockUpdate,
    isFlagFall,
    flaggedPlayer,
  };
}

/**
 * Handle Clock Control Actions (START, SWITCH, PAUSE, RESUME, RESET, ADJUST)
 */
export async function executeClockAction(matchId, action, params = {}, actor = 'ADMIN') {
  return await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
    });

    if (!match) throw new Error('Match not found');

    const now = new Date();
    const currentState = getAuthoritativeClockState(match);
    let updatedWhite = currentState.whiteTimeRemaining;
    let updatedBlack = currentState.blackTimeRemaining;
    let newActivePlayer = match.activePlayer;
    let newClockStatus = match.clockStatus;
    let matchStatus = match.status;

    let eventDetails = '';

    switch (action) {
      case 'START':
        if (match.status === 'COMPLETED') throw new Error('Cannot start clock for completed match');
        newActivePlayer = 'WHITE';
        newClockStatus = 'RUNNING';
        matchStatus = 'IN_PROGRESS';
        eventDetails = 'Clock started with White on move';
        break;

      case 'SWITCH':
        if (match.clockStatus !== 'RUNNING') throw new Error('Cannot switch turn while clock is not running');
        
        // Add increment to the player who just finished move
        if (match.activePlayer === 'WHITE') {
          updatedWhite = updatedWhite + match.incrementSeconds;
          newActivePlayer = 'BLACK';
          eventDetails = `Move completed by White. +${match.incrementSeconds}s increment applied. Black on move.`;
        } else {
          updatedBlack = updatedBlack + match.incrementSeconds;
          newActivePlayer = 'WHITE';
          eventDetails = `Move completed by Black. +${match.incrementSeconds}s increment applied. White on move.`;
        }
        break;

      case 'PAUSE':
        if (match.clockStatus !== 'RUNNING') throw new Error('Clock is not running');
        newClockStatus = 'PAUSED';
        eventDetails = 'Clock paused by arbiter';
        break;

      case 'RESUME':
        if (match.clockStatus !== 'PAUSED' && match.clockStatus !== 'STOPPED') {
          throw new Error('Clock is already running');
        }
        newClockStatus = 'RUNNING';
        if (!newActivePlayer) newActivePlayer = 'WHITE';
        eventDetails = `Clock resumed with ${newActivePlayer} on move`;
        break;

      case 'RESET':
        const initialSeconds = match.timeControlMinutes * 60;
        updatedWhite = initialSeconds;
        updatedBlack = initialSeconds;
        newClockStatus = 'STOPPED';
        newActivePlayer = null;
        matchStatus = 'READY';
        eventDetails = `Clock reset to initial time control (${match.timeControlMinutes} min)`;
        break;

      case 'ADJUST':
        if (!params.reason) {
          throw new Error('An explicit reason must be provided for arbiter time adjustments');
        }
        if (typeof params.whiteSeconds === 'number') {
          updatedWhite = Math.max(0, params.whiteSeconds);
        }
        if (typeof params.blackSeconds === 'number') {
          updatedBlack = Math.max(0, params.blackSeconds);
        }
        eventDetails = `Arbiter manual time adjustment: ${params.reason}. White: ${updatedWhite}s, Black: ${updatedBlack}s`;
        break;

      default:
        throw new Error(`Unknown clock action: ${action}`);
    }

    // Save updated match state
    const updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: {
        whiteTimeRemaining: updatedWhite,
        blackTimeRemaining: updatedBlack,
        activePlayer: newActivePlayer,
        clockStatus: newClockStatus,
        lastClockUpdate: now,
        status: matchStatus,
      },
    });

    // Create Audit Log for time change
    await tx.matchEvent.create({
      data: {
        matchId,
        tournamentId: match.tournamentId,
        actor,
        eventType: `CLOCK_${action}`,
        details: eventDetails,
        beforeValue: JSON.stringify({
          whiteTime: currentState.whiteTimeRemaining,
          blackTime: currentState.blackTimeRemaining,
          activePlayer: match.activePlayer,
          clockStatus: match.clockStatus,
        }),
        afterValue: JSON.stringify({
          whiteTime: updatedWhite,
          blackTime: updatedBlack,
          activePlayer: newActivePlayer,
          clockStatus: newClockStatus,
        }),
      },
    });

    return {
      match: updatedMatch,
      clockState: getAuthoritativeClockState(updatedMatch),
    };
  });
}
