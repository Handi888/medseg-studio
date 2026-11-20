
    (function () {
      const SIZE = 512;
      const TOTAL_PX = SIZE * SIZE;

      // Ground-truth RLE masks computed on 512x512 preset medical scans
      const GT_RLE = {
        mri: [167265,8,167774,15,168284,19,168795,23,169306,25,169816,27,170327,29,170838,31,171349,33,171861,34,172372,35,172883,37,173394,38,173905,40,174417,40,174929,41,175440,42,175952,42,176464,42,176976,42,177488,42,177999,43,178511,43,179023,43,179535,43,180048,41,180560,41,181072,40,181585,38,182097,38,182610,36,183123,34,183635,33,184148,31,184661,28,185174,26,185688,23,186201,21,186715,17,187229,12,187744,8],
        ct: [129139,5,129647,13,130158,16,130669,19,131179,22,131690,24,132201,26,132712,28,133223,30,133735,31,134246,32,134758,32,135269,34,135781,34,136292,36,136804,36,137316,36,137827,37,138339,37,138851,37,139363,37,139875,37,140387,37,140900,36,141413,34,141925,34,142437,34,142950,32,143462,31,143975,29,144488,28,145001,26,145514,24,146027,21,146540,19,147053,16,147568,12,148085,1],
        derm: [92936,1,93446,4,93942,1,93957,6,94453,4,94468,8,94478,3,94958,2,94965,5,94972,1,94974,1,94979,15,95009,1,95469,4,95476,12,95489,21,95519,6,95980,6,95987,36,96024,3,96030,9,96492,60,97003,62,97514,64,98024,66,98530,3,98534,68,99041,73,99545,4,99552,75,100055,85,100565,88,101073,1,101075,89,101584,93,102095,95,102606,97,103117,98,103628,100,104139,102,104648,105,105159,106,105670,108,106182,109,106694,110,107205,112,107318,2,107716,117,108228,118,108740,119,109251,122,109762,126,110273,129,110784,131,111295,134,111806,136,112318,138,112829,140,113341,140,113854,139,114366,140,114877,142,115389,142,115901,143,116412,144,116923,145,117436,144,117948,145,118459,145,118970,146,119480,148,119991,148,120502,150,121014,150,121526,150,122037,152,122549,151,123060,152,123573,150,124084,151,124595,151,125106,151,125618,151,126130,151,126642,151,127154,151,127665,152,128176,152,128687,152,129198,153,129711,153,130223,152,130734,153,131246,154,131758,154,132271,153,132784,151,133297,150,133808,150,134320,150,134832,150,135345,150,135857,151,136370,150,136883,149,137395,148,137907,148,138420,146,138932,145,139444,145,139955,146,140467,145,140979,144,141492,142,142004,142,142516,143,143029,142,143542,141,144055,141,144568,140,145081,138,145594,134,145729,1,146107,132,146619,131,147130,132,147643,130,148158,123,148282,2,148671,121,149184,119,149696,118,150208,117,150719,118,151231,117,151743,117,152255,116,152768,115,153279,116,153792,114,154304,113,154817,111,155329,110,155842,108,156355,106,156869,103,157382,101,157896,1,157898,96,158411,94,158924,92,159436,91,159949,90,160461,4,160466,84,160974,2,160979,6,160986,76,161492,4,161500,74,162005,2,162014,71,162529,2,162532,64,163047,60,163560,59,164073,57,164586,56,165098,55,165611,53,166124,4,166130,9,166141,33,166636,3,166647,3,166654,4,166659,26,167149,1,167160,1,167172,24,167685,3,167690,17,168206,12,168721,8,169234,6]
      };

      const PRESET_CASES = {
        mri: {
          id: 'mri',
          title: '脑部 T1c 增强 MRI（轴位）',
          tag: 'MRI · 512×512 · 0.45mm/px',
          desc: '右侧顶枕叶脑实质内见类圆形明显均匀强化高信号靶病灶（像素质心 356, 346），边界锐利清晰，周围伴轻度低信号水肿带。',
          src: "assets/scan-mri.jpg",
          polarity: 'bright',
          spacing: 0.45,
          seed: { x: 356, y: 346 },
          tolerance: 42,
          baseAutoThr: 175
        },
        ct: {
          id: 'ct',
          title: '胸部 CT 肺窗（孤立性肺结节）',
          tag: 'CT Lung · 512×512 · 0.68mm/px',
          desc: '右肺中下叶外带含气肺实质内见孤立性类圆形高密度实性结节（像素质心 117, 270），与邻近细小肺血管分支毗邻。',
          src: "assets/scan-ct.jpg",
          polarity: 'bright',
          spacing: 0.68,
          seed: { x: 117, y: 270 },
          tolerance: 46,
          baseAutoThr: 172
        },
        derm: {
          id: 'derm',
          title: '皮肤镜色素性病灶（偏振光）',
          tag: 'Dermoscopy · 512×512 · 0.05mm/px',
          desc: '偏振光视野中央见深褐色网状色素沉着斑块（像素质心 254, 255），与周围浅肤色表皮形成显著双峰灰阶梯度。',
          src: "assets/scan-derm.jpg",
          polarity: 'dark',
          spacing: 0.05,
          seed: { x: 254, y: 255 },
          tolerance: 52,
          baseAutoThr: 120
        }
      };

      let userSwitchedSample = false;
      // Application State
      const state = {
        activeCaseId: 'mri',
        mode: 'region',
        polarity: 'bright',
        spacingMm: 0.45,
        seed: { x: 356, y: 346 },
        regionTol: 42,
        autoSens: 0,
        minAreaPx: 80,
        otsuThr: 172,
        keepLargest: true,
        brushAction: 'add',
        brushRadius: 10,
        ww: 255,
        wl: 128,
        invert: false,
        maskOpacity: 0.45,
        showContour: true,
        showCaliper: true,
        showGt: true,
        splitWipe: false,
        splitRatio: 0.5,
        cursor: null,
        isPainting: false,
        rawRgba: new Uint8ClampedArray(TOTAL_PX * 4),
        gray: new Uint8Array(TOTAL_PX),
        mask: new Uint8Array(TOTAL_PX),
        gtMask: null,
        undoStack: [],
        candidates: [],
        selectedCandidateIdx: -1,
        lastMetrics: null
      };

      // Offscreen buffer canvases
      const offRawCanvas = document.createElement('canvas');
      offRawCanvas.width = SIZE;
      offRawCanvas.height = SIZE;
      const offRawCtx = offRawCanvas.getContext('2d', { willReadFrequently: true });

      const baseRenderCanvas = document.createElement('canvas');
      baseRenderCanvas.width = SIZE;
      baseRenderCanvas.height = SIZE;
      const baseRenderCtx = baseRenderCanvas.getContext('2d');

      const overlayRenderCanvas = document.createElement('canvas');
      overlayRenderCanvas.width = SIZE;
      overlayRenderCanvas.height = SIZE;
      const overlayRenderCtx = overlayRenderCanvas.getContext('2d');

      const medCanvas = document.getElementById('medCanvas');
      const medCtx = medCanvas.getContext('2d');

      let histChart = null;
      let toastTimer = null;

      function showToast(msg) {
        const banner = document.getElementById('toastBanner');
        const txt = document.getElementById('toastText');
        txt.textContent = msg;
        banner.classList.remove('hidden');
        banner.classList.add('flex');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          banner.classList.add('hidden');
          banner.classList.remove('flex');
        }, 2800);
      }

      function decodeRle(rle) {
        const out = new Uint8Array(TOTAL_PX);
        if (!rle) return out;
        for (let i = 0; i < rle.length; i += 2) {
          const start = rle[i];
          const len = rle[i + 1];
          out.fill(1, start, Math.min(TOTAL_PX, start + len));
        }
        return out;
      }

      function pushUndo() {
        state.undoStack.push(new Uint8Array(state.mask));
        if (state.undoStack.length > 15) {
          state.undoStack.shift();
        }
      }

      function dilate3x3(src) {
        const dst = new Uint8Array(TOTAL_PX);
        for (let y = 1; y < SIZE - 1; y++) {
          const row = y * SIZE;
          for (let x = 1; x < SIZE - 1; x++) {
            const idx = row + x;
            if (
              src[idx] ||
              src[idx - 1] || src[idx + 1] ||
              src[idx - SIZE] || src[idx + SIZE] ||
              src[idx - SIZE - 1] || src[idx - SIZE + 1] ||
              src[idx + SIZE - 1] || src[idx + SIZE + 1]
            ) {
              dst[idx] = 1;
            }
          }
        }
        return dst;
      }

      function erode3x3(src) {
        const dst = new Uint8Array(TOTAL_PX);
        for (let y = 1; y < SIZE - 1; y++) {
          const row = y * SIZE;
          for (let x = 1; x < SIZE - 1; x++) {
            const idx = row + x;
            if (
              src[idx] &&
              src[idx - 1] && src[idx + 1] &&
              src[idx - SIZE] && src[idx + SIZE] &&
              src[idx - SIZE - 1] && src[idx - SIZE + 1] &&
              src[idx + SIZE - 1] && src[idx + SIZE + 1]
            ) {
              dst[idx] = 1;
            }
          }
        }
        return dst;
      }

      function fillInteriorHoles(src) {
        const visited = new Uint8Array(TOTAL_PX);
        const queue = new Int32Array(TOTAL_PX);
        let head = 0, tail = 0;

        for (let x = 0; x < SIZE; x++) {
          const top = x;
          const bot = (SIZE - 1) * SIZE + x;
          if (!src[top] && !visited[top]) { visited[top] = 1; queue[tail++] = top; }
          if (!src[bot] && !visited[bot]) { visited[bot] = 1; queue[tail++] = bot; }
        }
        for (let y = 1; y < SIZE - 1; y++) {
          const left = y * SIZE;
          const right = left + SIZE - 1;
          if (!src[left] && !visited[left]) { visited[left] = 1; queue[tail++] = left; }
          if (!src[right] && !visited[right]) { visited[right] = 1; queue[tail++] = right; }
        }

        while (head < tail) {
          const cur = queue[head++];
          const cx = cur % SIZE;
          const cy = (cur / SIZE) | 0;
          if (cx > 0) {
            const n = cur - 1;
            if (!src[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
          }
          if (cx < SIZE - 1) {
            const n = cur + 1;
            if (!src[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
          }
          if (cy > 0) {
            const n = cur - SIZE;
            if (!src[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
          }
          if (cy < SIZE - 1) {
            const n = cur + SIZE;
            if (!src[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
          }
        }

        const out = new Uint8Array(TOTAL_PX);
        for (let i = 0; i < TOTAL_PX; i++) {
          out[i] = visited[i] ? 0 : 1;
        }
        return out;
      }

      // Algorithm 1: Seeded Region Growing
      function runRegionGrowing() {
        const sx = Math.max(1, Math.min(SIZE - 2, Math.round(state.seed.x)));
        const sy = Math.max(1, Math.min(SIZE - 2, Math.round(state.seed.y)));

        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += state.gray[(sy + dy) * SIZE + (sx + dx)];
          }
        }
        const seedMean = sum / 9;
        const tol = state.regionTol;
        const low = seedMean - tol;
        const high = seedMean + tol;

        const out = new Uint8Array(TOTAL_PX);
        const visited = new Uint8Array(TOTAL_PX);
        const queue = new Int32Array(TOTAL_PX);
        let head = 0, tail = 0;

        const startIdx = sy * SIZE + sx;
        visited[startIdx] = 1;
        out[startIdx] = 1;
        queue[tail++] = startIdx;

        const maxAllowed = Math.floor(TOTAL_PX * 0.35);
        let count = 1;

        while (head < tail && count < maxAllowed) {
          const cur = queue[head++];
          const cx = cur % SIZE;
          const cy = (cur / SIZE) | 0;

          for (let dy = -1; dy <= 1; dy++) {
            const ny = cy + dy;
            if (ny < 1 || ny >= SIZE - 1) continue;
            const row = ny * SIZE;
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              if (nx < 1 || nx >= SIZE - 1) continue;
              const nIdx = row + nx;
              if (!visited[nIdx]) {
                visited[nIdx] = 1;
                const val = state.gray[nIdx];
                if (val >= low && val <= high) {
                  out[nIdx] = 1;
                  queue[tail++] = nIdx;
                  count++;
                }
              }
            }
          }
        }

        const closed = erode3x3(dilate3x3(out));
        state.mask = fillInteriorHoles(closed);
      }

      // Compute Otsu Threshold on non-black FOV pixels
      function computeOtsuThreshold() {
        const hist = new Float64Array(256);
        let total = 0;
        for (let y = 0; y < SIZE; y++) {
          const dy = y - 256;
          for (let x = 0; x < SIZE; x++) {
            const dx = x - 256;
            if (dx * dx + dy * dy > 230 * 230) continue;
            const g = state.gray[y * SIZE + x];
            if (g > 12) {
              hist[g]++;
              total++;
            }
          }
        }
        if (total < 100) return 128;

        let sumAll = 0;
        for (let t = 0; t < 256; t++) sumAll += t * hist[t];

        let sumB = 0;
        let wB = 0;
        let maxVar = -1;
        let bestT = 128;

        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (wB === 0) continue;
          const wF = total - wB;
          if (wF === 0) break;
          sumB += t * hist[t];
          const mB = sumB / wB;
          const mF = (sumAll - sumB) / wF;
          const between = wB * wF * (mB - mF) * (mB - mF);
          if (between > maxVar) {
            maxVar = between;
            bestT = t;
          }
        }
        return bestT;
      }

      // Algorithm 2: Connected-Component CAD Auto Lesion Detection with Surround-Ring Contrast Scoring
      function scanCandidateLesions(applyToMask) {
        const preset = PRESET_CASES[state.activeCaseId];
        const baseThr = preset ? preset.baseAutoThr : computeOtsuThreshold();
        let thr;
        if (state.polarity === 'bright') {
          thr = Math.max(25, Math.min(245, baseThr - state.autoSens));
        } else {
          thr = Math.max(15, Math.min(235, baseThr + state.autoSens));
        }

        const bw = new Uint8Array(TOTAL_PX);
        for (let y = 8; y < SIZE - 8; y++) {
          const dy = y - 256;
          const row = y * SIZE;
          for (let x = 8; x < SIZE - 8; x++) {
            const dx = x - 256;
            if (dx * dx + dy * dy > 224 * 224) continue;
            const g = state.gray[row + x];
            if (state.polarity === 'bright') {
              if (g >= thr) bw[row + x] = 1;
            } else {
              if (g <= thr && g > 8) bw[row + x] = 1;
            }
          }
        }

        const opened = dilate3x3(erode3x3(bw));
        const labels = new Int32Array(TOTAL_PX);
        const queue = new Int32Array(TOTAL_PX);
        let nextLabel = 0;
        const rawCands = [];

        for (let i = 0; i < TOTAL_PX; i++) {
          if (!opened[i] || labels[i]) continue;
          nextLabel++;
          let head = 0, tail = 0;
          labels[i] = nextLabel;
          queue[tail++] = i;

          let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
          let sumX = 0, sumY = 0, sumInt = 0;
          let perim = 0;
          const pixels = [];

          while (head < tail) {
            const cur = queue[head++];
            pixels.push(cur);
            const cx = cur % SIZE;
            const cy = (cur / SIZE) | 0;
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
            sumX += cx;
            sumY += cy;
            sumInt += state.gray[cur];

            let isBoundary = false;
            for (let dy = -1; dy <= 1; dy++) {
              const ny = cy + dy;
              if (ny < 0 || ny >= SIZE) { isBoundary = true; continue; }
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = cx + dx;
                if (nx < 0 || nx >= SIZE) { isBoundary = true; continue; }
                const nIdx = ny * SIZE + nx;
                if (!opened[nIdx]) {
                  if (dx === 0 || dy === 0) isBoundary = true;
                } else if (!labels[nIdx]) {
                  labels[nIdx] = nextLabel;
                  queue[tail++] = nIdx;
                }
              }
            }
            if (isBoundary) perim++;
          }

          const area = pixels.length;
          if (area < state.minAreaPx || area > 42000) continue;

          const w = maxX - minX + 1;
          const h = maxY - minY + 1;
          const aspect = w / h;
          const extent = area / (w * h);
          if (aspect < 0.38 || aspect > 2.6 || extent < 0.34) continue;

          const cxMean = sumX / area;
          const cyMean = sumY / area;
          const meanIn = sumInt / area;

          const eqR = Math.sqrt(area / Math.PI);
          const rInner = eqR + 5;
          const rOuter = eqR + 16;
          let ringSum = 0, ringCnt = 0;
          for (let a = 0; a < 24; a++) {
            const ang = (a / 24) * Math.PI * 2;
            const cosA = Math.cos(ang), sinA = Math.sin(ang);
            for (const rad of [rInner, (rInner + rOuter) * 0.5, rOuter]) {
              const rx = Math.round(cxMean + cosA * rad);
              const ry = Math.round(cyMean + sinA * rad);
              if (rx >= 4 && rx < SIZE - 4 && ry >= 4 && ry < SIZE - 4) {
                const rIdx = ry * SIZE + rx;
                if (labels[rIdx] !== nextLabel) {
                  ringSum += state.gray[rIdx];
                  ringCnt++;
                }
              }
            }
          }
          const meanRing = ringCnt > 0 ? ringSum / ringCnt : 128;
          const contrast = state.polarity === 'bright' ? (meanIn - meanRing) : (meanRing - meanIn);
          if (contrast < 18) continue;

          const circ = Math.min(1, (4 * Math.PI * area) / Math.max(1, perim * perim * 1.25));
          const maxPxDiam = Math.hypot(w, h) * 0.86;
          const score = Math.min(99, Math.round(
            Math.min(1, contrast / 135) * 55 + circ * 25 + Math.min(1, extent / 0.78) * 20
          ));

          rawCands.push({
            labelId: nextLabel,
            pixels,
            area,
            cx: cxMean,
            cy: cyMean,
            minX, maxX, minY, maxY,
            diamMm: maxPxDiam * state.spacingMm,
            areaMm2: area * state.spacingMm * state.spacingMm,
            circ,
            contrast,
            score
          });
        }

        rawCands.sort((a, b) => b.score - a.score || b.area - a.area);
        state.candidates = rawCands.slice(0, 6);

        if (applyToMask) {
          if (state.candidates.length > 0) {
            selectCandidateLesion(0);
          } else {
            state.mask.fill(0);
            state.selectedCandidateIdx = -1;
          }
        }
        renderCandidatesTable();
      }

      function selectCandidateLesion(idx) {
        const cand = state.candidates[idx];
        if (!cand) return;
        state.selectedCandidateIdx = idx;
        const m = new Uint8Array(TOTAL_PX);
        for (let i = 0; i < cand.pixels.length; i++) {
          m[cand.pixels[i]] = 1;
        }
        state.mask = fillInteriorHoles(dilate3x3(m));
        state.seed = { x: Math.round(cand.cx), y: Math.round(cand.cy) };
        document.getElementById('seedCoordLabel').textContent = `(${state.seed.x}, ${state.seed.y})`;
        renderCandidatesTable();
        updateAllVisualsAndMetrics();
      }

      // Algorithm 3: Otsu / Threshold Segmentation
      function runOtsuSegmentation() {
        const thr = state.otsuThr;
        const bw = new Uint8Array(TOTAL_PX);
        for (let y = 6; y < SIZE - 6; y++) {
          const dy = y - 256;
          const row = y * SIZE;
          for (let x = 6; x < SIZE - 6; x++) {
            const dx = x - 256;
            if (dx * dx + dy * dy > 224 * 224) continue;
            const g = state.gray[row + x];
            if (state.polarity === 'bright') {
              if (g >= thr) bw[row + x] = 1;
            } else {
              if (g <= thr && g > 8) bw[row + x] = 1;
            }
          }
        }

        let cleaned = dilate3x3(erode3x3(bw));

        if (state.keepLargest) {
          const labels = new Int32Array(TOTAL_PX);
          const queue = new Int32Array(TOTAL_PX);
          let curLabel = 0;
          let bestPixels = null;
          let bestRank = -1;

          for (let i = 0; i < TOTAL_PX; i++) {
            if (!cleaned[i] || labels[i]) continue;
            curLabel++;
            let head = 0, tail = 0;
            labels[i] = curLabel;
            queue[tail++] = i;
            let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
            const pxList = [];
            let containsSeed = false;
            const seedIdx = Math.round(state.seed.y) * SIZE + Math.round(state.seed.x);

            while (head < tail) {
              const c = queue[head++];
              if (c === seedIdx) containsSeed = true;
              pxList.push(c);
              const cx = c % SIZE, cy = (c / SIZE) | 0;
              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              if (cx > 0 && cleaned[c - 1] && !labels[c - 1]) { labels[c - 1] = curLabel; queue[tail++] = c - 1; }
              if (cx < SIZE - 1 && cleaned[c + 1] && !labels[c + 1]) { labels[c + 1] = curLabel; queue[tail++] = c + 1; }
              if (cy > 0 && cleaned[c - SIZE] && !labels[c - SIZE]) { labels[c - SIZE] = curLabel; queue[tail++] = c - SIZE; }
              if (cy < SIZE - 1 && cleaned[c + SIZE] && !labels[c + SIZE]) { labels[c + SIZE] = curLabel; queue[tail++] = c + SIZE; }
            }

            if (pxList.length < 30 || pxList.length > 60000) continue;
            const extent = pxList.length / Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
            const rank = (containsSeed ? 1e7 : 0) + pxList.length * extent;
            if (rank > bestRank) {
              bestRank = rank;
              bestPixels = pxList;
            }
          }

          const single = new Uint8Array(TOTAL_PX);
          if (bestPixels) {
            for (let i = 0; i < bestPixels.length; i++) single[bestPixels[i]] = 1;
          }
          cleaned = fillInteriorHoles(single);
        }

        state.mask = cleaned;
      }

      function applyBrushAt(cx, cy) {
        const r = state.brushRadius;
        const r2 = r * r;
        const val = state.brushAction === 'add' ? 1 : 0;
        const y0 = Math.max(0, Math.floor(cy - r));
        const y1 = Math.min(SIZE - 1, Math.ceil(cy + r));
        const x0 = Math.max(0, Math.floor(cx - r));
        const x1 = Math.min(SIZE - 1, Math.ceil(cx + r));

        for (let y = y0; y <= y1; y++) {
          const dy = y - cy;
          const row = y * SIZE;
          for (let x = x0; x <= x1; x++) {
            const dx = x - cx;
            if (dx * dx + dy * dy <= r2) {
              state.mask[row + x] = val;
            }
          }
        }
      }

      // Render Windowed Base Image & Segmentation Overlay
      function renderViewport() {
        const baseImgData = baseRenderCtx.createImageData(SIZE, SIZE);
        const bData = baseImgData.data;

        const ww = Math.max(1, state.ww);
        const lower = state.wl - ww / 2;
        const isDermColor = state.activeCaseId === 'derm' || state.isColorUpload;

        for (let i = 0; i < TOTAL_PX; i++) {
          const p4 = i * 4;
          if (isDermColor && state.ww === 255 && state.wl === 128 && !state.invert) {
            bData[p4] = state.rawRgba[p4];
            bData[p4 + 1] = state.rawRgba[p4 + 1];
            bData[p4 + 2] = state.rawRgba[p4 + 2];
            bData[p4 + 3] = 255;
          } else if (isDermColor) {
            for (let c = 0; c < 3; c++) {
              let v = ((state.rawRgba[p4 + c] - lower) / ww) * 255;
              v = v < 0 ? 0 : (v > 255 ? 255 : v);
              if (state.invert) v = 255 - v;
              bData[p4 + c] = v;
            }
            bData[p4 + 3] = 255;
          } else {
            let v = ((state.gray[i] - lower) / ww) * 255;
            v = v < 0 ? 0 : (v > 255 ? 255 : v);
            if (state.invert) v = 255 - v;
            bData[p4] = v;
            bData[p4 + 1] = v;
            bData[p4 + 2] = v;
            bData[p4 + 3] = 255;
          }
        }
        baseRenderCtx.putImageData(baseImgData, 0, 0);

        overlayRenderCtx.drawImage(baseRenderCanvas, 0, 0);
        const ovImgData = overlayRenderCtx.getImageData(0, 0, SIZE, SIZE);
        const oData = ovImgData.data;
        const alpha = state.maskOpacity;

        for (let y = 1; y < SIZE - 1; y++) {
          const row = y * SIZE;
          for (let x = 1; x < SIZE - 1; x++) {
            const idx = row + x;
            const p4 = idx * 4;

            if (state.mask[idx]) {
              const isEdge = !state.mask[idx - 1] || !state.mask[idx + 1] || !state.mask[idx - SIZE] || !state.mask[idx + SIZE];
              if (state.showContour && isEdge) {
                oData[p4] = 255;
                oData[p4 + 1] = 133;
                oData[p4 + 2] = 190;
              } else if (alpha > 0) {
                oData[p4] = oData[p4] * (1 - alpha) + 255 * alpha;
                oData[p4 + 1] = oData[p4 + 1] * (1 - alpha) + 92 * alpha;
                oData[p4 + 2] = oData[p4 + 2] * (1 - alpha) + 164 * alpha;
              }
            }

            if (state.showGt && state.gtMask && state.gtMask[idx]) {
              const gtEdge = !state.gtMask[idx - 1] || !state.gtMask[idx + 1] || !state.gtMask[idx - SIZE] || !state.gtMask[idx + SIZE];
              if (gtEdge && ((x + y) % 6 < 4)) {
                oData[p4] = 52;
                oData[p4 + 1] = 211;
                oData[p4 + 2] = 153;
              }
            }
          }
        }
        overlayRenderCtx.putImageData(ovImgData, 0, 0);

        if (state.mode === 'auto' && state.candidates.length > 0) {
          overlayRenderCtx.save();
          overlayRenderCtx.font = '600 11px "JetBrains Mono", monospace';
          state.candidates.forEach((c, idx) => {
            const isSel = idx === state.selectedCandidateIdx;
            overlayRenderCtx.strokeStyle = isSel ? '#38bdf8' : 'rgba(251, 191, 36, 0.78)';
            overlayRenderCtx.lineWidth = isSel ? 1.8 : 1.2;
            const pad = 5;
            const bx = Math.max(2, c.minX - pad);
            const by = Math.max(2, c.minY - pad);
            const bw = Math.min(SIZE - bx - 2, (c.maxX - c.minX) + pad * 2);
            const bh = Math.min(SIZE - by - 2, (c.maxY - c.minY) + pad * 2);
            overlayRenderCtx.strokeRect(bx, by, bw, bh);

            const tag = `#L${idx + 1} ${c.score}%`;
            const tw = overlayRenderCtx.measureText(tag).width + 8;
            overlayRenderCtx.fillStyle = isSel ? 'rgba(14, 165, 233, 0.92)' : 'rgba(15, 23, 42, 0.88)';
            overlayRenderCtx.fillRect(bx, Math.max(0, by - 16), tw, 16);
            overlayRenderCtx.fillStyle = isSel ? '#082f49' : '#fde68a';
            overlayRenderCtx.fillText(tag, bx + 4, Math.max(11, by - 4));
          });
          overlayRenderCtx.restore();
        }

        if (state.showCaliper && state.lastMetrics && state.lastMetrics.areaPx > 0 && state.lastMetrics.feretP1) {
          const { feretP1, feretP2, maxDiamMm } = state.lastMetrics;
          overlayRenderCtx.save();
          overlayRenderCtx.strokeStyle = '#fbbf24';
          overlayRenderCtx.lineWidth = 1.8;
          overlayRenderCtx.setLineDash([4, 3]);
          overlayRenderCtx.beginPath();
          overlayRenderCtx.moveTo(feretP1.x, feretP1.y);
          overlayRenderCtx.lineTo(feretP2.x, feretP2.y);
          overlayRenderCtx.stroke();
          overlayRenderCtx.setLineDash([]);

          for (const pt of [feretP1, feretP2]) {
            overlayRenderCtx.fillStyle = '#fbbf24';
            overlayRenderCtx.beginPath();
            overlayRenderCtx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            overlayRenderCtx.fill();
          }

          const mx = (feretP1.x + feretP2.x) * 0.5;
          const my = (feretP1.y + feretP2.y) * 0.5 - 8;
          const lbl = `${maxDiamMm.toFixed(1)} mm`;
          overlayRenderCtx.font = '600 11px "JetBrains Mono", monospace';
          const w = overlayRenderCtx.measureText(lbl).width + 8;
          overlayRenderCtx.fillStyle = 'rgba(9, 14, 26, 0.88)';
          overlayRenderCtx.fillRect(mx - w / 2, my - 11, w, 15);
          overlayRenderCtx.fillStyle = '#fde68a';
          overlayRenderCtx.fillText(lbl, mx - w / 2 + 4, my);
          overlayRenderCtx.restore();
        }

        if (state.mode === 'region') {
          overlayRenderCtx.save();
          overlayRenderCtx.strokeStyle = '#f43f5e';
          overlayRenderCtx.lineWidth = 1.5;
          const sx = state.seed.x, sy = state.seed.y;
          overlayRenderCtx.beginPath();
          overlayRenderCtx.moveTo(sx - 7, sy); overlayRenderCtx.lineTo(sx - 2, sy);
          overlayRenderCtx.moveTo(sx + 2, sy); overlayRenderCtx.lineTo(sx + 7, sy);
          overlayRenderCtx.moveTo(sx, sy - 7); overlayRenderCtx.lineTo(sx, sy - 2);
          overlayRenderCtx.moveTo(sx, sy + 2); overlayRenderCtx.lineTo(sx, sy + 7);
          overlayRenderCtx.stroke();
          overlayRenderCtx.restore();
        }

        medCtx.clearRect(0, 0, SIZE, SIZE);
        if (state.splitWipe) {
          const splitX = Math.round(SIZE * state.splitRatio);
          medCtx.drawImage(baseRenderCanvas, 0, 0);
          medCtx.save();
          medCtx.beginPath();
          medCtx.rect(splitX, 0, SIZE - splitX, SIZE);
          medCtx.clip();
          medCtx.drawImage(overlayRenderCanvas, 0, 0);
          medCtx.restore();

          medCtx.save();
          medCtx.strokeStyle = '#38bdf8';
          medCtx.lineWidth = 2;
          medCtx.beginPath();
          medCtx.moveTo(splitX, 0);
          medCtx.lineTo(splitX, SIZE);
          medCtx.stroke();
          medCtx.fillStyle = '#38bdf8';
          medCtx.beginPath();
          medCtx.arc(splitX, SIZE / 2, 10, 0, Math.PI * 2);
          medCtx.fill();
          medCtx.fillStyle = '#041322';
          medCtx.font = 'bold 10px sans-serif';
          medCtx.fillText('↔', splitX - 5, SIZE / 2 + 3.5);
          medCtx.restore();
        } else {
          medCtx.drawImage(overlayRenderCanvas, 0, 0);
        }

        if (state.mode === 'brush' && state.cursor) {
          medCtx.save();
          medCtx.strokeStyle = state.brushAction === 'add' ? '#ff85be' : '#7dd3fc';
          medCtx.lineWidth = 1.5;
          medCtx.beginPath();
          medCtx.arc(state.cursor.x, state.cursor.y, state.brushRadius, 0, Math.PI * 2);
          medCtx.stroke();
          medCtx.restore();
        }
      }

      // Compute Morphometric & Overlap Metrics
      // Boundary pixels of a binary mask (4-neighbourhood), subsampled for speed.
      function maskBoundary(m, cap) {
        const pts = [];
        for (let y = 1; y < SIZE - 1; y++) {
          const row = y * SIZE;
          for (let x = 1; x < SIZE - 1; x++) {
            const i = row + x;
            if (m[i] && (!m[i - 1] || !m[i + 1] || !m[i - SIZE] || !m[i + SIZE])) pts.push(x, y);
          }
        }
        const n = pts.length / 2;
        if (n <= cap) return pts;
        const step = n / cap, out = [];
        for (let k = 0; k < cap; k++) { const j = Math.floor(k * step) * 2; out.push(pts[j], pts[j + 1]); }
        return out;
      }

      function directedDistances(a, b) {
        const d = new Float32Array(a.length / 2);
        for (let i = 0; i < a.length; i += 2) {
          let best = Infinity;
          for (let j = 0; j < b.length; j += 2) {
            const dx = a[i] - b[j], dy = a[i + 1] - b[j + 1];
            const v = dx * dx + dy * dy;
            if (v < best) { best = v; if (v === 0) break; }
          }
          d[i / 2] = Math.sqrt(best);
        }
        return d;
      }

      // Symmetric 95th-percentile Hausdorff distance and average symmetric surface distance (mm).
      function surfaceDistances(pred, ref) {
        const a = maskBoundary(pred, 1400), b = maskBoundary(ref, 1400);
        if (!a.length || !b.length) return { hd95: null, assd: null };
        const all = Array.from(directedDistances(a, b)).concat(Array.from(directedDistances(b, a)));
        const sum = all.reduce((s, v) => s + v, 0);
        all.sort((x, y) => x - y);
        const hd95 = all[Math.min(all.length - 1, Math.floor(0.95 * (all.length - 1)))];
        return { hd95: hd95 * state.spacingMm, assd: (sum / all.length) * state.spacingMm };
      }

      function qualityGrade(dice) {
        if (dice === null || dice === undefined) return { label: '待对比', tone: 'idle' };
        if (dice >= 0.9) return { label: '优秀 ✿', tone: 'great' };
        if (dice >= 0.8) return { label: '良好 ♪', tone: 'good' };
        if (dice >= 0.7) return { label: '一般', tone: 'fair' };
        return { label: '需修正', tone: 'poor' };
      }

      function computeMetrics() {
        let areaPx = 0;
        let perimPx = 0;
        let sumX = 0, sumY = 0;
        let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
        let sumGray = 0, sumGraySq = 0;
        const boundaryPts = [];

        for (let y = 1; y < SIZE - 1; y++) {
          const row = y * SIZE;
          for (let x = 1; x < SIZE - 1; x++) {
            const idx = row + x;
            if (state.mask[idx]) {
              areaPx++;
              sumX += x;
              sumY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              const g = state.gray[idx];
              sumGray += g;
              sumGraySq += g * g;

              if (!state.mask[idx - 1] || !state.mask[idx + 1] || !state.mask[idx - SIZE] || !state.mask[idx + SIZE]) {
                perimPx++;
                boundaryPts.push({ x, y });
              }
            }
          }
        }

        const sp = state.spacingMm;
        const areaMm2 = areaPx * sp * sp;
        const eqDiamMm = areaPx > 0 ? 2 * Math.sqrt(areaMm2 / Math.PI) : 0;
        const perimMm = perimPx * sp * 1.08;
        const circ = areaPx > 0 && perimPx > 0
          ? Math.min(1, (4 * Math.PI * areaPx) / (perimPx * perimPx * 1.18))
          : 0;

        let maxDistSq = 0;
        let feretP1 = null, feretP2 = null;
        if (boundaryPts.length > 1) {
          const step = Math.max(1, Math.floor(boundaryPts.length / 180));
          for (let i = 0; i < boundaryPts.length; i += step) {
            const p1 = boundaryPts[i];
            for (let j = i + step; j < boundaryPts.length; j += step) {
              const p2 = boundaryPts[j];
              const d2 = (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
              if (d2 > maxDistSq) {
                maxDistSq = d2;
                feretP1 = p1;
                feretP2 = p2;
              }
            }
          }
        }
        const maxDiamMm = Math.sqrt(maxDistSq) * sp;
        const meanG = areaPx > 0 ? sumGray / areaPx : 0;
        const stdG = areaPx > 0 ? Math.sqrt(Math.max(0, sumGraySq / areaPx - meanG * meanG)) : 0;
        const cx = areaPx > 0 ? sumX / areaPx : 0;
        const cy = areaPx > 0 ? sumY / areaPx : 0;

        let bgSum = 0, bgCnt = 0;
        if (areaPx > 0) {
          const pad = 12;
          const bx0 = Math.max(2, minX - pad), bx1 = Math.min(SIZE - 3, maxX + pad);
          const by0 = Math.max(2, minY - pad), by1 = Math.min(SIZE - 3, maxY + pad);
          for (let y = by0; y <= by1; y += 2) {
            const row = y * SIZE;
            for (let x = bx0; x <= bx1; x += 2) {
              if (!state.mask[row + x]) {
                bgSum += state.gray[row + x];
                bgCnt++;
              }
            }
          }
        }
        const bgMean = bgCnt > 0 ? bgSum / bgCnt : 0;
        const deltaI = areaPx > 0 ? (meanG - bgMean) : 0;

        let dice = null, iou = null, recall = null, precision = null;
        if (state.gtMask) {
          let tp = 0, fp = 0, fn = 0;
          for (let i = 0; i < TOTAL_PX; i++) {
            const p = state.mask[i] === 1;
            const g = state.gtMask[i] === 1;
            if (p && g) tp++;
            else if (p && !g) fp++;
            else if (!p && g) fn++;
          }
          const denomDice = 2 * tp + fp + fn;
          const denomIou = tp + fp + fn;
          dice = denomDice > 0 ? (2 * tp) / denomDice : 0;
          iou = denomIou > 0 ? tp / denomIou : 0;
          recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
          precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        }
        let hd95 = null, assd = null;
        if (state.gtMask && areaPx > 0 && !state.isPainting) {
          ({ hd95, assd } = surfaceDistances(state.mask, state.gtMask));
        } else if (state.isPainting && state.lastMetrics) {
          hd95 = state.lastMetrics.hd95; assd = state.lastMetrics.assd;
        }
        const recistMeasurable = maxDiamMm >= 10;

        state.lastMetrics = {
          areaPx, areaMm2, eqDiamMm, maxDiamMm, perimMm, circ,
          meanG, stdG, cx, cy, minX, maxX, minY, maxY, deltaI,
          feretP1, feretP2, dice, iou, recall, precision, hd95, assd, recistMeasurable
        };

        document.getElementById('restNote').hidden = areaPx > 0;
        const pill = document.getElementById('lesionStatusPill');
        if (areaPx > 0) {
          pill.textContent = '已分割目标病灶';
          pill.className = 'rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300';
          document.getElementById('metricAreaMm').textContent = `${areaMm2.toFixed(1)} mm²`;
          document.getElementById('metricAreaPx').textContent = `${areaPx.toLocaleString()} px`;
          document.getElementById('metricMaxDiam').textContent = `${maxDiamMm.toFixed(1)} mm`;
          document.getElementById('metricEqDiam').textContent = `等效径 ${eqDiamMm.toFixed(1)} mm`;
          document.getElementById('metricPerimeter').textContent = `${perimMm.toFixed(1)} mm`;
          document.getElementById('metricCircularity').textContent = `圆度 ${circ.toFixed(2)}`;
          document.getElementById('metricMeanStd').textContent = `${meanG.toFixed(1)} ± ${stdG.toFixed(1)}`;
          document.getElementById('metricCentroidBbox').textContent = `质心 (${Math.round(cx)}, ${Math.round(cy)}) · [${maxX - minX + 1}×${maxY - minY + 1}]`;
          document.getElementById('metricContrastRatio').textContent = `病灶/周围对比度 ΔI: ${deltaI >= 0 ? '+' : ''}${deltaI.toFixed(1)}`;
        } else {
          pill.textContent = '当前掩膜为空';
          pill.className = 'rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300';
          document.getElementById('metricAreaMm').textContent = '0.0 mm²';
          document.getElementById('metricAreaPx').textContent = '0 px';
          document.getElementById('metricMaxDiam').textContent = '0.0 mm';
          document.getElementById('metricEqDiam').textContent = '等效径 0.0 mm';
          document.getElementById('metricPerimeter').textContent = '0.0 mm';
          document.getElementById('metricCircularity').textContent = '圆度 0.00';
          document.getElementById('metricMeanStd').textContent = '-- ± --';
          document.getElementById('metricCentroidBbox').textContent = '质心 (--, --) · [--]';
          document.getElementById('metricContrastRatio').textContent = '病灶/周围对比度 ΔI: --';
        }

        if (dice !== null) {
          document.getElementById('metricDice').textContent = `${(dice * 100).toFixed(1)}% (${dice.toFixed(3)})`;
          document.getElementById('metricIou').textContent = `${(iou * 100).toFixed(1)}% (${iou.toFixed(3)})`;
          document.getElementById('barDice').style.width = `${Math.round(dice * 100)}%`;
          document.getElementById('barIou').style.width = `${Math.round(iou * 100)}%`;
          document.getElementById('metricRecall').textContent = `${(recall * 100).toFixed(1)}%`;
          document.getElementById('metricPrecision').textContent = `${(precision * 100).toFixed(1)}%`;
        } else {
          document.getElementById('metricDice').textContent = '无参考标准';
          document.getElementById('metricIou').textContent = '无参考标准';
          document.getElementById('barDice').style.width = '0%';
          document.getElementById('barIou').style.width = '0%';
          document.getElementById('metricRecall').textContent = '--';
          document.getElementById('metricPrecision').textContent = '--';
        }
        const fmtMm = v => (v === null || v === undefined) ? '--' : `${v.toFixed(2)} mm`;
        document.getElementById('metricHd95').textContent = fmtMm(hd95);
        document.getElementById('metricAssd').textContent = fmtMm(assd);
        const grade = qualityGrade(dice);
        const gradeEl = document.getElementById('qualityGrade');
        gradeEl.textContent = grade.label;
        gradeEl.dataset.tone = grade.tone;
        const flag = document.getElementById('recistFlag');
        flag.hidden = areaPx === 0;
        flag.textContent = recistMeasurable ? '可测量靶病灶 ≥10 mm' : '低于 RECIST 可测量阈值';
        flag.dataset.ok = String(recistMeasurable);
      }

      function updateHistogram() {
        const binsWhole = new Array(32).fill(0);
        const binsLesion = new Array(32).fill(0);
        let maxWhole = 1, maxLesion = 1;

        for (let i = 0; i < TOTAL_PX; i += 2) {
          const g = state.gray[i];
          if (g <= 8) continue;
          const b = Math.min(31, g >> 3);
          binsWhole[b]++;
          if (binsWhole[b] > maxWhole) maxWhole = binsWhole[b];
          if (state.mask[i]) {
            binsLesion[b]++;
            if (binsLesion[b] > maxLesion) maxLesion = binsLesion[b];
          }
        }

        const normWhole = binsWhole.map(v => Math.round((v / maxWhole) * 100));
        const normLesion = binsLesion.map(v => maxLesion > 1 ? Math.round((v / maxLesion) * 100) : 0);
        const labels = Array.from({ length: 32 }, (_, i) => `${i * 8}`);

        if (!histChart) {
          const ctx = document.getElementById('histChartCanvas').getContext('2d');
          histChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  label: '病灶像素分布',
                  data: normLesion,
                  backgroundColor: 'rgba(255, 112, 172, 0.82)',
                  borderRadius: 3,
                  barPercentage: 1.0,
                  categoryPercentage: 0.92
                },
                {
                  label: '全图组织分布',
                  data: normWhole,
                  type: 'line',
                  borderColor: 'rgba(124, 99, 230, 0.9)',
                  backgroundColor: 'rgba(167, 139, 250, 0.16)',
                  borderWidth: 1.5,
                  pointRadius: 0,
                  fill: true,
                  tension: 0.35
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: document.documentElement.dataset.motion === 'off' ? 0 : 200 },
              plugins: {
                legend: {
                  display: true,
                  labels: { color: '#624d57', boxWidth: 10, font: { size: 10 } }
                },
                tooltip: {
                  callbacks: {
                    title: items => {
                      const idx = items[0].dataIndex;
                      return `灰度区间: ${idx * 8} – ${idx * 8 + 7}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  ticks: { color: '#9a7b92', font: { size: 9 }, maxTicksLimit: 8 },
                  grid: { display: false }
                },
                y: {
                  beginAtZero: true,
                  max: 105,
                  ticks: { display: false },
                  grid: { color: 'rgba(236, 72, 153, 0.12)' }
                }
              }
            }
          });
        } else {
          histChart.data.datasets[0].data = normLesion;
          histChart.data.datasets[1].data = normWhole;
          histChart.update(document.documentElement.dataset.motion === 'off' ? 'none' : undefined);
        }
      }

      function renderCandidatesTable() {
        const tbody = document.getElementById('candidatesTableBody');
        tbody.innerHTML = '';
        if (state.candidates.length === 0) {
          const tr = document.createElement('tr');
          tr.innerHTML = '<td colspan="5" class="px-3 py-3 text-center text-slate-500">未检出符合条件的连通候选病灶，可调高灵敏度重试</td>';
          tbody.appendChild(tr);
          return;
        }

        state.candidates.forEach((cand, idx) => {
          const tr = document.createElement('tr');
          const active = idx === state.selectedCandidateIdx;
          tr.className = `cursor-pointer transition ${active ? 'bg-sky-500/15 text-sky-200' : 'text-slate-300 hover:bg-slate-800/70'}`;
          tr.innerHTML = `
            <td class="px-2.5 py-2 font-mono font-semibold text-sky-400">#L${idx + 1}</td>
            <td class="px-2 py-2 font-mono">(${Math.round(cand.cx)}, ${Math.round(cand.cy)})</td>
            <td class="px-2 py-2 font-mono">${cand.areaMm2.toFixed(1)} mm²</td>
            <td class="px-2 py-2 font-mono">${cand.diamMm.toFixed(1)} mm</td>
            <td class="px-2 py-2 font-mono"><span class="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">${cand.score}%</span></td>
          `;
          tr.addEventListener('click', () => {
            selectCandidateLesion(idx);
          });
          tbody.appendChild(tr);
        });
      }

      function updateAllVisualsAndMetrics() {
        computeMetrics();
        renderViewport();
        updateHistogram();
      }

      function runActiveSegmentation() {
        if (state.mode === 'region') {
          runRegionGrowing();
        } else if (state.mode === 'auto') {
          scanCandidateLesions(true);
          return;
        } else if (state.mode === 'otsu') {
          runOtsuSegmentation();
        }
        updateAllVisualsAndMetrics();
      }

      function syncModeUI() {
        const modeNames = {
          region: '种子区域生长',
          auto: 'CAD 自动病灶识别',
          otsu: 'Otsu 阈值分割',
          brush: '画笔精修轮廓'
        };
        document.getElementById('activeModeBadge').textContent = modeNames[state.mode];

        document.querySelectorAll('.algo-mode-btn').forEach(btn => {
          const isAct = btn.dataset.mode === state.mode;
          btn.setAttribute('aria-pressed',String(isAct));
          btn.className = isAct
            ? 'algo-mode-btn flex flex-col items-start rounded-xl border border-sky-400/80 bg-gradient-to-br from-sky-500/25 to-cyan-600/10 p-2.5 text-left text-sky-100 shadow-[0_0_20px_-6px_rgba(56,189,248,0.45)] transition'
            : 'algo-mode-btn btn-luxe-titanium flex flex-col items-start rounded-xl p-2.5 text-left text-slate-300';
        });

        document.getElementById('paramsRegion').classList.toggle('hidden', state.mode !== 'region');
        document.getElementById('paramsAuto').classList.toggle('hidden', state.mode !== 'auto');
        document.getElementById('paramsOtsu').classList.toggle('hidden', state.mode !== 'otsu');
        document.getElementById('paramsBrush').classList.toggle('hidden', state.mode !== 'brush');
      }

      function syncCaseTabUI() {
        document.querySelectorAll('.case-tab').forEach(btn => {
          const isAct = btn.dataset.case === state.activeCaseId;
          btn.setAttribute('aria-pressed',String(isAct));
          btn.className = isAct
            ? 'case-tab btn-luxe-primary rounded-lg px-3 py-1.5 text-xs font-semibold'
            : 'case-tab rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition';
        });
      }

      let currentImageRequest = 0;
      function loadImageSource(srcUrl, onLoaded) {
        const request = ++currentImageRequest;
        const img = new Image();
        img.onload = () => {
          if(request !== currentImageRequest) return;
          offRawCtx.fillStyle = '#000000';
          offRawCtx.fillRect(0, 0, SIZE, SIZE);
          const scale = Math.min(SIZE / img.width, SIZE / img.height);
          const dw = Math.round(img.width * scale);
          const dh = Math.round(img.height * scale);
          const dx = Math.floor((SIZE - dw) / 2);
          const dy = Math.floor((SIZE - dh) / 2);
          offRawCtx.drawImage(img, dx, dy, dw, dh);

          const imgData = offRawCtx.getImageData(0, 0, SIZE, SIZE);
          state.rawRgba.set(imgData.data);
          for (let i = 0; i < TOTAL_PX; i++) {
            const p4 = i * 4;
            state.gray[i] = Math.round(
              0.299 * state.rawRgba[p4] +
              0.587 * state.rawRgba[p4 + 1] +
              0.114 * state.rawRgba[p4 + 2]
            );
          }
          onLoaded();
        };
        img.onerror = () => {
          if(request !== currentImageRequest) return;
          showToast('图像加载失败，请重试');
        };
        img.src = srcUrl;
      }

      function loadPresetCase(caseId, overrideMode) {
        const preset = PRESET_CASES[caseId];
        if (!preset) return;
        if (overrideMode) {
          state.mode = overrideMode;
          syncModeUI();
        }
        state.activeCaseId = caseId;
        state.isColorUpload = false;
        state.polarity = preset.polarity;
        state.spacingMm = preset.spacing;
        state.seed = { x: preset.seed.x, y: preset.seed.y };
        state.regionTol = preset.tolerance;
        state.ww = 255;
        state.wl = 128;
        state.invert = false;
        state.undoStack = [];
        state.gtMask = decodeRle(GT_RLE[caseId]);

        document.getElementById('caseTitleHeading').textContent = preset.title;
        document.getElementById('caseModalityTag').textContent = preset.tag;
        document.getElementById('caseClinicalDesc').textContent = preset.desc;
        document.getElementById('polaritySelect').value = state.polarity;
        document.getElementById('spacingInput').value = state.spacingMm;
        document.getElementById('regionTolSlider').value = state.regionTol;
        document.getElementById('tolValueLabel').textContent = String(state.regionTol);
        document.getElementById('seedCoordLabel').textContent = `(${state.seed.x}, ${state.seed.y})`;
        document.getElementById('wwSlider').value = 255;
        document.getElementById('wlSlider').value = 128;
        document.getElementById('wwLabel').textContent = '255';
        document.getElementById('wlLabel').textContent = '128';
        syncCaseTabUI();

        loadImageSource(preset.src, () => {
          const otsu = computeOtsuThreshold();
          state.otsuThr = preset.polarity === 'bright' ? Math.max(otsu, preset.baseAutoThr) : Math.min(otsu, preset.baseAutoThr);
          document.getElementById('otsuThrSlider').value = state.otsuThr;
          document.getElementById('otsuThrLabel').textContent = String(state.otsuThr);

          scanCandidateLesions(false);
          if (state.mode === 'brush') {
            runRegionGrowing();
            updateAllVisualsAndMetrics();
          } else {
            runActiveSegmentation();
          }
          if(userSwitchedSample) { showToast('样本夹已翻页 · ' + preset.title); userSwitchedSample = false; }
        });
      }

      function getCanvasPoint(evt) {
        const rect = medCanvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(SIZE - 1, ((evt.clientX - rect.left) / rect.width) * SIZE));
        const y = Math.max(0, Math.min(SIZE - 1, ((evt.clientY - rect.top) / rect.height) * SIZE));
        return { x, y };
      }

      medCanvas.addEventListener('pointerdown', evt => {
        const pt = getCanvasPoint(evt);
        state.cursor = pt;

        if (state.splitWipe && Math.abs(pt.x - SIZE * state.splitRatio) < 14) {
          state.draggingSplit = true;
          medCanvas.setPointerCapture(evt.pointerId);
          return;
        }

        if (state.mode === 'region') {
          pushUndo();
          state.seed = { x: Math.round(pt.x), y: Math.round(pt.y) };
          document.getElementById('seedCoordLabel').textContent = `(${state.seed.x}, ${state.seed.y})`;
          runRegionGrowing();
          updateAllVisualsAndMetrics();
        } else if (state.mode === 'auto') {
          const hitIdx = state.candidates.findIndex(c => pt.x >= c.minX - 6 && pt.x <= c.maxX + 6 && pt.y >= c.minY - 6 && pt.y <= c.maxY + 6);
          if (hitIdx >= 0) {
            selectCandidateLesion(hitIdx);
          }
        } else if (state.mode === 'brush') {
          pushUndo();
          state.isPainting = true;
          medCanvas.setPointerCapture(evt.pointerId);
          applyBrushAt(pt.x, pt.y);
          updateAllVisualsAndMetrics();
        }
      });

      medCanvas.addEventListener('pointermove', evt => {
        const pt = getCanvasPoint(evt);
        state.cursor = pt;
        const ix = Math.round(pt.x), iy = Math.round(pt.y);
        const idx = iy * SIZE + ix;
        const g = state.gray[idx];
        const inMask = state.mask[idx] === 1;
        document.getElementById('probeReadout').textContent =
          `坐标: (${ix}, ${iy}) [${(ix * state.spacingMm).toFixed(1)}, ${(iy * state.spacingMm).toFixed(1)} mm] | 灰度: ${g} | 状态: ${inMask ? '病灶掩膜内' : '背景组织'}`;

        if (state.draggingSplit) {
          state.splitRatio = Math.max(0.05, Math.min(0.95, pt.x / SIZE));
          const pct = Math.round(state.splitRatio * 100);
          document.getElementById('splitWipeSlider').value = pct;
          document.getElementById('splitPosLabel').textContent = `${pct}%`;
          renderViewport();
          return;
        }

        if (state.mode === 'brush') {
          if (state.isPainting) {
            applyBrushAt(pt.x, pt.y);
            computeMetrics();
          }
          renderViewport();
        }
      });

      medCanvas.addEventListener('pointerup', () => {
        if (state.isPainting) {
          state.isPainting = false;
          computeMetrics();
          updateHistogram();
        }
        state.draggingSplit = false;
      });

      medCanvas.addEventListener('pointerleave', () => {
        state.cursor = null;
        if (state.mode === 'brush' && !state.isPainting) {
          renderViewport();
        }
      });

      document.querySelectorAll('.case-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          userSwitchedSample = true;
          loadPresetCase(btn.dataset.case);
        });
      });

      // Interactive Hero & Article Chapter Demo Triggers
      document.getElementById('heroJumpAutoBtn').addEventListener('click', () => {
        loadPresetCase('ct', 'auto');
        document.getElementById('workstationSection').scrollIntoView({ behavior: document.documentElement.dataset.motion==='off'?'auto':'smooth' });
        showToast('已载入胸部 CT 肺窗并启动 CAD 全图病灶筛查');
      });

      document.getElementById('articleTryCtBtn').addEventListener('click', () => {
        loadPresetCase('ct', 'auto');
        document.getElementById('workstationSection').scrollIntoView({ behavior: document.documentElement.dataset.motion==='off'?'auto':'smooth' });
        showToast('已切换至胸部 CT 肺结节 · CAD 自动筛查模式');
      });

      document.getElementById('articleTryDermBtn').addEventListener('click', () => {
        loadPresetCase('derm', 'otsu');
        document.getElementById('workstationSection').scrollIntoView({ behavior: document.documentElement.dataset.motion==='off'?'auto':'smooth' });
        showToast('已切换至皮肤镜病灶 · Otsu 类间方差阈值模式');
      });

      document.getElementById('articleTryMriBtn').addEventListener('click', () => {
        loadPresetCase('mri', 'region');
        document.getElementById('workstationSection').scrollIntoView({ behavior: document.documentElement.dataset.motion==='off'?'auto':'smooth' });
        showToast('已切换至脑部增强 MRI · 种子区域生长模式');
      });

      document.getElementById('uploadImageInput').addEventListener('change', evt => {
        const file = evt.target.files && evt.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          state.activeCaseId = 'custom';
          state.isColorUpload = true;
          state.gtMask = null;
          state.undoStack = [];
          syncCaseTabUI();
          document.getElementById('caseTitleHeading').textContent = `自定义导入影像：${file.name.slice(0, 26)}`;
          document.getElementById('caseModalityTag').textContent = 'Custom · 512×512';
          document.getElementById('caseClinicalDesc').textContent = '已加载本地影像，点击图像任意位置进行区域生长，或切换自动病灶识别 / 画笔精修。';

          loadImageSource(e.target.result, () => {
            state.seed = { x: 256, y: 256 };
            document.getElementById('seedCoordLabel').textContent = '(256, 256)';
            state.otsuThr = computeOtsuThreshold();
            document.getElementById('otsuThrSlider').value = state.otsuThr;
            document.getElementById('otsuThrLabel').textContent = String(state.otsuThr);
            scanCandidateLesions(state.mode === 'auto');
            if (state.mode !== 'auto') {
              if (state.candidates.length > 0) {
                state.seed = { x: Math.round(state.candidates[0].cx), y: Math.round(state.candidates[0].cy) };
                document.getElementById('seedCoordLabel').textContent = `(${state.seed.x}, ${state.seed.y})`;
              }
              runRegionGrowing();
              updateAllVisualsAndMetrics();
            }
            showToast('已成功导入影像并完成初始化分析');
          });
        };
        reader.readAsDataURL(file);
      });

      document.querySelectorAll('.algo-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.mode = btn.dataset.mode;
          syncModeUI();
          if (state.mode !== 'brush') {
            pushUndo();
            runActiveSegmentation();
          } else {
            renderViewport();
          }
        });
      });

      document.getElementById('polaritySelect').addEventListener('change', evt => {
        state.polarity = evt.target.value;
        scanCandidateLesions(false);
        runActiveSegmentation();
      });

      document.getElementById('spacingInput').addEventListener('input', evt => {
        const v = parseFloat(evt.target.value);
        if (v > 0 && v <= 20) {
          state.spacingMm = v;
          scanCandidateLesions(false);
          updateAllVisualsAndMetrics();
        }
      });

      document.getElementById('regionTolSlider').addEventListener('input', evt => {
        state.regionTol = parseInt(evt.target.value, 10);
        document.getElementById('tolValueLabel').textContent = String(state.regionTol);
        runRegionGrowing();
        updateAllVisualsAndMetrics();
      });

      document.getElementById('reRunRegionBtn').addEventListener('click', () => {
        pushUndo();
        runRegionGrowing();
        updateAllVisualsAndMetrics();
        showToast('已根据当前种子与容差重新执行区域生长');
      });

      document.getElementById('autoSensSlider').addEventListener('input', evt => {
        state.autoSens = parseInt(evt.target.value, 10);
        document.getElementById('autoSensLabel').textContent = state.autoSens > 0 ? `+${state.autoSens}` : String(state.autoSens);
        scanCandidateLesions(true);
      });

      document.getElementById('minAreaSlider').addEventListener('input', evt => {
        state.minAreaPx = parseInt(evt.target.value, 10);
        document.getElementById('minAreaLabel').textContent = String(state.minAreaPx);
        scanCandidateLesions(true);
      });

      document.getElementById('runAutoDetectBtn').addEventListener('click', () => {
        pushUndo();
        scanCandidateLesions(true);
        showToast(`全图筛查完成：共识别出 ${state.candidates.length} 个候选病灶`);
      });

      document.getElementById('quickScanCandidatesBtn').addEventListener('click', () => {
        state.mode = 'auto';
        syncModeUI();
        scanCandidateLesions(true);
        showToast(`已切换至 CAD 自动识别：检出 ${state.candidates.length} 个候选病灶`);
      });

      document.getElementById('otsuThrSlider').addEventListener('input', evt => {
        state.otsuThr = parseInt(evt.target.value, 10);
        document.getElementById('otsuThrLabel').textContent = String(state.otsuThr);
        runOtsuSegmentation();
        updateAllVisualsAndMetrics();
      });

      document.getElementById('keepLargestCheck').addEventListener('change', evt => {
        state.keepLargest = evt.target.checked;
        runOtsuSegmentation();
        updateAllVisualsAndMetrics();
      });

      document.getElementById('calcOtsuBtn').addEventListener('click', () => {
        pushUndo();
        const t = computeOtsuThreshold();
        state.otsuThr = t;
        document.getElementById('otsuThrSlider').value = t;
        document.getElementById('otsuThrLabel').textContent = String(t);
        runOtsuSegmentation();
        updateAllVisualsAndMetrics();
        showToast(`已应用自动 Otsu 最优阈值 T = ${t}`);
      });

      function syncBrushButtons() {
        const addBtn = document.getElementById('brushAddBtn');
        const eraseBtn = document.getElementById('brushEraseBtn');
        if (state.brushAction === 'add') {
          addBtn.className = 'rounded-xl border border-sky-400 bg-sky-500/20 py-1.5 text-xs font-semibold text-sky-200 shadow-sm';
          eraseBtn.className = 'btn-luxe-titanium rounded-xl py-1.5 text-xs font-medium';
        } else {
          eraseBtn.className = 'rounded-xl border border-rose-400 bg-rose-500/20 py-1.5 text-xs font-semibold text-rose-200 shadow-sm';
          addBtn.className = 'btn-luxe-titanium rounded-xl py-1.5 text-xs font-medium';
        }
      }

      document.getElementById('brushAddBtn').addEventListener('click', () => {
        state.brushAction = 'add';
        syncBrushButtons();
      });

      document.getElementById('brushEraseBtn').addEventListener('click', () => {
        state.brushAction = 'erase';
        syncBrushButtons();
      });

      document.getElementById('brushRadiusSlider').addEventListener('input', evt => {
        state.brushRadius = parseInt(evt.target.value, 10);
        document.getElementById('brushRadiusLabel').textContent = `${state.brushRadius} px`;
      });

      document.getElementById('undoMaskBtn').addEventListener('click', () => {
        if (state.undoStack.length === 0) {
          showToast('没有可撤销的历史步骤');
          return;
        }
        state.mask = state.undoStack.pop();
        updateAllVisualsAndMetrics();
        showToast('已撤销上一步掩膜修改');
      });

      document.getElementById('clearMaskBtn').addEventListener('click', () => {
        pushUndo();
        state.mask.fill(0);
        updateAllVisualsAndMetrics();
        showToast('已清空当前分割掩膜');
      });

      document.getElementById('morphSmoothBtn').addEventListener('click', () => {
        pushUndo();
        state.mask = erode3x3(dilate3x3(dilate3x3(erode3x3(state.mask))));
        updateAllVisualsAndMetrics();
        showToast('已对掩膜执行形态学开闭平滑');
      });

      document.getElementById('morphFillHolesBtn').addEventListener('click', () => {
        pushUndo();
        state.mask = fillInteriorHoles(state.mask);
        updateAllVisualsAndMetrics();
        showToast('已填充病灶掩膜内部空洞');
      });

      function applyWindowSettings(ww, wl, inv) {
        state.ww = ww;
        state.wl = wl;
        if (typeof inv === 'boolean') state.invert = inv;
        document.getElementById('wwSlider').value = ww;
        document.getElementById('wlSlider').value = wl;
        document.getElementById('wwLabel').textContent = String(ww);
        document.getElementById('wlLabel').textContent = String(wl);
        renderViewport();
      }

      document.getElementById('wwSlider').addEventListener('input', evt => {
        applyWindowSettings(parseInt(evt.target.value, 10), state.wl);
      });
      document.getElementById('wlSlider').addEventListener('input', evt => {
        applyWindowSettings(state.ww, parseInt(evt.target.value, 10));
      });
      document.getElementById('resetWindowBtn').addEventListener('click', () => {
        applyWindowSettings(255, 128, false);
      });
      document.getElementById('presetDefaultWinBtn').addEventListener('click', () => {
        applyWindowSettings(255, 128, false);
      });
      document.getElementById('presetHighContrastBtn').addEventListener('click', () => {
        applyWindowSettings(135, state.polarity === 'bright' ? 160 : 105, false);
      });
      document.getElementById('presetSoftWinBtn').addEventListener('click', () => {
        applyWindowSettings(210, 115, false);
      });
      document.getElementById('invertImageBtn').addEventListener('click', () => {
        state.invert = !state.invert;
        renderViewport();
      });

      document.getElementById('maskOpacitySlider').addEventListener('input', evt => {
        const pct = parseInt(evt.target.value, 10);
        state.maskOpacity = pct / 100;
        document.getElementById('opacityLabel').textContent = `${pct}%`;
        renderViewport();
      });

      document.getElementById('showContourCheck').addEventListener('change', evt => {
        state.showContour = evt.target.checked;
        renderViewport();
      });

      document.getElementById('showCaliperCheck').addEventListener('change', evt => {
        state.showCaliper = evt.target.checked;
        renderViewport();
      });

      document.getElementById('showGtCheck').addEventListener('change', evt => {
        state.showGt = evt.target.checked;
        renderViewport();
      });

      document.getElementById('splitWipeCheck').addEventListener('change', evt => {
        state.splitWipe = evt.target.checked;
        document.getElementById('splitWipeBox').classList.toggle('hidden', !state.splitWipe);
        renderViewport();
      });

      document.getElementById('splitWipeSlider').addEventListener('input', evt => {
        const pct = parseInt(evt.target.value, 10);
        state.splitRatio = pct / 100;
        document.getElementById('splitPosLabel').textContent = `${pct}%`;
        renderViewport();
      });

      document.getElementById('setAsRefMaskBtn').addEventListener('click', () => {
        state.gtMask = new Uint8Array(state.mask);
        state.showGt = true;
        document.getElementById('showGtCheck').checked = true;
        updateAllVisualsAndMetrics();
        showToast('已将当前分割掩膜设为金标准参考轮廓，可切换其他算法对比 Dice/IoU');
      });

      function downloadCanvasPng(canvasEl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvasEl.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      document.getElementById('exportOverlayBtn').addEventListener('click', () => {
        downloadCanvasPng(medCanvas, `medseg_overlay_${state.activeCaseId}.png`);
        showToast('已导出分割叠加结果图 PNG');
      });

      document.getElementById('exportMaskBtn').addEventListener('click', () => {
        const tmp = document.createElement('canvas');
        tmp.width = SIZE;
        tmp.height = SIZE;
        const tCtx = tmp.getContext('2d');
        const id = tCtx.createImageData(SIZE, SIZE);
        for (let i = 0; i < TOTAL_PX; i++) {
          const v = state.mask[i] ? 255 : 0;
          const p4 = i * 4;
          id.data[p4] = v;
          id.data[p4 + 1] = v;
          id.data[p4 + 2] = v;
          id.data[p4 + 3] = 255;
        }
        tCtx.putImageData(id, 0, 0);
        downloadCanvasPng(tmp, `medseg_binary_mask_${state.activeCaseId}.png`);
        showToast('已导出 512×512 二值分割掩膜 PNG');
      });

      function buildReportText() {
        const m = state.lastMetrics || {};
        const title = document.getElementById('caseTitleHeading').textContent;
        const modeMap = {
          region: `智能种子区域生长 (种子坐标 ${state.seed.x},${state.seed.y} · 灰度容差 ±${state.regionTol})`,
          auto: `CAD 连通域自动病灶识别 (灵敏度偏移 ${state.autoSens})`,
          otsu: `Otsu 最大类间方差阈值分割 (T = ${state.otsuThr})`,
          brush: `交互式亚像素画笔精修掩膜`
        };
        const lines = [
          '====================================================',
          '       MedSeg Studio 医学影像分割与病灶定量报告',
          '====================================================',
          `检查项目 / 模态：${title}`,
          `生成时间      ：${new Date().toLocaleString('zh-CN', { hour12: false })}`,
          `分析矩阵与标定：512 × 512 px | 空间分辨率 ${state.spacingMm} mm/px`,
          `显示窗        ：WW ${state.ww} / WL ${state.wl}${state.invert ? '（反相）' : ''}`,
          `分割识别管线  ：${modeMap[state.mode]}`,
          '----------------------------------------------------',
          '【一、靶病灶形态学定量指标】',
          `  • 病灶截面积 (Area)      : ${(m.areaMm2 || 0).toFixed(2)} mm² (${m.areaPx || 0} px)`,
          `  • RECIST 1.1 最大长径    : ${(m.maxDiamMm || 0).toFixed(2)} mm（${m.recistMeasurable ? '可测量靶病灶' : '低于 10 mm 可测量阈值'}）`,
          `  • 等效圆直径             : ${(m.eqDiamMm || 0).toFixed(2)} mm`,
          `  • 病灶边界周长           : ${(m.perimMm || 0).toFixed(2)} mm`,
          `  • 形态圆度 (Circularity) : ${(m.circ || 0).toFixed(3)}`,
          `  • 质心坐标 (X, Y)        : (${Math.round(m.cx || 0)}, ${Math.round(m.cy || 0)}) px`,
          `  • 病灶内部灰度均值±标准差 : ${(m.meanG || 0).toFixed(1)} ± ${(m.stdG || 0).toFixed(1)}`,
          `  • 病灶-周围实质对比度 ΔI  : ${(m.deltaI || 0) >= 0 ? '+' : ''}${(m.deltaI || 0).toFixed(1)}`,
          '----------------------------------------------------',
          '【二、空间重叠度精度验证 (vs. 参考金标准轮廓)】'
        ];
        if (m.dice !== null && m.dice !== undefined) {
          lines.push(
            `  • Dice 相似系数 (DSC)    : ${(m.dice * 100).toFixed(2)}% (${m.dice.toFixed(4)})`,
            `  • IoU 交并比 (Jaccard)   : ${(m.iou * 100).toFixed(2)}% (${m.iou.toFixed(4)})`,
            `  • 敏感度 (Recall)        : ${(m.recall * 100).toFixed(2)}%`,
            `  • 精确率 (Precision)     : ${(m.precision * 100).toFixed(2)}%`,
            `  • HD95 豪斯多夫距离      : ${m.hd95 == null ? '--' : m.hd95.toFixed(2) + ' mm'}`,
            `  • ASSD 平均表面距离      : ${m.assd == null ? '--' : m.assd.toFixed(2) + ' mm'}`,
            `  • 分割质量评级           : ${qualityGrade(m.dice).label}`
          );
        } else {
          lines.push('  • 当前为自定义影像且尚未指定参考金标准掩膜');
        }
        lines.push(
          '----------------------------------------------------',
          '声明：本量化结果仅供医学图像算法研究与教学参考，不作为临床诊断医嘱。'
        );
        return lines.join('\n');
      }

      const reportModal = document.getElementById('reportModal');
      function openReportModal() {
        document.getElementById('reportContentPre').textContent = buildReportText();
        reportModal.classList.remove('hidden');
        reportModal.classList.add('flex');
        document.getElementById('closeReportModalBtn').focus();
      }
      function closeReportModal() {
        reportModal.classList.add('hidden');
        reportModal.classList.remove('flex');
        document.getElementById('openReportBtn').focus();
      }

      document.addEventListener('keydown', e => {
        if (reportModal.classList.contains('hidden')) return;
        if(e.key === 'Escape') closeReportModal();
        if(e.key === 'Tab') { const first = document.getElementById('closeReportModalBtn'), last = document.getElementById('dismissReportBtn'); if(e.shiftKey && document.activeElement===first){ e.preventDefault();last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault();first.focus(); } }
      });
      document.getElementById('openReportBtn').addEventListener('click', openReportModal);
      document.getElementById('closeReportModalBtn').addEventListener('click', closeReportModal);
      document.getElementById('dismissReportBtn').addEventListener('click', closeReportModal);

      document.getElementById('copyReportBtn').addEventListener('click', async () => {
        const text = document.getElementById('reportContentPre').textContent;
        let copied = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            copied = true;
          }
        } catch (err) {
          copied = false;
        }
        if (!copied) {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copied = true;
          } catch (err2) {
            copied = false;
          }
        }
        showToast(copied ? '结构化影像报告已复制到剪贴板' : '复制受限，请手动选中复制');
      });

      document.getElementById('downloadReportBtn').addEventListener('click', () => {
        const blob = new Blob([buildReportText()], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `medseg_report_${state.activeCaseId}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        showToast('报告 TXT 已下载');
      });

      // ---- Measurement log: snapshot metrics across cases / methods, export as CSV ----
      const LOG_KEY = 'medseg-measure-log';
      const modeShort = { region: '区域生长', auto: 'CAD 识别', otsu: 'Otsu 阈值', brush: '画笔精修' };
      const caseShort = { mri: '脑 MRI', ct: '胸 CT', derm: '皮肤镜', custom: '自定义' };
      let measureLog = [];
      try { measureLog = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { measureLog = []; }
      if (!Array.isArray(measureLog)) measureLog = [];

      function saveLog() {
        try { localStorage.setItem(LOG_KEY, JSON.stringify(measureLog)); } catch (e) { /* storage unavailable */ }
      }

      function renderLog() {
        const body = document.getElementById('logTableBody');
        body.replaceChildren();
        document.getElementById('logCount').textContent = String(measureLog.length);
        if (!measureLog.length) {
          const tr = document.createElement('tr');
          tr.innerHTML = '<td colspan="6" class="log-empty">还没有记录～点「记一笔」把当前结果收进手帐</td>';
          body.appendChild(tr);
          return;
        }
        measureLog.forEach((r, i) => {
          const tr = document.createElement('tr');
          const cells = [
            `${i + 1}`, `${caseShort[r.caseId] || r.caseId}<small>${modeShort[r.mode] || r.mode}</small>`,
            `${r.areaMm2.toFixed(1)}`, `${r.maxDiamMm.toFixed(1)}`,
            r.dice == null ? '--' : r.dice.toFixed(3), r.hd95 == null ? '--' : r.hd95.toFixed(2)
          ];
          cells.forEach(html => { const td = document.createElement('td'); td.innerHTML = html; tr.appendChild(td); });
          body.appendChild(tr);
        });
      }

      function logCurrent() {
        const m = state.lastMetrics;
        if (!m || !m.areaPx) { showToast('当前还没有轮廓，先分割一个病灶吧'); return; }
        measureLog.push({
          time: new Date().toISOString(), caseId: state.activeCaseId, mode: state.mode,
          spacing: state.spacingMm, areaMm2: m.areaMm2, maxDiamMm: m.maxDiamMm, eqDiamMm: m.eqDiamMm,
          perimMm: m.perimMm, circ: m.circ, dice: m.dice, iou: m.iou, hd95: m.hd95, assd: m.assd
        });
        if (measureLog.length > 50) measureLog.shift();
        saveLog();
        renderLog();
        showToast(`已记进测量手帐 · 第 ${measureLog.length} 条`);
      }

      document.getElementById('logMeasureBtn').addEventListener('click', logCurrent);
      document.getElementById('clearLogBtn').addEventListener('click', () => {
        if (!measureLog.length) return;
        measureLog = [];
        saveLog();
        renderLog();
        showToast('测量手帐已清空');
      });
      document.getElementById('exportCsvBtn').addEventListener('click', () => {
        if (!measureLog.length) { showToast('手帐是空的，先记一笔再导出'); return; }
        const head = ['time', 'case', 'method', 'spacing_mm_px', 'area_mm2', 'recist_mm', 'eq_diam_mm', 'perimeter_mm', 'circularity', 'dice', 'iou', 'hd95_mm', 'assd_mm'];
        const f = (v, d) => v == null ? '' : Number(v).toFixed(d);
        const rows = measureLog.map(r => [r.time, r.caseId, r.mode, r.spacing, f(r.areaMm2, 2), f(r.maxDiamMm, 2), f(r.eqDiamMm, 2), f(r.perimMm, 2), f(r.circ, 3), f(r.dice, 4), f(r.iou, 4), f(r.hd95, 2), f(r.assd, 2)].join(','));
        const blob = new Blob(['\ufeff' + [head.join(',')].concat(rows).join('\n')], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'medseg_measurements.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        showToast(`已导出 ${measureLog.length} 条测量记录 CSV`);
      });

      // ---- Keyboard shortcuts ----
      document.addEventListener('keydown', e => {
        if (!reportModal.classList.contains('hidden')) return;
        if (e.target.closest && e.target.closest('input,select,textarea,[contenteditable]')) return;
        if (e.altKey || e.metaKey) return;
        const k = e.key.toLowerCase();
        if (e.ctrlKey) {
          if (k === 'z') { e.preventDefault(); document.getElementById('undoMaskBtn').click(); }
          return;
        }
        const modes = { '1': 'region', '2': 'auto', '3': 'otsu', '4': 'brush' };
        if (modes[k]) { document.querySelector(`.algo-mode-btn[data-mode="${modes[k]}"]`).click(); return; }
        if (k === 'z') document.getElementById('undoMaskBtn').click();
        else if (k === 'r') openReportModal();
        else if (k === 'm') logCurrent();
        else if (k === 'e' && state.mode === 'brush') {
          document.getElementById(state.brushAction === 'add' ? 'brushEraseBtn' : 'brushAddBtn').click();
        } else if (k === '[' || k === ']') {
          const slider = document.getElementById('brushRadiusSlider');
          slider.value = String(Math.max(2, Math.min(32, state.brushRadius + (k === ']' ? 2 : -2))));
          slider.dispatchEvent(new Event('input'));
          renderViewport();
        }
      });

      renderLog();
      syncModeUI();
      loadPresetCase('mri');
    })();
  