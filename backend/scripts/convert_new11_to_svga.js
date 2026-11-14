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

  console.log(`\n=== Processing [${task.id}] ===`);

  // 1. Generate Thumbnail
  try {
    const thumbTime = task.thumbTime || '00:00:01.500';
    execSync(`"${ffmpeg}" -y -ss ${thumbTime} -i "${mp4Path}" -vf "${task.crop},scale=300:-1" -vframes 1 "${outThumbPath}"`, { stdio: 'pipe' });
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
  const colorkey = task.colorkey || 'colorkey=0x000000:0.18:0.08';
  const filter = `${task.crop},fps=${fps},${colorkey},scale=300:-1`;

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
  console.log(`✓ Saved ${task.id}.svga: ${compressed.length} bytes (${frameFiles.length} frames, ${width}x${height})`);

  fs.rmSync(tempDir, { recursive: true, force: true });
  return true;
}

const tasks = [
  {
    file: 'document_6213237146526951139.mp4',
    id: 'pink_diamond_ring',
    name: 'Pink Diamond Ring',
    icon: '💎',
    crop: 'crop=576:950:0:160',
    colorkey: 'colorkey=0x000000:0.12:0.04',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 9999,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951140.mp4',
    id: 'angel_wing_heart',
    name: 'Angel Wing Heart',
    icon: '🪽',
    crop: 'crop=576:950:0:160',
    colorkey: 'colorkey=0x000000:0.12:0.04',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 5200,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951141.mp4',
    id: 'rainbow_teddy_cake',
    name: 'Rainbow Teddy Cake',
    icon: '🎂',
    crop: 'crop=576:950:0:160',
    colorkey: 'colorkey=0x000000:0.12:0.04',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 8888,
    category: 'custom'
  },
  {
    file: 'document_6213237146526951144.mp4',
    id: 'swan_wedding_cake',
    name: 'Swan Wedding Cake',
    icon: '🦢',
    crop: 'crop=576:1100:0:160',
    colorkey: 'colorkey=0x000000:0.08:0.03',
    fps: 10,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 35000,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951145.mp4',
    id: 'sweet_glazed_donuts',
    name: 'Sweet Glazed Donuts',
    icon: '🍩',
    crop: 'crop=576:950:0:160',
    colorkey: 'colorkey=0x000000:0.12:0.04',
    fps: 12,
    dur: 3.0,
    thumbTime: '00:00:01.500',
    coins: 888,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951146.mp4',
    id: 'flying_love_letter',
    name: 'Flying Love Letter',
    icon: '💌',
    crop: 'crop=418:660:75:205',
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 2999,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951147.mp4',
    id: 'royal_couple_rings',
    name: 'Royal Couple Rings',
    icon: '💍',
    crop: 'crop=418:660:75:205',
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 20000,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951148.mp4',
    id: 'love_chocolate_coffee',
    name: 'Love Choco Coffee',
    icon: '☕',
    crop: 'crop=418:660:75:205',
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.0,
    thumbTime: '00:00:01.500',
    coins: 666,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951150.mp4',
    id: 'heart_waterfall',
    name: 'Heart Waterfall',
    icon: '💖',
    crop: 'crop=418:660:75:205',
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:02.000',
    coins: 5000,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951151.mp4',
    id: 'royal_turkish_coffee',
    name: 'Royal Turkish Coffee',
    icon: '🫖',
    crop: 'crop=418:660:75:205',
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.0,
    thumbTime: '00:00:01.500',
    coins: 1200,
    category: 'custom'
  },
  {
    file: 'document_6213237146526951152.mp4',
    id: 'diamond_proposal_ring',
    name: 'Diamond Proposal Ring',
    icon: '💍',
    crop: 'crop=418:660:75:205',
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.0,
    thumbTime: '00:00:01.500',
    coins: 15000,
    category: 'couple'
  }
];

async function runAll() {
  console.log(`Starting conversion of ${tasks.length} new gifts to SVGA...`);
  for (const t of tasks) {
    await convertMp4ToSvga(t);
  }
  console.log('\n=== ALL 11 NEW GIFTS CONVERTED SUCCESSFULLY! ===');
}

runAll();
