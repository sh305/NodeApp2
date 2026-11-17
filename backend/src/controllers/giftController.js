const Gift = require('../models/Gift');
const User = require('../models/User');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const { addRoomExp, addUserWealthExp } = require('../services/levelService');

// Seed default 3D luxury gifts matching YoYo/Haza voice chat standards (40 gifts across 5 tabs)
const defaultGifts = [
  // ── 1. HOT TAB (Popular, frequent gifting) ──
  { name: 'Red Rose', category: 'hot', coinPrice: 10, expReward: 10, badge: '🌹', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rose/3D/rose_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/rose.svga' },
  { name: 'Love Heart', category: 'hot', coinPrice: 25, expReward: 25, badge: '❤️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkling%20heart/3D/sparkling_heart_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/heartbeat.svga' },
  { name: 'Sweet Swirl Lollipop', category: 'hot', coinPrice: 50, expReward: 50, badge: '🍭', iconUrl: '/uploads/gifts/thumbnails/sweet_swirl_lollipop.png', animationUrl: '/uploads/gifts/sweet_swirl_lollipop.svga' },
  { name: 'Teddy Bear', category: 'hot', coinPrice: 99, expReward: 99, badge: '🧸', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Teddy%20bear/3D/teddy_bear_3d.png' },
  { name: 'Neon Hi Greeting', category: 'hot', coinPrice: 99, expReward: 99, badge: '👋', iconUrl: '/uploads/gifts/thumbnails/neon_hi_greeting.png', animationUrl: '/uploads/gifts/neon_hi_greeting.svga' },
  { name: 'Thank You Heart', category: 'hot', coinPrice: 199, expReward: 199, badge: '💖', iconUrl: '/uploads/gifts/thumbnails/thank_you_heart.png', animationUrl: '/uploads/gifts/thank_you_heart.svga' },
  { name: 'Sweet Candy Ice Cream', category: 'hot', coinPrice: 199, expReward: 199, badge: '🍦', iconUrl: '/uploads/gifts/thumbnails/sweet_candy_icecream.png', animationUrl: '/uploads/gifts/sweet_candy_icecream.svga' },
  { name: 'Choco Berry Popsicle', category: 'hot', coinPrice: 199, expReward: 199, badge: '🍧', iconUrl: '/uploads/gifts/thumbnails/choco_berry_popsicle.png', animationUrl: '/uploads/gifts/choco_berry_popsicle.svga' },
  { name: 'Bouquet', category: 'hot', coinPrice: 299, expReward: 299, badge: '💐', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bouquet/3D/bouquet_3d.png' },
  { name: 'Rainbow Star Parfait', category: 'hot', coinPrice: 300, expReward: 300, badge: '🍧', iconUrl: '/uploads/gifts/thumbnails/rainbow_star_parfait.png', animationUrl: '/uploads/gifts/rainbow_star_parfait.svga' },
  { name: 'Flying Kiss Heart', category: 'hot', coinPrice: 520, expReward: 520, badge: '💋', iconUrl: '/uploads/gifts/thumbnails/flying_kiss_heart.png', animationUrl: '/uploads/gifts/flying_kiss_heart.svga' },
  { name: 'Super Heart Like', category: 'hot', coinPrice: 520, expReward: 520, badge: '👍', iconUrl: '/uploads/gifts/thumbnails/super_heart_like.png', animationUrl: '/uploads/gifts/super_heart_like.svga' },
  { name: 'Celebration Birthday Cake', category: 'hot', coinPrice: 666, expReward: 666, badge: '🎂', iconUrl: '/uploads/gifts/thumbnails/celebration_birthday_cake.png', animationUrl: '/uploads/gifts/celebration_birthday_cake.svga' },
  { name: 'Sweet Glazed Donuts', category: 'hot', coinPrice: 888, expReward: 888, badge: '🍩', iconUrl: '/uploads/gifts/thumbnails/sweet_glazed_donuts.png', animationUrl: '/uploads/gifts/sweet_glazed_donuts.svga' },
  { name: 'Diamond Ring', category: 'hot', coinPrice: 999, expReward: 999, badge: '💍', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ring/3D/ring_3d.png' },
  { name: 'Love Rose Gun', category: 'hot', coinPrice: 1314, expReward: 1314, badge: '🔫', iconUrl: '/uploads/gifts/thumbnails/love_rose_gun.png', animationUrl: '/uploads/gifts/love_rose_gun.svga' },
  { name: 'Fireworks', category: 'hot', coinPrice: 1999, expReward: 1999, badge: '🎆', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fireworks/3D/fireworks_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/halloween.svga' },
  { name: 'Crystal Magic Perfume', category: 'hot', coinPrice: 2222, expReward: 2222, badge: '🧪', iconUrl: '/uploads/gifts/thumbnails/crystal_magic_perfume.png', animationUrl: '/uploads/gifts/crystal_magic_perfume.svga' },
  { name: 'Golden Money Gun', category: 'hot', coinPrice: 3000, expReward: 3000, badge: '💸', iconUrl: '/uploads/gifts/thumbnails/golden_money_gun.png', animationUrl: '/uploads/gifts/golden_money_gun.svga' },
  { name: 'Sports Car', category: 'hot', coinPrice: 4999, expReward: 4999, badge: '🏎️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/posche.svga' },
  { name: 'Space Rocket', category: 'hot', coinPrice: 19999, expReward: 19999, badge: '🚀', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/Rocket.svga' },

  // ── 2. LUCKY TAB (Fortune & Mystical) ──
  { name: 'Lucky Clover', category: 'lucky', coinPrice: 30, expReward: 30, badge: '🍀', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Four%20leaf%20clover/3D/four_leaf_clover_3d.png' },
  { name: 'Lucky Four Clover', category: 'lucky', coinPrice: 50, expReward: 50, badge: '🍀', iconUrl: '/uploads/gifts/thumbnails/lucky_four_clover.png', animationUrl: '/uploads/gifts/lucky_four_clover.svga' },
  { name: 'Sparkle Face Mask', category: 'lucky', coinPrice: 66, expReward: 66, badge: '😷', iconUrl: '/uploads/gifts/thumbnails/sparkle_face_mask.png', animationUrl: '/uploads/gifts/sparkle_face_mask.svga' },
  { name: 'Crystal Ball', category: 'lucky', coinPrice: 150, expReward: 150, badge: '🔮', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crystal%20ball/3D/crystal_ball_3d.png' },
  { name: 'Cupid Love Slingshot', category: 'lucky', coinPrice: 299, expReward: 299, badge: '🏹', iconUrl: '/uploads/gifts/thumbnails/cupid_love_slingshot.png', animationUrl: '/uploads/gifts/cupid_love_slingshot.svga' },
  { name: 'Golden Magic Corn', category: 'lucky', coinPrice: 300, expReward: 300, badge: '🌽', iconUrl: '/uploads/gifts/thumbnails/golden_magic_corn.png', animationUrl: '/uploads/gifts/golden_magic_corn.svga' },
  { name: 'Golden Dice', category: 'lucky', coinPrice: 500, expReward: 500, badge: '🎲', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Game%20die/3D/game_die_3d.png' },
  { name: 'Shadow Tarantula', category: 'lucky', coinPrice: 666, expReward: 666, badge: '🕷️', iconUrl: '/uploads/gifts/thumbnails/shadow_tarantula.png', animationUrl: '/uploads/gifts/shadow_tarantula.svga' },
  { name: 'Luminous Pearl Shell', category: 'lucky', coinPrice: 777, expReward: 777, badge: '🦪', iconUrl: '/uploads/gifts/thumbnails/luminous_pearl_shell.png', animationUrl: '/uploads/gifts/luminous_pearl_shell.svga' },
  { name: 'Golden Thunder Bell', category: 'lucky', coinPrice: 888, expReward: 888, badge: '🔔', iconUrl: '/uploads/gifts/thumbnails/golden_thunder_bell.png', animationUrl: '/uploads/gifts/golden_thunder_bell.svga' },
  { name: 'Lucky Wishing Bottle', category: 'lucky', coinPrice: 1200, expReward: 1200, badge: '🏺', iconUrl: '/uploads/gifts/thumbnails/lucky_wishing_bottle.png', animationUrl: '/uploads/gifts/lucky_wishing_bottle.svga' },
  { name: '777 Jackpot', category: 'lucky', coinPrice: 1200, expReward: 1200, badge: '777', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Slot%20machine/3D/slot_machine_3d.png' },
  { name: 'Nimbus Magic Cloud', category: 'lucky', coinPrice: 2000, expReward: 2000, badge: '☁️', iconUrl: '/uploads/gifts/thumbnails/nimbus_magic_cloud.png', animationUrl: '/uploads/gifts/nimbus_magic_cloud.svga' },
  { name: 'Sweet Dreams Teddy', category: 'lucky', coinPrice: 3000, expReward: 3000, badge: '🌙', iconUrl: '/uploads/gifts/thumbnails/sweet_dreams_teddy.png', animationUrl: '/uploads/gifts/sweet_dreams_teddy.svga' },
  { name: 'Deep Sea Pearl', category: 'lucky', coinPrice: 3333, expReward: 3333, badge: '🦪', iconUrl: '/uploads/gifts/thumbnails/deep_sea_pearl.png', animationUrl: '/uploads/gifts/deep_sea_pearl.svga' },
  { name: 'Heart Waterfall', category: 'lucky', coinPrice: 5000, expReward: 5000, badge: '💖', iconUrl: '/uploads/gifts/thumbnails/heart_waterfall.png', animationUrl: '/uploads/gifts/heart_waterfall.svga' },
  { name: 'Crescent Moon', category: 'lucky', coinPrice: 5000, expReward: 5000, badge: '🌙', iconUrl: '/uploads/gifts/thumbnails/crescent_moon.png', animationUrl: '/uploads/gifts/crescent_moon.svga' },
  { name: 'Halloween Ghost Car', category: 'lucky', coinPrice: 6666, expReward: 6666, badge: '🎃', iconUrl: '/uploads/gifts/thumbnails/halloween_ghost_car.png', animationUrl: '/uploads/gifts/halloween_ghost_car.svga' },
  { name: 'Fire Flame', category: 'lucky', coinPrice: 12000, expReward: 12000, badge: '🔥', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png' },
  { name: 'Carousel Merry Go Round', category: 'lucky', coinPrice: 15000, expReward: 15000, badge: '🎠', iconUrl: '/uploads/gifts/thumbnails/carousel_merry_go_round.png', animationUrl: '/uploads/gifts/carousel_merry_go_round.svga' },
  { name: 'Golden Dragon', category: 'lucky', coinPrice: 35000, expReward: 35000, badge: '🐉', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Dragon/3D/dragon_3d.png' },
  { name: 'Cosmic Gem', category: 'lucky', coinPrice: 88888, expReward: 88888, badge: '💎', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png' },

  // ── 3. COUPLE TAB (Romance & Special Numbers) ──
  { name: 'Sweet Kiss', category: 'couple', coinPrice: 20, expReward: 20, badge: '💋', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Kiss%20mark/3D/kiss_mark_3d.png' },
  { name: 'Love Chocolate', category: 'couple', coinPrice: 66, expReward: 66, badge: '🍫', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Chocolate%20bar/3D/chocolate_bar_3d.png' },
  { name: 'Sparkling Crimson Rose', category: 'couple', coinPrice: 99, expReward: 99, badge: '🌹', iconUrl: '/uploads/gifts/thumbnails/sparkling_crimson_rose.png', animationUrl: '/uploads/gifts/sparkling_crimson_rose.svga' },
  { name: 'Finger Heart Love', category: 'couple', coinPrice: 199, expReward: 199, badge: '🫰', iconUrl: '/uploads/gifts/thumbnails/finger_heart_love.png', animationUrl: '/uploads/gifts/finger_heart_love.svga' },
  { name: 'Love Lock', category: 'couple', coinPrice: 299, expReward: 299, badge: '🔒', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Locked%20with%20key/3D/locked_with_key_3d.png' },
  { name: 'Heart Latte Coffee', category: 'couple', coinPrice: 520, expReward: 520, badge: '☕', iconUrl: '/uploads/gifts/thumbnails/heart_latte_coffee.png', animationUrl: '/uploads/gifts/heart_latte_coffee.svga' },
  { name: 'Golden Arrow Love You', category: 'couple', coinPrice: 520, expReward: 520, badge: '💘', iconUrl: '/uploads/gifts/thumbnails/golden_arrow_love_you.png', animationUrl: '/uploads/gifts/golden_arrow_love_you.svga' },
  { name: 'Sweet Boba Couple Tea', category: 'couple', coinPrice: 520, expReward: 520, badge: '🧋', iconUrl: '/uploads/gifts/thumbnails/sweet_boba_couple_tea.png', animationUrl: '/uploads/gifts/sweet_boba_couple_tea.svga' },
  { name: 'Teddy Rose Surprise', category: 'couple', coinPrice: 520, expReward: 520, badge: '🧸', iconUrl: '/uploads/gifts/thumbnails/teddy_rose_surprise.png', animationUrl: '/uploads/gifts/teddy_rose_surprise.svga' },
  { name: 'Love Choco Coffee', category: 'couple', coinPrice: 666, expReward: 666, badge: '☕', iconUrl: '/uploads/gifts/thumbnails/love_chocolate_coffee.png', animationUrl: '/uploads/gifts/love_chocolate_coffee.svga' },
  { name: 'Strawberry Couple Donuts', category: 'couple', coinPrice: 888, expReward: 888, badge: '🍩', iconUrl: '/uploads/gifts/thumbnails/strawberry_couple_donuts.png', animationUrl: '/uploads/gifts/strawberry_couple_donuts.svga' },
  { name: 'Amethyst Royal Ring', category: 'couple', coinPrice: 888, expReward: 888, badge: '💍', iconUrl: '/uploads/gifts/thumbnails/amethyst_royal_ring.png', animationUrl: '/uploads/gifts/amethyst_royal_ring.svga' },
  { name: 'Pink Love Teddy', category: 'couple', coinPrice: 1314, expReward: 1314, badge: '🧸', iconUrl: '/uploads/gifts/thumbnails/pink_love_teddy.png', animationUrl: '/uploads/gifts/pink_love_teddy.svga' },
  { name: 'Romantic Balloon Kiss', category: 'couple', coinPrice: 1314, expReward: 1314, badge: '👩‍❤️‍💋‍👨', iconUrl: '/uploads/gifts/thumbnails/romantic_balloon_kiss.png', animationUrl: '/uploads/gifts/romantic_balloon_kiss.svga' },
  { name: 'Sparkling Rose Bouquet', category: 'couple', coinPrice: 1999, expReward: 1999, badge: '💐', iconUrl: '/uploads/gifts/thumbnails/sparkling_rose_bouquet.png', animationUrl: '/uploads/gifts/sparkling_rose_bouquet.svga' },
  { name: 'Blooming Rose Garden', category: 'couple', coinPrice: 1999, expReward: 1999, badge: '🌹', iconUrl: '/uploads/gifts/thumbnails/blooming_rose_garden.png', animationUrl: '/uploads/gifts/blooming_rose_garden.svga' },
  { name: 'Choco Rose Romance', category: 'couple', coinPrice: 2888, expReward: 2888, badge: '🍫', iconUrl: '/uploads/gifts/thumbnails/choco_rose_romance.png', animationUrl: '/uploads/gifts/choco_rose_romance.svga' },
  { name: 'Flying Love Letter', category: 'couple', coinPrice: 2999, expReward: 2999, badge: '💌', iconUrl: '/uploads/gifts/thumbnails/flying_love_letter.png', animationUrl: '/uploads/gifts/flying_love_letter.svga' },
  { name: 'Stardust Rose Bouquet', category: 'couple', coinPrice: 2999, expReward: 2999, badge: '💐', iconUrl: '/uploads/gifts/thumbnails/stardust_rose_bouquet.png', animationUrl: '/uploads/gifts/stardust_rose_bouquet.svga' },
  { name: 'Ocean Love Letter', category: 'couple', coinPrice: 3333, expReward: 3333, badge: '💌', iconUrl: '/uploads/gifts/thumbnails/ocean_love_letter.png', animationUrl: '/uploads/gifts/ocean_love_letter.svga' },
  { name: 'Angel Wing Heart', category: 'couple', coinPrice: 5200, expReward: 5200, badge: '🪽', iconUrl: '/uploads/gifts/thumbnails/angel_wing_heart.png', animationUrl: '/uploads/gifts/angel_wing_heart.svga' },
  { name: 'Crystal Rose Dome', category: 'couple', coinPrice: 5200, expReward: 5200, badge: '🌹', iconUrl: '/uploads/gifts/thumbnails/crystal_rose_dome.png', animationUrl: '/uploads/gifts/crystal_rose_dome.svga' },
  { name: 'Crystal Rose Box', category: 'couple', coinPrice: 5200, expReward: 5200, badge: '🌹', iconUrl: '/uploads/gifts/thumbnails/crystal_rose_box.png', animationUrl: '/uploads/gifts/crystal_rose_box.svga' },
  { name: 'Winged Crystal Heart', category: 'couple', coinPrice: 5200, expReward: 5200, badge: '💖', iconUrl: '/uploads/gifts/thumbnails/winged_crystal_heart.png', animationUrl: '/uploads/gifts/winged_crystal_heart.svga' },
  { name: 'Cupid Love Arrow', category: 'couple', coinPrice: 8888, expReward: 8888, badge: '🏹', iconUrl: '/uploads/gifts/thumbnails/cupid_love_arrow.png', animationUrl: '/uploads/gifts/cupid_love_arrow.svga' },
  { name: 'Golden Cupid Angel', category: 'couple', coinPrice: 8888, expReward: 8888, badge: '🏹', iconUrl: '/uploads/gifts/thumbnails/golden_cupid_angel.png', animationUrl: '/uploads/gifts/golden_cupid_angel.svga' },
  { name: 'Pink Diamond Ring', category: 'couple', coinPrice: 9999, expReward: 9999, badge: '💎', iconUrl: '/uploads/gifts/thumbnails/pink_diamond_ring.png', animationUrl: '/uploads/gifts/pink_diamond_ring.svga' },
  { name: 'Heart Jewel Box', category: 'couple', coinPrice: 9999, expReward: 9999, badge: '💖', iconUrl: '/uploads/gifts/thumbnails/heart_jewel_box.png', animationUrl: '/uploads/gifts/heart_jewel_box.svga' },
  { name: 'Sweetheart First Kiss', category: 'couple', coinPrice: 9999, expReward: 9999, badge: '👩‍❤️‍💋‍👨', iconUrl: '/uploads/gifts/thumbnails/sweetheart_first_kiss.png', animationUrl: '/uploads/gifts/sweetheart_first_kiss.svga' },
  { name: 'Firework Festival', category: 'couple', coinPrice: 12000, expReward: 12000, badge: '🎆', iconUrl: '/uploads/gifts/thumbnails/romantic_firework_festival.png', animationUrl: '/uploads/gifts/romantic_firework_festival.svga' },
  { name: 'Sweet Love Meet', category: 'couple', coinPrice: 13140, expReward: 13140, badge: '👩‍❤️‍👨', iconUrl: '/uploads/gifts/thumbnails/sweet_love_meet.png', animationUrl: '/uploads/gifts/sweet_love_meet.svga' },
  { name: 'Starlight Proposal', category: 'couple', coinPrice: 13140, expReward: 13140, badge: '💍', iconUrl: '/uploads/gifts/thumbnails/starlight_proposal.png', animationUrl: '/uploads/gifts/starlight_proposal.svga' },
  { name: 'Rainbow Love Balloon', category: 'couple', coinPrice: 15000, expReward: 15000, badge: '🎈', iconUrl: '/uploads/gifts/thumbnails/rainbow_love_balloon.png', animationUrl: '/uploads/gifts/rainbow_love_balloon.svga' },
  { name: 'Diamond Proposal Ring', category: 'couple', coinPrice: 15000, expReward: 15000, badge: '💍', iconUrl: '/uploads/gifts/thumbnails/diamond_proposal_ring.png', animationUrl: '/uploads/gifts/diamond_proposal_ring.svga' },
  { name: 'Cathedral Wedding Bloom', category: 'couple', coinPrice: 18888, expReward: 18888, badge: '💒', iconUrl: '/uploads/gifts/thumbnails/cathedral_wedding_bloom.png', animationUrl: '/uploads/gifts/cathedral_wedding_bloom.svga' },
  { name: 'Moonlit Bridge Romance', category: 'couple', coinPrice: 18888, expReward: 18888, badge: '🌕', iconUrl: '/uploads/gifts/thumbnails/moonlit_bridge_romance.png', animationUrl: '/uploads/gifts/moonlit_bridge_romance.svga' },
  { name: 'Royal Couple Rings', category: 'couple', coinPrice: 20000, expReward: 20000, badge: '💍', iconUrl: '/uploads/gifts/thumbnails/royal_couple_rings.png', animationUrl: '/uploads/gifts/royal_couple_rings.svga' },
  { name: 'Cherry Blossom Ride', category: 'couple', coinPrice: 25000, expReward: 25000, badge: '🐎', iconUrl: '/uploads/gifts/thumbnails/cherry_blossom_ride.png', animationUrl: '/uploads/gifts/cherry_blossom_ride.svga' },
  { name: 'Imperial Lovers Romance', category: 'couple', coinPrice: 25000, expReward: 25000, badge: '🎎', iconUrl: '/uploads/gifts/thumbnails/imperial_lovers_romance.png', animationUrl: '/uploads/gifts/imperial_lovers_romance.svga' },
  { name: 'Pink Love Supercar', category: 'couple', coinPrice: 28888, expReward: 28888, badge: '🏎️', iconUrl: '/uploads/gifts/thumbnails/pink_love_supercar.png', animationUrl: '/uploads/gifts/pink_love_supercar.svga' },
  { name: 'Galaxy Wedding Embrace', category: 'couple', coinPrice: 29999, expReward: 29999, badge: '💍', iconUrl: '/uploads/gifts/thumbnails/galaxy_wedding_embrace.png', animationUrl: '/uploads/gifts/galaxy_wedding_embrace.svga' },
  { name: 'Swan Wedding Cake', category: 'couple', coinPrice: 35000, expReward: 35000, badge: '🦢', iconUrl: '/uploads/gifts/thumbnails/swan_wedding_cake.png', animationUrl: '/uploads/gifts/swan_wedding_cake.svga' },
  { name: 'Royal Wedding Gown', category: 'couple', coinPrice: 52000, expReward: 52000, badge: '👗', iconUrl: '/uploads/gifts/thumbnails/royal_wedding_gown.png', animationUrl: '/uploads/gifts/royal_wedding_gown.svga' },
  { name: 'Wedding Swing Birdcage', category: 'couple', coinPrice: 52000, expReward: 52000, badge: '💍', iconUrl: '/uploads/gifts/thumbnails/wedding_swing_birdcage.png', animationUrl: '/uploads/gifts/wedding_swing_birdcage.svga' },
  { name: 'Royal Jewel', category: 'couple', coinPrice: 99999, expReward: 99999, badge: '👑', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png' },

  // ── 4. CUSTOM TAB (Cool Audio/Party/Vehicles) ──
  { name: 'Golden Mic', category: 'custom', coinPrice: 88, expReward: 88, badge: '🎙️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Microphone/3D/microphone_3d.png' },
  { name: 'Cheers Party Beer Mugs', category: 'custom', coinPrice: 300, expReward: 300, badge: '🍻', iconUrl: '/uploads/gifts/thumbnails/cheers_party_beer_mugs.png', animationUrl: '/uploads/gifts/cheers_party_beer_mugs.svga' },
  { name: 'DJ Headphone', category: 'custom', coinPrice: 588, expReward: 588, badge: '🎧', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Headphone/3D/headphone_3d.png' },
  { name: 'Neon Party Glowsticks', category: 'custom', coinPrice: 666, expReward: 666, badge: '🪄', iconUrl: '/uploads/gifts/thumbnails/neon_party_glowsticks.png', animationUrl: '/uploads/gifts/neon_party_glowsticks.svga' },
  { name: 'Royal Turkish Coffee', category: 'custom', coinPrice: 1200, expReward: 1200, badge: '🫖', iconUrl: '/uploads/gifts/thumbnails/royal_turkish_coffee.png', animationUrl: '/uploads/gifts/royal_turkish_coffee.svga' },
  { name: 'Superbike', category: 'custom', coinPrice: 1888, expReward: 1888, badge: '🏍️', iconUrl: '/uploads/gifts/thumbnails/cyber_superbike.png', animationUrl: '/uploads/gifts/cyber_superbike.svga' },
  { name: 'Biker Sheep', category: 'custom', coinPrice: 2000, expReward: 2000, badge: '🐑', iconUrl: '/uploads/gifts/thumbnails/biker_sheep.png', animationUrl: '/uploads/gifts/biker_sheep.svga' },
  { name: 'Fairy Tales Angel', category: 'custom', coinPrice: 4999, expReward: 4999, badge: '👼', iconUrl: '/uploads/gifts/thumbnails/fairy_tales_angel_boy.png', animationUrl: '/uploads/gifts/fairy_tales_angel_boy.svga' },
  { name: 'Floral Fantasy Bikini', category: 'custom', coinPrice: 5200, expReward: 5200, badge: '👙', iconUrl: '/uploads/gifts/thumbnails/floral_fantasy_bikini.png', animationUrl: '/uploads/gifts/floral_fantasy_bikini.svga' },
  { name: 'Crystal Neon Violin', category: 'custom', coinPrice: 6666, expReward: 6666, badge: '🎻', iconUrl: '/uploads/gifts/thumbnails/crystal_neon_violin.png', animationUrl: '/uploads/gifts/crystal_neon_violin.svga' },
  { name: 'Rainbow Teddy Cake', category: 'custom', coinPrice: 8888, expReward: 8888, badge: '🎂', iconUrl: '/uploads/gifts/thumbnails/rainbow_teddy_cake.png', animationUrl: '/uploads/gifts/rainbow_teddy_cake.svga' },
  { name: 'Fairy Magic Dress', category: 'custom', coinPrice: 10000, expReward: 10000, badge: '🧚', iconUrl: '/uploads/gifts/thumbnails/fairy_magic_dress.png', animationUrl: '/uploads/gifts/fairy_magic_dress.svga' },
  { name: 'Hypercar', category: 'custom', coinPrice: 18888, expReward: 18888, badge: '🏎️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png' },
  { name: 'Cyber Neon Hypercar', category: 'custom', coinPrice: 22222, expReward: 22222, badge: '🏎️', iconUrl: '/uploads/gifts/thumbnails/cyber_neon_hypercar.png', animationUrl: '/uploads/gifts/cyber_neon_hypercar.svga' },
  { name: 'Cyber Fighter Jet', category: 'custom', coinPrice: 35000, expReward: 35000, badge: '✈️', iconUrl: '/uploads/gifts/thumbnails/cyber_fighter_jet.png', animationUrl: '/uploads/gifts/cyber_fighter_jet.svga' },
  { name: 'Supercar Truck', category: 'custom', coinPrice: 38888, expReward: 38888, badge: '🚚', iconUrl: '/uploads/gifts/thumbnails/birthday_supercar_truck.png', animationUrl: '/uploads/gifts/birthday_supercar_truck.svga' },
  { name: 'Cupid Love Jet', category: 'custom', coinPrice: 88888, expReward: 88888, badge: '✈️', iconUrl: '/uploads/gifts/thumbnails/cupid_love_jet.png', animationUrl: '/uploads/gifts/cupid_love_jet.svga' },
  { name: 'Golden Throne', category: 'custom', coinPrice: 188888, expReward: 188888, badge: '👑', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/kingset.svga' },

  // ── 5. VIP TAB (Ultimate Luxury Spenders) ──
  { name: 'VIP Medal', category: 'vip', coinPrice: 500, expReward: 500, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/1st%20place%20medal/3D/1st_place_medal_3d.png' },
  { name: 'Crystal Luxury Perfume', category: 'vip', coinPrice: 999, expReward: 999, badge: '💎', iconUrl: '/uploads/gifts/thumbnails/crystal_luxury_perfume.png', animationUrl: '/uploads/gifts/crystal_luxury_perfume.svga' },
  { name: 'Crystal Ice Slippers', category: 'vip', coinPrice: 1314, expReward: 1314, badge: '👠', iconUrl: '/uploads/gifts/thumbnails/crystal_ice_slippers.png', animationUrl: '/uploads/gifts/crystal_ice_slippers.svga' },
  { name: 'Cinderella Glass Slipper', category: 'vip', coinPrice: 1520, expReward: 1520, badge: '👡', iconUrl: '/uploads/gifts/thumbnails/cinderella_glass_slipper.png', animationUrl: '/uploads/gifts/cinderella_glass_slipper.svga' },
  { name: 'Celestial Crystal Violin', category: 'vip', coinPrice: 1888, expReward: 1888, badge: '🎻', iconUrl: '/uploads/gifts/thumbnails/celestial_crystal_violin.png', animationUrl: '/uploads/gifts/celestial_crystal_violin.svga' },
  { name: 'Gold Trophy', category: 'vip', coinPrice: 2000, expReward: 2000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png' },
  { name: 'Champagne Pop', category: 'vip', coinPrice: 5000, expReward: 5000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bottle%20with%20popping%20cork/3D/bottle_with_popping_cork_3d.png' },
  { name: 'Royal Golden Rose', category: 'vip', coinPrice: 18888, expReward: 18888, badge: '🌹', iconUrl: '/uploads/gifts/thumbnails/royal_golden_rose.png', animationUrl: '/uploads/gifts/royal_golden_rose.svga' },
  { name: 'Crown of Kings', category: 'vip', coinPrice: 20000, expReward: 20000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/kingset.svga' },
  { name: 'Celestial Tiara Crown', category: 'vip', coinPrice: 20000, expReward: 20000, badge: '👑', iconUrl: '/uploads/gifts/thumbnails/celestial_tiara_crown.png', animationUrl: '/uploads/gifts/celestial_tiara_crown.svga' },
  { name: 'Imperial Red Crown', category: 'vip', coinPrice: 25000, expReward: 25000, badge: '👑', iconUrl: '/uploads/gifts/thumbnails/imperial_red_crown.png', animationUrl: '/uploads/gifts/imperial_red_crown.svga' },
  { name: 'Magic Flying Carpet', category: 'vip', coinPrice: 35000, expReward: 35000, badge: '🧞', iconUrl: '/uploads/gifts/thumbnails/magic_flying_carpet.png', animationUrl: '/uploads/gifts/magic_flying_carpet.svga' },
  { name: 'Live Carnival Stage', category: 'vip', coinPrice: 50000, expReward: 50000, badge: '🎪', iconUrl: '/uploads/gifts/thumbnails/live_carnival_stage.png', animationUrl: '/uploads/gifts/live_carnival_stage.svga' },
  { name: 'Mafia Boss VIP', category: 'vip', coinPrice: 50000, expReward: 50000, badge: '🤵', iconUrl: '/uploads/gifts/thumbnails/mafia_boss_suit.png', animationUrl: '/uploads/gifts/mafia_boss_suit.svga' },
  { name: 'Enchanted Forest Fairy', category: 'vip', coinPrice: 50000, expReward: 50000, badge: '🧚‍♀️', iconUrl: '/uploads/gifts/thumbnails/enchanted_forest_fairy.png', animationUrl: '/uploads/gifts/enchanted_forest_fairy.svga' },
  { name: 'Celestial Pegasus Castle', category: 'vip', coinPrice: 66666, expReward: 66666, badge: '🏰', iconUrl: '/uploads/gifts/thumbnails/celestial_pegasus_castle.png', animationUrl: '/uploads/gifts/celestial_pegasus_castle.svga' },
  { name: 'Golden Royal Rolls Royce', category: 'vip', coinPrice: 88888, expReward: 88888, badge: '👑', iconUrl: '/uploads/gifts/thumbnails/golden_royal_rolls_royce.png', animationUrl: '/uploads/gifts/golden_royal_rolls_royce.svga' },
  { name: 'Golden Palace Supercar', category: 'vip', coinPrice: 88888, expReward: 88888, badge: '🏎️', iconUrl: '/uploads/gifts/thumbnails/golden_palace_supercar.png', animationUrl: '/uploads/gifts/golden_palace_supercar.svga' },
  { name: 'Celestial Palace', category: 'vip', coinPrice: 100000, expReward: 100000, badge: '🕌', iconUrl: '/uploads/gifts/thumbnails/celestial_mosque.png', animationUrl: '/uploads/gifts/celestial_mosque.svga' },
  { name: 'Dubai Burj Rolls Royce', category: 'vip', coinPrice: 100000, expReward: 100000, badge: '🏎️', iconUrl: '/uploads/gifts/thumbnails/dubai_burj_rolls_royce.png', animationUrl: '/uploads/gifts/dubai_burj_rolls_royce.svga' },
  { name: 'Pegasus Unicorn', category: 'vip', coinPrice: 100000, expReward: 100000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Unicorn/3D/unicorn_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/angel.svga' },
  { name: 'Crystal Phoenix', category: 'vip', coinPrice: 150000, expReward: 150000, badge: '🪽', iconUrl: '/uploads/gifts/thumbnails/crystal_phoenix.png', animationUrl: '/uploads/gifts/crystal_phoenix.svga' },
  { name: 'Emperor Dragon', category: 'vip', coinPrice: 500000, expReward: 500000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Dragon/3D/dragon_3d.png' },
];

// @desc    Get All Gifts List (Auto-seeds/upgrades to 3D gifts with SVGA if missing or outdated)
// @route   GET /api/gifts
exports.getGifts = async (req, res) => {
  try {
    let gifts = await Gift.find({ isActive: true }).sort({ coinPrice: 1 });

    const needsRefresh =
      gifts.length < 129 ||
      !gifts.some((g) => g.name === 'Celestial Crystal Violin') ||
      gifts.some(
        (g) =>
          !g.iconUrl ||
          g.iconUrl.includes('unsplash') ||
          g.iconUrl.includes('flaticon') ||
          g.iconUrl.includes('undefined') ||
          g.iconUrl.includes('undefined') ||
          (g.name === 'Red Rose' && !g.animationUrl)
      );

    if (needsRefresh) {
      await Gift.deleteMany({});
      gifts = await Gift.insertMany(defaultGifts);
      gifts = await Gift.find({ isActive: true }).sort({ coinPrice: 1 });
    }

    return res.status(200).json({ success: true, gifts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Gift in Room (Updates Level, EXP, Frame, and Dynamic Seats)
// @route   POST /api/gifts/send
exports.sendGift = async (req, res) => {
  try {
    const { giftId, receiverId, receiverIds, recipientIds, roomId, quantity = 1, isAll = false } = req.body;
    const senderId = req.user._id;

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({ success: false, message: 'Gift not found' });
    }

    const rawList =
      Array.isArray(receiverIds) && receiverIds.length > 0
        ? receiverIds
        : Array.isArray(recipientIds) && recipientIds.length > 0
        ? recipientIds
        : [];

    let targetReceiverIds = [];
    if (isAll && rawList.length > 0) {
      targetReceiverIds = rawList.filter(Boolean);
    } else if (receiverId) {
      targetReceiverIds = [receiverId];
    } else if (rawList.length > 0) {
      targetReceiverIds = [rawList[0]];
    }

    const recipientsCount = Math.max(1, targetReceiverIds.length);
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const totalCost = gift.coinPrice * parsedQty * recipientsCount;
    const totalExp = gift.expReward * parsedQty * recipientsCount;

    // Sender balance check
    const sender = await User.findById(senderId);
    if (!sender || sender.coins < totalCost) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_COINS',
        message: 'Insufficient coins. Please recharge your wallet.',
      });
    }

    // Deduct coins & add wealth exp & increment giftsSent
    sender.coins -= totalCost;
    sender.giftsSent = (sender.giftsSent || 0) + (parsedQty * recipientsCount);
    addUserWealthExp(sender, totalExp);
    await sender.save();

    // Receivers charm exp & diamonds reward update (50% diamonds reward)
    for (const rId of targetReceiverIds) {
      const receiver = await User.findById(rId);
      if (receiver) {
        receiver.charmExp = (receiver.charmExp || 0) + (gift.expReward * parsedQty);
        receiver.diamonds = (receiver.diamonds || 0) + Math.floor((gift.coinPrice * parsedQty) * 0.5);
        receiver.giftsReceived = (receiver.giftsReceived || 0) + parsedQty;
        await receiver.save();
      }
    }

    // Room EXP update & auto-seat expansion check
    const room = await Room.findById(roomId);
    let roomUpgradeResult = { leveledUp: false, newLevel: 1, currentSeats: 8 };

    if (room) {
      roomUpgradeResult = addRoomExp(room, totalExp);
      await room.save();
    }

    // Create transaction record
    await Transaction.create({
      sender: senderId,
      receiver: targetReceiverIds[0] || null,
      room: roomId,
      gift: giftId,
      quantity: parsedQty * recipientsCount,
      totalCoins: totalCost,
      roomExpEarned: totalExp,
    });

    return res.status(200).json({
      success: true,
      message: 'Gift sent successfully!',
      totalCost,
      remainingCoins: sender.coins,
      data: {
        gift,
        quantity: parsedQty,
        isAll,
        recipientsCount,
        senderCoins: sender.coins,
        remainingCoins: sender.coins,
        senderWealthLevel: sender.wealthLevel,
        senderFrame: sender.activeFrame,
        roomLevel: room ? room.roomLevel : 1,
        roomSeats: room ? room.seats.length : 8,
        roomLeveledUp: roomUpgradeResult.leveledUp,
        roomFrame: room ? room.roomFrame : null,
      },
    });
  } catch (error) {
    console.error('Send gift error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
