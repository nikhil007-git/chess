import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

// Unicode chess piece glyphs with clean styling
const PIECE_SYMBOLS = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔',
};

export default function Chessboard({ fen, onMove, disabled = false, orientation = 'white' }) {
  const [game, setGame] = useState(new Chess(fen || undefined));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);

  useEffect(() => {
    try {
      const g = new Chess(fen || undefined);
      setGame(g);
      setSelectedSquare(null);
      setPossibleMoves([]);
    } catch (e) {
      console.error('Invalid FEN provided to Chessboard', e);
    }
  }, [fen]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;
  const displayFiles = orientation === 'black' ? [...files].reverse() : files;

  const handleSquareClick = (square) => {
    if (disabled) return;

    // If square is already selected, unselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // If a square was already selected and clicked square is a possible destination
    if (selectedSquare) {
      const move = possibleMoves.find((m) => m.to === square);
      if (move) {
        try {
          const moveResult = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q', // auto-queen for simplicity
          });

          if (moveResult) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            if (onMove) {
              onMove({
                san: moveResult.san,
                from: moveResult.from,
                to: moveResult.to,
                fen: game.fen(),
                isCheckmate: game.isCheckmate(),
                isDraw: game.isDraw(),
                isStalemate: game.isStalemate(),
                turn: game.turn() === 'w' ? 'WHITE' : 'BLACK',
              });
            }
          }
          return;
        } catch (err) {
          console.error('Move error', err);
        }
      }
    }

    // Otherwise select square if it has a piece belonging to current turn
    const piece = game.get(square);
    if (piece) {
      const legalMoves = game.moves({ square, verbose: true });
      setSelectedSquare(square);
      setPossibleMoves(legalMoves);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  return (
    <div className="w-full max-w-[460px] aspect-square select-none rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-900 mx-auto">
      <div className="grid grid-rows-8 h-full w-full">
        {displayRanks.map((rank, rIdx) => (
          <div key={rank} className="grid grid-cols-8 h-full">
            {displayFiles.map((file, fIdx) => {
              const square = `${file}${rank}`;
              const piece = game.get(square);
              const isLight = (rIdx + fIdx) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isPossible = possibleMoves.some((m) => m.to === square);

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/70'
                      : isLight
                      ? 'bg-slate-300 hover:bg-slate-200 text-slate-900'
                      : 'bg-slate-700 hover:bg-slate-650 text-slate-100'
                  }`}
                >
                  {/* Square label on corners */}
                  {fIdx === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[9px] font-bold opacity-60 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span className={`absolute bottom-0.5 right-1 text-[9px] font-bold opacity-60 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {file}
                    </span>
                  )}

                  {/* Move hint dot */}
                  {isPossible && (
                    <span className={`absolute w-3.5 h-3.5 rounded-full z-10 ${piece ? 'ring-4 ring-amber-500 bg-transparent' : 'bg-amber-500/80'}`}></span>
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      className={`text-3xl sm:text-4xl filter drop-shadow font-serif leading-none ${
                        piece.color === 'w' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                      }`}
                    >
                      {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
