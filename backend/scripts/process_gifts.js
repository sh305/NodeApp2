const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;

const inputDir = path.join(__dirname, 'uploads', 'raw_gifts');
const outputDir = path.join(__dirname, 'uploads', 'gifts', 'telegram');
const thumbsDir = path.join(__dirname, 'uploads', 'gifts', 'thumbnails');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

const giftConfigs = [
  {
    file: 'document_6213237146526951181.mp4',
    id: 'crescent_moon',
    name: 'Crescent Moon',
    icon: '🌙',
    crop: 'crop=418:660:75:205',
    thumbTime: '00:00:02.000',
    coins: 5000,
    category: 'luxury'
  },
  {
    file: 'document_6213237146526951221.mp4',
    id: 'yellow_porsche',
    name: 'Yellow Porsche',
    icon: '🏎️',
    useSvga: 'posche.svga',
    thumbTime: '00:00:02.000',
    coins: 20000,
    category: 'supercar'
  },
  {
    file: 'document_6213237146526951223.mp4',
    id: 'cyber_superbike',
    name: 'Cyber Superbike',
    icon: '🏍️',
    crop: 'crop=576:750:0:170',
    thumbTime: '00:00:02.000',
    coins: 30000,
    category: 'supercar'
  },
  {
    file: 'document_6233235029653202714.mp4',
    id: 'crystal_phoenix',
    name: 'Crystal Phoenix',
    icon: '🪽',
    crop: 'crop=418:660:75:205',
    thumbTime: '00:00:03.000',
    coins: 15000,
    category: 'luxury'
  },
  {
    file: 'document_6233235029653202715.mp4',
    id: 'royal_wedding_gown',
    name: 'Royal Wedding Gown',
    icon: '👗',
    crop: 'crop=418:660:75:205',
    thumbTime: '00:00:03.000',
    coins: 50000,
    category: 'special'
  },
  {
    file: 'document_6233235029653202716.mp4',
    id: 'fairy_magic_dress',
    name: 'Fairy Magic Dress',
    icon: '🧚',
    crop: 'crop=418:660:75:205',
    thumbTime: '00:00:02.500',
    coins: 10000,
    category: 'special'
  },
  {
    file: 'document_6233235029653202717.mp4',
    id: 'mafia_boss_suit',
    name: 'Mafia Boss VIP',
    icon: '🤵',
    crop: 'crop=418:660:75:205',
    thumbTime: '00:00:02.500',
    coins: 25000,
    category: 'special'
  }
];

console.log('Processing 7 gifts...');
giftConfigs.forEach((g, idx) => {
  const inPath = path.join(inputDir, g.file);
  const outVid = path.join(outputDir, `${g.id}.mp4`);
  const outThumb = path.join(thumbsDir, `${g.id}.png`);

  if (!fs.existsSync(inPath)) {
    console.log(`Skipping ${g.file}, not found`);
    return;
  }

  // 1. Process Video (crop out phone UI)
  if (g.crop) {
    try {
      execSync(`"${ffmpeg}" -y -i "${inPath}" -vf "${g.crop}" -c:v libx264 -crf 20 -preset fast -an "${outVid}"`, { stdio: 'pipe' });
      console.log(`[${idx+1}/7] Video processed: ${g.id}.mp4`);
    } catch (e) {
      console.error(`Error processing video for ${g.id}:`, e.message);
    }
  }

  // 2. Extract Thumbnail
  try {
    const vfThumb = g.crop ? `${g.crop}` : 'scale=400:-1';
    execSync(`"${ffmpeg}" -y -ss ${g.thumbTime} -i "${inPath}" -vf "${vfThumb}" -vframes 1 "${outThumb}"`, { stdio: 'pipe' });
    console.log(`[${idx+1}/7] Thumbnail created: ${g.id}.png`);
  } catch (e) {
    console.error(`Error extracting thumb for ${g.id}:`, e.message);
  }
});

console.log('All 7 gifts processed successfully!');

