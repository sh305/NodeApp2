const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const protobuf = require(path.join(__dirname, '..', 'node_modules', 'protobufjs'));
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
    const thumbTime = task.thumbTime || '00:00:02.000';
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
  const dur = task.dur || 4.5;
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
const smallCrop = 'crop=360:720:12:90';

const tasks = [
  {
    file: 'document_6213237146526951035.mp4',
    id: 'crystal_luxury_perfume',
    name: 'Crystal Luxury Perfume',
    icon: '💎',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 5.0,
    thumbTime: '00:00:03.500',
    coins: 999,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951036.mp4',
    id: 'teddy_rose_surprise',
    name: 'Teddy Rose Surprise',
    icon: '🧸',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 5.5,
    thumbTime: '00:00:03.500',
    coins: 520,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951037.mp4',
    id: 'neon_hi_greeting',
    name: 'Neon Hi Greeting',
    icon: '👋',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 5.5,
    thumbTime: '00:00:03.000',
    coins: 99,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951038.mp4',
    id: 'sparkle_face_mask',
    name: 'Sparkle Face Mask',
    icon: '😷',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:02.000',
    coins: 66,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951039.mp4',
    id: 'celebration_birthday_cake',
    name: 'Celebration Birthday Cake',
    icon: '🎂',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 6.0,
    thumbTime: '00:00:03.500',
    coins: 666,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951040.mp4',
    id: 'amethyst_royal_ring',
    name: 'Amethyst Royal Ring',
    icon: '💍',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:02.500',
    coins: 888,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951041.mp4',
    id: 'crystal_ice_slippers',
    name: 'Crystal Ice Slippers',
    icon: '👠',
    crop: smallCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 5.5,
    thumbTime: '00:00:03.000',
    coins: 1314,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951042.mp4',
    id: 'lucky_four_clover',
    name: 'Lucky Four Clover',
    icon: '🍀',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:02.500',
    coins: 50,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951043.mp4',
    id: 'finger_heart_love',
    name: 'Finger Heart Love',
    icon: '🫰',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:02.500',
    coins: 199,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951045.mp4',
    id: 'celestial_crystal_violin',
    name: 'Celestial Crystal Violin',
    icon: '🎻',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 6.0,
    thumbTime: '00:00:04.000',
    coins: 1888,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951046.mp4',
    id: 'cinderella_glass_slipper',
    name: 'Cinderella Glass Slipper',
    icon: '👡',
    crop: smallCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 6.0,
    thumbTime: '00:00:03.500',
    coins: 1520,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951047.mp4',
    id: 'luminous_pearl_shell',
    name: 'Luminous Pearl Shell',
    icon: '🦪',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 6.0,
    thumbTime: '00:00:03.500',
    coins: 777,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951048.mp4',
    id: 'sparkling_crimson_rose',
    name: 'Sparkling Crimson Rose',
    icon: '🌹',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:02.500',
    coins: 99,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951049.mp4',
    id: 'romantic_balloon_kiss',
    name: 'Romantic Balloon Kiss',
    icon: '👩‍❤️‍💋‍👨',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:02.000',
    coins: 1314,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951050.mp4',
    id: 'cupid_love_slingshot',
    name: 'Cupid Love Slingshot',
    icon: '🏹',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 5.5,
    thumbTime: '00:00:03.000',
    coins: 299,
    category: 'lucky'
  }
];

async function runAll() {
  console.log(`Starting conversion of ${tasks.length} new gifts to SVGA (Batch 8)...`);
  for (const t of tasks) {
    await convertMp4ToSvga(t);
  }
  console.log('\n=== ALL 15 NEW GIFTS CONVERTED SUCCESSFULLY! ===');
}

runAll();
