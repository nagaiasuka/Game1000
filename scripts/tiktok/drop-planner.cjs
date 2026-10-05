// Pure offline move planning from a screenshot-derived board. Never injects app state.
const fs = require('fs');
const { pathToFileURL } = require('url');
const path = require('path');
(async () => {
  const { cells, fits, ghost, fullRows, removeRows } = await import(pathToFileURL(path.resolve(__dirname, '../../src/games/001/logic/pieces.ts')).href);
  const state = JSON.parse(fs.readFileSync(0, 'utf8'));
  let best;
  for (let rotation = 0; rotation < 4; rotation++) {
    for (let x = -3; x < 10; x++) {
      const piece = { kind: state.kind, rotation, x, y: 0 };
      if (!fits(state.board, piece)) continue;
      const landed = ghost(state.board, piece);
      const board = state.board.map(row => [...row]);
      for (const p of cells(landed)) board[p.y][p.x] = state.kind;
      const lines = fullRows(board);
      const after = removeRows(board, lines);
      const heights = Array.from({ length: 10 }, (_, col) => {
        const y = after.findIndex(row => row[col]);
        return y < 0 ? 0 : 20 - y;
      });
      let holes = 0;
      for (let col = 0; col < 10; col++) {
        for (let y = 20 - heights[col]; y < 20; y++) if (!after[y][col]) holes++;
      }
      const bump = heights.slice(1).reduce((sum, h, i) => sum + Math.abs(h - heights[i]), 0);
      const score = lines.length * 10 - holes * 8 - heights.reduce((a,b)=>a+b,0) * .5 - bump * .4;
      if (!best || score > best.score) best = { rotation, x, lines: lines.length, score };
    }
  }
  console.log(JSON.stringify(best));
})();
