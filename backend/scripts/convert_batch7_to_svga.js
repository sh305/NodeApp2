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
const smallCrop = 'crop=360:720:12:90';

const tasks = [
  {
    file: 'document_6213237146526951054.mp4',
    id: 'sweet_swirl_lollipop',
    name: 'Sweet Swirl Lollipop',
    icon: '🍭',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 50,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951055.mp4',
    id: 'choco_berry_popsicle',
    name: 'Choco Berry Popsicle',
    icon: '🍧',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:03.000',
    coins: 199,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951057.mp4',
    id: 'golden_arrow_love_you',
    name: 'Golden Arrow Love You',
    icon: '💘',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 520,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951058.mp4',
    id: 'nimbus_magic_cloud',
    name: 'Nimbus Magic Cloud',
    icon: '☁️',
    crop: smallCrop,
    colorkey: null,
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:03.000',
    coins: 2000,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951060.mp4',
    id: 'lucky_wishing_bottle',
    name: 'Lucky Wishing Bottle',
    icon: '🏺',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 1200,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951061.mp4',
    id: 'rainbow_star_parfait',
    name: 'Rainbow Star Parfait',
    icon: '🍧',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 300,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951063.mp4',
    id: 'blooming_rose_garden',
    name: 'Blooming Rose Garden',
    icon: '🌹',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 1999,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951065.mp4',
    id: 'sweet_boba_couple_tea',
    name: 'Sweet Boba Couple Tea',
    icon: '🧋',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 520,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951066.mp4',
    id: 'golden_royal_rolls_royce',
    name: 'Golden Royal Rolls Royce',
    icon: '👑',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 5.0,
    thumbTime: '00:00:01.500',
    coins: 88888,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951069.mp4',
    id: 'golden_money_gun',
    name: 'Golden Money Gun',
    icon: '💸',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 3000,
    category: 'hot'
  },
  {
    file: 'document_6213237146526951070.mp4',
    id: 'cheers_party_beer_mugs',
    name: 'Cheers Party Beer Mugs',
    icon: '🍻',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 300,
    category: 'custom'
  },
  {
    file: 'document_6213237146526951072.mp4',
    id: 'stardust_rose_bouquet',
    name: 'Stardust Rose Bouquet',
    icon: '💐',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 2999,
    category: 'couple'
  }
];

async function runAll() {
  console.log(`Starting conversion of ${tasks.length} new gifts to SVGA (Batch 7)...`);
  for (const t of tasks) {
    await convertMp4ToSvga(t);
  }
  console.log('\n=== ALL 12 NEW GIFTS CONVERTED SUCCESSFULLY! ===');
}

runAll();
