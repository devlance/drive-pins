const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure Node.js PNG encoder
function createPNG(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a] where 0 <= r,g,b,a <= 255
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter byte: 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawBytes, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let table = crc32.table;
    if (!table) {
      table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
      }
      crc32.table = table;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate pin icon graphics (Google Drive styled blue/teal pin)
function generateIcon(size) {
  const radius = size * 0.44;
  const cx = size / 2;
  const cy = size * 0.4;

  return createPNG(size, size, (x, y) => {
    // Normal coordinates relative to center
    const nx = (x - cx) / (size / 2);
    const ny = (y - cy) / (size / 2);

    // Pin head circle
    const distHead = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    // Pin needle/point towards bottom
    const isNeedle = y >= cy && y <= size * 0.9 && Math.abs(x - cx) <= (size * 0.9 - y) * 0.35 + 1;

    // Outer circle
    if (distHead <= radius) {
      // Inner circle hole
      const innerDist = Math.sqrt((x - cx) ** 2 + (y - cy * 0.9) ** 2);
      if (innerDist <= radius * 0.38) {
        return [255, 255, 255, 255]; // White center
      }
      // Google Drive style color: Deep Blue / Teal (#1A73E8)
      // Slight gradient
      const shade = Math.floor(232 - (y / size) * 40);
      return [26, 115, shade, 255];
    } else if (isNeedle) {
      // Pin needle
      return [234, 67, 53, 255]; // Google Red accent tip
    } else {
      // Soft shadow or antialias
      if (distHead <= radius + 0.8) {
        return [26, 115, 232, 100];
      }
      return [0, 0, 0, 0]; // Transparent
    }
  });
}

const outDir = path.join(__dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const buf = generateIcon(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buf);
  console.log(`Generated icon-${size}.png`);
}
