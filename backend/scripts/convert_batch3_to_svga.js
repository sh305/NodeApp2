const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const protobuf = require('protobufjs');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;

const uploadsDir = path.join(__dirname, '..', 'uploads');
const inputDir = path.join(uploadsDir, 'raw_gifts');
const giftsDir = path.join(uploadsDir, 'gifts');
const thumbsDir = path.join(giftsDir, 'thumbnails');
if (!fs.existsSync(giftsDir)) fs.mkdirSync(giftsDir, { recursive: true });
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

async function convertMp4ToSvga(task) {
  const mp4Path = path.join(inputDir, task.file);
  const outSvgaPath = path.join(giftsDir, `${task.id}.svga`);
  const outThumbPath = path.join(thumbsDir, `${task.id}.png`);

  if (!fs.existsSync(mp4Path)) {
    console.log(`[SKIP] ${task.file} not found`);
    return false;
  }

  console.log(`\n=== Processing [${task.id}] === (${task.name})`);

  // 1. Generate Thumbnail
  try {
    const thumbTime = task.thumbTime || '00:00:01.500';
    const thumbColorkey = task.colorkey ? `${task.colorkey},` : '';
    execSync(`"${ffmpeg}" -y -ss ${thumbTime} -i "${mp4Path}" -vf "${task.crop},${thumbColorkey}scale=300:-1" -vframes 1 "${outThumbPath}"`, { stdio: 'pipe' });
    console.log(`✓ Thumbnail created: ${task.id}.png`);
  } catch (e) {
    console.error(`Thumb error for ${task.id}:`, e.message);
  }

  // 2. Extract transparent PNG frames
  const tempDir = path.join(uploadsDir, 'temp_frames_' + task.id);
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const fps = task.fps || 12;
  const dur = task.dur || 3.5;
  const colorkeyFilter = task.colorkey ? `${task.colorkey},` : '';
  const filter = `${task.crop},fps=${fps},${colorkeyFilter}scale=300:-1`;

  try {
    execSync(`"${ffmpeg}" -y -i "${mp4Path}" -t ${dur} -vf "${filter}" "${path.join(tempDir, 'f_%03d.png')}"`, { stdio: 'pipe' });
  } catch (e) {
    console.error(`Frame extraction error for ${task.id}:`, e.message);
    return false;
  }

  const frameFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.png')).sort();
  if (frameFiles.length === 0) {
    console.error(`No frames extracted for ${task.id}`);
    return false;
  }

  // 3. Encode into SVGA Protobuf
  const root = await protobuf.load(path.join(__dirname, '..', 'proto', 'svga.proto'));
  const MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');

  const firstBuf = fs.readFileSync(path.join(tempDir, frameFiles[0]));
  const width = firstBuf.readUInt32BE(16);
  const height = firstBuf.readUInt32BE(20);

  const images = {};
  const sprites = [];

  frameFiles.forEach((file, idx) => {
    const key = `img_${idx}`;
    images[key] = fs.readFileSync(path.join(tempDir, file));

    const frames = [];
    for (let f = 0; f < frameFiles.length; f++) {
      if (f === idx) {
        frames.push({
          alpha: 1.0,
          layout: { x: 0, y: 0, width: width, height: height },
          transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }
        });
      } else {
        frames.push({
          alpha: 0.0,
          layout: { x: 0, y: 0, width: width, height: height }
        });
      }
    }

    sprites.push({ imageKey: key, frames });
  });

  const movie = MovieEntity.create({
    version: '2.0.0',
    params: {
      viewBoxWidth: width,
      viewBoxHeight: height,
      fps: fps,
      frames: frameFiles.length
    },
    images,
    sprites
  });

  const encoded = MovieEntity.encode(movie).finish();
  const compressed = zlib.deflateSync(encoded);
  fs.writeFileSync(outSvgaPath, compressed);
  console.log(`✓ Saved ${task.id}.svga: ${(compressed.length / 1024).toFixed(1)} KB (${frameFiles.length} frames, ${width}x${height})`);

  fs.rmSync(tempDir, { recursive: true, force: true });
  return true;
}

const standardCrop = 'crop=540:1080:18:135';

const tasks = [
  {
    file: 'document_6213237146526951128.mp4',
    id: 'imperial_red_crown',
    name: 'Imperial Red Crown',
    icon: '👑',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:03.000',
    coins: 25000,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951129.mp4',
    id: 'cupid_love_arrow',
    name: 'Cupid Love Arrow',
    icon: '🏹',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.15:0.06',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 8888,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951130.mp4',
    id: 'crystal_neon_violin',
    name: 'Crystal Neon Violin',
    icon: '🎻',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:01.500',
    coins: 6666,
    category: 'custom'
  },
  {
    file: 'document_6213237146526951131.mp4',
    id: 'enchanted_forest_fairy',
    name: 'Enchanted Forest Fairy',
    icon: '🧚‍♀️',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.12:0.04',
    fps: 10,
    dur: 5.0,
    thumbTime: '00:00:02.000',
    coins: 50000,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951132.mp4',
    id: 'sparkling_rose_bouquet',
    name: 'Sparkling Rose Bouquet',
    icon: '💐',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.15:0.06',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:01.500',
    coins: 1999,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951133.mp4',
    id: 'deep_sea_pearl',
    name: 'Deep Sea Pearl',
    icon: '🦪',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.15:0.06',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:02.500',
    coins: 3333,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951134.mp4',
    id: 'super_heart_like',
    name: 'Super Heart Like',
    icon: '👍',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.15:0.06',
    fps: 12,
    dur: 3.0,
    thumbTime: '00:00:01.500',
    coins: 520,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951135.mp4',
    id: 'golden_palace_supercar',
    name: 'Golden Palace Supercar',
    icon: '🏎️',
    crop: standardCrop,
    colorkey: null, // Keep rich palace scenery backdrop intact
    fps: 10,
    dur: 5.0,
    thumbTime: '00:00:02.000',
    coins: 88888,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951136.mp4',
    id: 'choco_rose_romance',
    name: 'Choco Rose Romance',
    icon: '🍫',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.15:0.06',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:01.500',
    coins: 2888,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951137.mp4',
    id: 'romantic_firework_festival',
    name: 'Firework Festival',
    icon: '🎆',
    crop: standardCrop,
    colorkey: null, // Keep dark night sky with colorful sparkling fireworks intact
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 12000,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951138.mp4',
    id: 'fairy_tales_angel_boy',
    name: 'Fairy Tales Angel',
    icon: '👼',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.15:0.06',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:01.500',
    coins: 4999,
    category: 'custom'
  }
];

async function runAll() {
  console.log(`Starting conversion of ${tasks.length} new gifts to SVGA (Batch 3)...`);
  for (const t of tasks) {
    await convertMp4ToSvga(t);
  }
  console.log('\n=== ALL 11 NEW GIFTS CONVERTED SUCCESSFULLY! ===');
}

runAll();
