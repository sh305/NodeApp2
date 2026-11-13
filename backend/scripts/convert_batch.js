const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const protobuf = require('protobufjs');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;

async function convertMp4ToSvga(mp4Path, outSvgaPath, crop, colorkey, fps = 12, maxDuration = 3.5) {
  const tempDir = path.join(__dirname, 'uploads', 'temp_frames_' + Date.now());
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const filter = `${crop},fps=${fps},${colorkey},scale=300:-1`;
  try {
    execSync(`"${ffmpeg}" -y -i "${mp4Path}" -t ${maxDuration} -vf "${filter}" "${path.join(tempDir, 'f_%03d.png')}"`, { stdio: 'pipe' });
  } catch (e) {
    console.error('FFmpeg error:', e.message);
    return false;
  }

  const frameFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.png')).sort();
  if (frameFiles.length === 0) {
    console.error('No frames extracted for', mp4Path);
    return false;
  }

  const root = await protobuf.load(path.join(__dirname, 'proto', 'svga.proto'));
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
  console.log(`Saved ${path.basename(outSvgaPath)}: ${compressed.length} bytes (${frameFiles.length} frames, ${width}x${height})`);

  fs.rmSync(tempDir, { recursive: true, force: true });
  return true;
}

async function runAll() {
  const tasks = [
    {
      mp4: 'uploads/raw_gifts/document_6233235029653202714.mp4',
      out: 'uploads/gifts/crystal_phoenix.svga',
      crop: 'crop=418:660:75:205',
      colorkey: 'colorkey=0x000000:0.18:0.08',
      fps: 12,
      dur: 3.5
    },
    {
      mp4: 'uploads/raw_gifts/document_6233235029653202715.mp4',
      out: 'uploads/gifts/royal_wedding_gown.svga',
      crop: 'crop=418:660:75:205',
      colorkey: 'colorkey=0x000000:0.18:0.08',
      fps: 12,
      dur: 3.5
    },
    {
      mp4: 'uploads/raw_gifts/document_6233235029653202716.mp4',
      out: 'uploads/gifts/fairy_magic_dress.svga',
      crop: 'crop=418:660:75:205',
      colorkey: 'colorkey=0x000000:0.18:0.08',
      fps: 12,
      dur: 3.0
    },
    {
      mp4: 'uploads/raw_gifts/document_6233235029653202717.mp4',
      out: 'uploads/gifts/mafia_boss_suit.svga',
      crop: 'crop=418:660:75:205',
      colorkey: 'colorkey=0x000000:0.18:0.08',
      fps: 12,
      dur: 3.0
    },
    {
      mp4: 'uploads/raw_gifts/document_6213237146526951223.mp4',
      out: 'uploads/gifts/cyber_superbike.svga',
      crop: 'crop=576:750:0:170',
      colorkey: 'colorkey=0x000000:0.12:0.04',
      fps: 12,
      dur: 3.5
    }
  ];

  for (const t of tasks) {
    const fullIn = path.join(__dirname, t.mp4);
    const fullOut = path.join(__dirname, t.out);
    await convertMp4ToSvga(fullIn, fullOut, t.crop, t.colorkey, t.fps, t.dur);
  }
  console.log('ALL TASKS FINISHED!');
}

runAll();

