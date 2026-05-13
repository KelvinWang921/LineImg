import { OUTPUT_SIZE } from '../constants';

// ─────────────────────────────────────────────
// 基礎圖片工具
// ─────────────────────────────────────────────

/**
 * 將圖片（URL / Base64 / File）縮放至指定尺寸。
 * 自動釋放 File 產生的 ObjectURL，避免 Memory Leak。
 */
export const resizeImage = (
  source: string | File,
  width: number,
  height: number,
  mode: 'contain' | 'fill' = 'contain',
  backgroundColor: string | null = null
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    let objectUrl: string | null = null;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.clearRect(0, 0, width, height);

      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      if (mode === 'contain') {
        const scale = Math.min(width / img.width, height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // 釋放 Object URL 避免 Memory Leak
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }
  });
};

/**
 * 在圖片底部加上粗體描邊文字（貼圖風格）。
 */
export const addTextToImage = (imageBase64: string, text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.floor(canvas.width * 0.14);
      ctx.font = `900 ${fontSize}px "Noto Sans TC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      const x = canvas.width / 2;
      const y = canvas.height - 15;

      // 白色描邊
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'white';
      ctx.strokeText(text, x, y);

      // 深色填色
      ctx.fillStyle = '#1f2937';
      ctx.fillText(text, x, y);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageBase64;
  });
};

/**
 * 將上傳的 File 處理為 Gemini API 所需格式：
 * - 縮放至 OUTPUT_SIZE
 * - 回傳 base64（不含 data URL 前綴）與 previewUrl
 */
export const processImageForGenAI = (
  file: File
): Promise<{ base64: string; previewUrl: string }> => {
  return resizeImage(file, OUTPUT_SIZE, OUTPUT_SIZE, 'contain').then((dataUrl) => ({
    base64: dataUrl.split(',')[1],
    previewUrl: dataUrl,
  }));
};

/**
 * 觸發瀏覽器下載圖片。
 */
export const downloadImage = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 從完整檔名安全地取得不含副檔名的基本名稱。
 * 例如 "my.photo.final.png" → "my.photo.final"
 */
export const getBaseName = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
};

// ─────────────────────────────────────────────
// 去背演算法
// ─────────────────────────────────────────────

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
};

const isGreen = (r: number, g: number, b: number): boolean => {
  // 精確純綠（距離 #00FF00 很近）
  const dist = Math.sqrt(r * r + Math.pow(g - 255, 2) + b * b);
  if (dist < 18) return true;

  // 寬鬆條件：色相在綠色範圍、飽和度夠高、綠色主導
  const [h, s, l] = rgbToHsl(r, g, b);
  return (
    h >= 60 && h <= 185 &&
    s >= 0.22 &&
    l >= 0.12 && l <= 0.95 &&
    g > r + 12 && g > b + 12
  );
};

/** 從圖片邊界向內做 Flood Fill，標記所有屬於背景的像素 */
const floodFillBackground = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): boolean[] => {
  const isBg = new Array<boolean>(width * height).fill(false);
  const stack: number[] = [];

  // 上下邊界
  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x);
  }
  // 左右邊界
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + (width - 1));
  }

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (isBg[idx]) continue;

    const base = idx * 4;
    if (isGreen(data[base], data[base + 1], data[base + 2])) {
      isBg[idx] = true;
      const x = idx % width;
      const y = Math.floor(idx / width);
      if (x > 0)          stack.push(idx - 1);
      if (x < width - 1)  stack.push(idx + 1);
      if (y > 0)          stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }
  }
  return isBg;
};

/** 保護白色描邊：防止把邊緣抗鋸齒的白色誤判為背景 */
const protectWhiteStroke = (
  data: Uint8ClampedArray,
  isBg: boolean[],
  width: number,
  height: number
): void => {
  const toRestore: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!isBg[idx]) continue;

      const base = idx * 4;
      const [, s, l] = rgbToHsl(data[base], data[base + 1], data[base + 2]);
      const isWhiteish = l > 0.8 || (l > 0.6 && s < 0.2);
      if (!isWhiteish) continue;

      // 若鄰居有非背景像素（角色），則此像素應保留
      const neighbors = [
        idx - 1, idx + 1, idx - width, idx + width,
        idx - width - 1, idx - width + 1, idx + width - 1, idx + width + 1,
      ];
      const nearCharacter = neighbors.some(
        (n) => n >= 0 && n < isBg.length && !isBg[n]
      );

      if (nearCharacter) toRestore.push(idx);
    }
  }

  toRestore.forEach((idx) => { isBg[idx] = false; });
};

/** 抑制前景邊緣的綠色溢色（Green Spill） */
const suppressGreenSpill = (data: Uint8ClampedArray, isBg: boolean[]): void => {
  for (let i = 0; i < isBg.length; i++) {
    if (isBg[i]) continue;
    const base = i * 4;
    const r = data[base], g = data[base + 1], b = data[base + 2];
    if (g > r && g > b) {
      data[base + 1] = Math.min(g, Math.round((r + b) / 2) + 10);
    }
  }
};

/** 對 Alpha 通道做 Box Blur，讓邊緣更柔和 */
const featherAlpha = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius = 1
): void => {
  const alphaSnapshot = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaSnapshot[i] = data[i * 4 + 3];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (alphaSnapshot[idx] === 0) continue; // 完全透明跳過

      let sum = 0, count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const ny = y + ky, nx = x + kx;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += alphaSnapshot[ny * width + nx];
            count++;
          }
        }
      }
      data[idx * 4 + 3] = Math.round(sum / count);
    }
  }
};

/**
 * 去除綠幕背景，回傳透明背景的 PNG dataURL。
 */
export const removeBackground = (imgSource: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const { width, height } = img;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      // 1. Flood Fill 標記背景
      const isBg = floodFillBackground(data, width, height);
      // 2. 保護白色描邊
      protectWhiteStroke(data, isBg, width, height);
      // 3. 抑制綠色溢色
      suppressGreenSpill(data, isBg);
      // 4. 設定 Alpha
      for (let i = 0; i < isBg.length; i++) {
        if (isBg[i]) data[i * 4 + 3] = 0;
      }
      // 5. 羽化邊緣
      featherAlpha(data, width, height, 1);

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = reject;
    img.src = imgSource;
  });
};
