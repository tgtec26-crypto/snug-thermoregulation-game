/**
 * 스프라이트 시트 추출 (v2 — 그리드 자동 감지)
 *
 * 입력 PNG는 5열×4행 그리드인데 캐릭터가 셀 균등 분할 위치에 있지 않음
 *  → 이미지 좌우/상하 여백 + 캐릭터 사이 간격을 자동 탐지해서 처리.
 *
 * 알고리즘:
 *  1) 한 가운데 가로/세로 라인에서 alpha>0 segment 탐지로 5개 캐릭터 x-center, 4개 row y-center 획득
 *  2) row의 y-range는 vertical line으로 측정
 *  3) 각 캐릭터(row, col)의 tight bbox 측정
 *  4) 모든 캐릭터의 max(width, height)를 frame size로 사용 (균등 크기 + 캐릭터 중앙 정렬)
 *  5) row별로 5프레임 가로 스트립 저장 + meta JSON
 */
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROW_NAMES = ['down', 'left', 'up', 'right'];
const COLS = 5, ROWS = 4;

const SOURCES = [
  { file: 'player_korea.png',        outName: 'player_korea' },
  { file: 'player_cold_country.png', outName: 'player_cold'  },
  { file: 'player_hot_country.png',  outName: 'player_hot'   },
];

const dir = path.resolve('public/assets/sprites');

function findSegments(getAlpha, len) {
  // alpha>0 연속 구간들을 반환: [{start, end, center}, ...]
  const segs = [];
  let inSeg = false, start = -1;
  for (let i = 0; i < len; i++) {
    const a = getAlpha(i);
    if (a > 0 && !inSeg) { start = i; inSeg = true; }
    if (a === 0 && inSeg) {
      segs.push({ start, end: i - 1, center: Math.round((start + i - 1) / 2) });
      inSeg = false;
    }
  }
  if (inSeg) segs.push({ start, end: len - 1, center: Math.round((start + len - 1) / 2) });
  return segs;
}

function findCellBBox(data, W, H, cellX, cellY, cellW, cellH) {
  let minX = cellW, maxX = -1, minY = cellH, maxY = -1;
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      const i = ((cellY + y) * W + (cellX + x)) * 4;
      if (data[i + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY };
}

for (const { file, outName } of SOURCES) {
  const srcPath = path.join(dir, file);
  const { data, info } = await sharp(srcPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;

  console.log(`\n${file}: ${W}×${H}`);

  // 1) 행 0의 캐릭터 x-centers: 이미지 상단에서 충분히 안쪽인 y에서 가로 라인 스캔
  // 정확도 위해 여러 y에서 시도하고 5개 segment를 얻는 첫 y를 사용
  let xCenters = null;
  for (let trialY = Math.floor(H * 0.05); trialY < Math.floor(H * 0.25); trialY += 5) {
    const segs = findSegments(i => data[(trialY * W + i) * 4 + 3], W);
    if (segs.length === COLS) { xCenters = segs.map(s => s.center); break; }
  }
  if (!xCenters) {
    console.error(`  Failed to detect 5 character columns. Aborting ${file}.`);
    continue;
  }

  // 2) 각 row의 y-range: 캐릭터 영역을 가로지르는 세로 스트립에서 OR 스캔
  // (단일 x로 스캔하면 캐릭터 안의 작은 alpha=0 gap 때문에 segment가 갈라질 수 있음)
  const cellWForProbe = Math.round((xCenters[xCenters.length - 1] - xCenters[0]) / (COLS - 1));
  const probeHalf = Math.floor(cellWForProbe / 3);  // 캐릭터 중심부 1/3 폭 정도
  const xProbeStart = Math.max(0, xCenters[0] - probeHalf);
  const xProbeEnd   = Math.min(W - 1, xCenters[0] + probeHalf);
  const rowSegs = findSegments(y => {
    for (let x = xProbeStart; x <= xProbeEnd; x++) {
      if (data[(y * W + x) * 4 + 3] > 0) return 1;
    }
    return 0;
  }, H);
  if (rowSegs.length !== ROWS) {
    console.error(`  Failed to detect 4 rows (got ${rowSegs.length}). Aborting ${file}.`);
    continue;
  }
  const rowYRanges = rowSegs.map(r => ({ start: r.start, end: r.end }));

  // 3) 모든 캐릭터(row, col)의 tight bbox 측정 — 캐릭터 중심을 안전 마진(±cellW/2)으로 둘러싼 영역 안에서
  // cellW = 이웃 캐릭터 간 간격 평균
  const cellW = Math.round((xCenters[xCenters.length - 1] - xCenters[0]) / (COLS - 1));
  const halfCellW = Math.floor(cellW / 2);
  const cellBoxes = [];   // [row][col] = { left, top, right, bottom } in image coords
  let frameWmax = 0, frameHmax = 0;
  for (let r = 0; r < ROWS; r++) {
    cellBoxes.push([]);
    const yStart = rowYRanges[r].start;
    const yEnd   = rowYRanges[r].end;
    const rowH = yEnd - yStart + 1;
    for (let c = 0; c < COLS; c++) {
      const xStart = Math.max(0, xCenters[c] - halfCellW);
      const xEnd   = Math.min(W - 1, xCenters[c] + halfCellW);
      // 셀 안에서 tight bbox
      const bx = findCellBBox(data, W, H, xStart, yStart, xEnd - xStart + 1, rowH);
      const absLeft   = xStart + bx.minX;
      const absTop    = yStart + bx.minY;
      const absRight  = xStart + bx.maxX;
      const absBottom = yStart + bx.maxY;
      const w = absRight - absLeft + 1;
      const h = absBottom - absTop + 1;
      cellBoxes[r].push({ left: absLeft, top: absTop, right: absRight, bottom: absBottom, w, h });
      if (w > frameWmax) frameWmax = w;
      if (h > frameHmax) frameHmax = h;
    }
  }

  console.log(`  Detected: cellW≈${cellW}px, rows at y=${rowYRanges.map(r => `${r.start}..${r.end}`).join(', ')}`);
  console.log(`  Frame size: ${frameWmax}×${frameHmax}`);

  // 4) 방향별 5프레임 가로 스트립 (캐릭터 중심을 frame 중심에 위치, 바닥은 frame 바닥에 정렬)
  for (let r = 0; r < ROWS; r++) {
    const stripW = frameWmax * COLS;
    const composites = [];
    for (let c = 0; c < COLS; c++) {
      const box = cellBoxes[r][c];
      const frameBuf = await sharp(srcPath)
        .extract({ left: box.left, top: box.top, width: box.w, height: box.h })
        .toBuffer();
      // 캐릭터를 frame 안에 배치: 가로 중앙, 세로 바닥 정렬 (발을 항상 frame 바닥에)
      const dx = Math.floor((frameWmax - box.w) / 2);
      const dy = frameHmax - box.h;   // 바닥 정렬
      composites.push({ input: frameBuf, left: c * frameWmax + dx, top: dy });
    }
    const outFile = path.join(dir, `${outName}_walk_${ROW_NAMES[r]}.png`);
    await sharp({
      create: { width: stripW, height: frameHmax, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(composites)
      .png()
      .toFile(outFile);
    console.log(`  → ${outName}_walk_${ROW_NAMES[r]}.png (${stripW}×${frameHmax})`);
  }

  // 5) meta JSON
  await fs.writeFile(
    path.join(dir, `${outName}_meta.json`),
    JSON.stringify({ frameWidth: frameWmax, frameHeight: frameHmax, frameCount: COLS }, null, 2),
  );
  console.log(`  → ${outName}_meta.json`);
}

console.log('\nDone.');
