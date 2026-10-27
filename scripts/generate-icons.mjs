import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcVal = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawBytes = Buffer.alloc((width * 4 + 1) * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);

  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[pos++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.hypot(dx, dy);

      // Background: Deep dark sci-fi slate #090d16
      let r = 9, g = 13, b = 22, a = 255;

      // Outer glowing ring
      if (dist >= radius - 8 && dist <= radius) {
        // Cyan border
        r = 0; g = 240; b = 255; a = 255;
      } else if (dist < radius - 8) {
        // Inner gradient
        const innerRatio = dist / radius;
        r = Math.round(15 + (1 - innerRatio) * 20);
        g = Math.round(23 + (1 - innerRatio) * 45);
        b = Math.round(42 + (1 - innerRatio) * 75);

        // Cyber Crosshair / Emblem pattern
        const inCrossX = Math.abs(dx) < width * 0.04 && Math.abs(dy) < radius * 0.65;
        const inCrossY = Math.abs(dy) < width * 0.04 && Math.abs(dx) < radius * 0.65;
        const inDiag1 = Math.abs(dx - dy) < width * 0.05 && Math.abs(dx + dy) < radius * 0.7;
        const inDiag2 = Math.abs(dx + dy) < width * 0.05 && Math.abs(dx - dy) < radius * 0.7;

        if (inCrossX || inCrossY) {
          r = 0; g = 240; b = 255;
        } else if (inDiag1 || inDiag2) {
          r = 245; g = 158; b = 11; // Amber energy blades
        }

        // Central core
        if (dist < radius * 0.22) {
          r = 255; g = 255; b = 255;
        }
      }

      rawBytes[pos++] = r;
      rawBytes[pos++] = g;
      rawBytes[pos++] = b;
      rawBytes[pos++] = a;
    }
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const compressed = zlib.deflateSync(rawBytes, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPNG(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPNG(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIconPNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIconPNG(180));

console.log('Successfully generated all PWA PNG icons in /public!');
