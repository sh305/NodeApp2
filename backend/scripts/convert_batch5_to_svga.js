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

const tasks = [
  {
    file: 'document_6213237146526951090.mp4',
    id: 'celestial_pegasus_castle',
    name: 'Celestial Pegasus Castle',
    icon: '🏰',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 66666,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951091.mp4',
    id: 'ocean_love_letter',
    name: 'Ocean Love Letter',
    icon: '💌',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 3333,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951092.mp4',
    id: 'crystal_rose_box',
    name: 'Crystal Rose Box',
    icon: '🌹',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:01.500',
    coins: 5200,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951095.mp4',
    id: 'shadow_tarantula',
    name: 'Shadow Tarantula',
    icon: '🕷️',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.12:0.04',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:03.000',
    coins: 666,
    category: 'lucky'
  },
  {
    file: 'document_6213237146526951096.mp4',
    id: 'wedding_swing_birdcage',
    name: 'Wedding Swing Birdcage',
    icon: '💍',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 52000,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951097.mp4',
    id: 'dubai_burj_rolls_royce',
    name: 'Dubai Burj Rolls Royce',
    icon: '🏎️',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:03.000',
    coins: 100000,
    category: 'vip'
  },
  {
    file: 'document_6213237146526951098.mp4',
    id: 'cyber_neon_hypercar',
    name: 'Cyber Neon Hypercar',
    icon: '🏎️',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 22222,
    category: 'custom'
  },
  {
    file: 'document_6213237146526951099.mp4',
    id: 'sweetheart_first_kiss',
    name: 'Sweetheart First Kiss',
    icon: '👩‍❤️‍💋‍👨',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 4.0,
    thumbTime: '00:00:01.500',
    coins: 9999,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951100.mp4',
    id: 'cathedral_wedding_bloom',
    name: 'Cathedral Wedding Bloom',
    icon: '💒',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 18888,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951101.mp4',
    id: 'moonlit_bridge_romance',
    name: 'Moonlit Bridge Romance',
    icon: '🌕',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 18888,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951102.mp4',
    id: 'galaxy_wedding_embrace',
    name: 'Galaxy Wedding Embrace',
    icon: '💍',
    crop: standardCrop,
    colorkey: null,
    fps: 12,
    dur: 4.5,
    thumbTime: '00:00:01.500',
    coins: 29999,
    category: 'couple'
  },
  {
    file: 'document_6213237146526951104.mp4',
    id: 'crystal_magic_perfume',
    name: 'Crystal Magic Perfume',
    icon: '🧪',
    crop: standardCrop,
    colorkey: 'colorkey=0x000000:0.18:0.08',
    fps: 12,
    dur: 3.5,
    thumbTime: '00:00:01.500',
    coins: 2222,
    category: 'hot'
  }
];

async function runAll() {
  console.log(`Starting conversion of ${tasks.length} new gifts to SVGA (Batch 5)...`);
  for (const t of tasks) {
    await convertMp4ToSvga(t);
  }
  console.log('\n=== ALL 12 NEW GIFTS CONVERTED SUCCESSFULLY! ===');
}

runAll();
