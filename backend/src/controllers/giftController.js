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
  { name: 'Teddy Bear', category: 'hot', coinPrice: 99, expReward: 99, badge: '🧸', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Teddy%20bear/3D/teddy_bear_3d.png' },
  { name: 'Bouquet', category: 'hot', coinPrice: 299, expReward: 299, badge: '💐', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bouquet/3D/bouquet_3d.png' },
  { name: 'Diamond Ring', category: 'hot', coinPrice: 999, expReward: 999, badge: '💍', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ring/3D/ring_3d.png' },
  { name: 'Fireworks', category: 'hot', coinPrice: 1999, expReward: 1999, badge: '🎆', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fireworks/3D/fireworks_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/halloween.svga' },
  { name: 'Sports Car', category: 'hot', coinPrice: 4999, expReward: 4999, badge: '🏎️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/posche.svga' },
  { name: 'Space Rocket', category: 'hot', coinPrice: 19999, expReward: 19999, badge: '🚀', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/Rocket.svga' },

  // ── 2. LUCKY TAB (Fortune & Mystical) ──
  { name: 'Lucky Clover', category: 'lucky', coinPrice: 30, expReward: 30, badge: '🍀', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Four%20leaf%20clover/3D/four_leaf_clover_3d.png' },
  { name: 'Crystal Ball', category: 'lucky', coinPrice: 150, expReward: 150, badge: '🔮', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crystal%20ball/3D/crystal_ball_3d.png' },
  { name: 'Golden Dice', category: 'lucky', coinPrice: 500, expReward: 500, badge: '🎲', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Game%20die/3D/game_die_3d.png' },
  { name: '777 Jackpot', category: 'lucky', coinPrice: 1200, expReward: 1200, badge: '777', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Slot%20machine/3D/slot_machine_3d.png' },
  { name: 'Sweet Dreams Teddy', category: 'lucky', coinPrice: 3000, expReward: 3000, badge: '🌙', iconUrl: '/uploads/gifts/thumbnails/sweet_dreams_teddy.png', animationUrl: '/uploads/gifts/sweet_dreams_teddy.svga' },
  { name: 'Crescent Moon', category: 'lucky', coinPrice: 5000, expReward: 5000, badge: '🌙', iconUrl: '/uploads/gifts/thumbnails/crescent_moon.png', animationUrl: '/uploads/gifts/crescent_moon.svga' },
  { name: 'Halloween Ghost Car', category: 'lucky', coinPrice: 6666, expReward: 6666, badge: '🎃', iconUrl: '/uploads/gifts/thumbnails/halloween_ghost_car.png', animationUrl: '/uploads/gifts/halloween_ghost_car.svga' },
  { name: 'Fire Flame', category: 'lucky', coinPrice: 12000, expReward: 12000, badge: '🔥', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png' },
  { name: 'Golden Dragon', category: 'lucky', coinPrice: 35000, expReward: 35000, badge: '🐉', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Dragon/3D/dragon_3d.png' },
  { name: 'Cosmic Gem', category: 'lucky', coinPrice: 88888, expReward: 88888, badge: '💎', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png' },

  // ── 3. COUPLE TAB (Romance & Special Numbers) ──
  { name: 'Sweet Kiss', category: 'couple', coinPrice: 20, expReward: 20, badge: '💋', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Kiss%20mark/3D/kiss_mark_3d.png' },
  { name: 'Love Chocolate', category: 'couple', coinPrice: 66, expReward: 66, badge: '🍫', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Chocolate%20bar/3D/chocolate_bar_3d.png' },
  { name: 'Love Lock', category: 'couple', coinPrice: 299, expReward: 299, badge: '🔒', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Locked%20with%20key/3D/locked_with_key_3d.png' },
  { name: 'Heart Latte Coffee', category: 'couple', coinPrice: 520, expReward: 520, badge: '☕', iconUrl: '/uploads/gifts/thumbnails/heart_latte_coffee.png', animationUrl: '/uploads/gifts/heart_latte_coffee.svga' },
  { name: 'Pink Love Teddy', category: 'couple', coinPrice: 1314, expReward: 1314, badge: '🧸', iconUrl: '/uploads/gifts/thumbnails/pink_love_teddy.png', animationUrl: '/uploads/gifts/pink_love_teddy.svga' },
  { name: 'Crystal Rose Dome', category: 'couple', coinPrice: 5200, expReward: 5200, badge: '🌹', iconUrl: '/uploads/gifts/thumbnails/crystal_rose_dome.png', animationUrl: '/uploads/gifts/crystal_rose_dome.svga' },
  { name: 'Heart Jewel Box', category: 'couple', coinPrice: 9999, expReward: 9999, badge: '💖', iconUrl: '/uploads/gifts/thumbnails/heart_jewel_box.png', animationUrl: '/uploads/gifts/heart_jewel_box.svga' },
  { name: 'Cherry Blossom Ride', category: 'couple', coinPrice: 25000, expReward: 25000, badge: '🐎', iconUrl: '/uploads/gifts/thumbnails/cherry_blossom_ride.png', animationUrl: '/uploads/gifts/cherry_blossom_ride.svga' },
  { name: 'Royal Wedding Gown', category: 'couple', coinPrice: 52000, expReward: 52000, badge: '👗', iconUrl: '/uploads/gifts/thumbnails/royal_wedding_gown.png', animationUrl: '/uploads/gifts/royal_wedding_gown.svga' },
  { name: 'Royal Jewel', category: 'couple', coinPrice: 99999, expReward: 99999, badge: '👑', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png' },

  // ── 4. CUSTOM TAB (Cool Audio/Party/Vehicles) ──
  { name: 'Golden Mic', category: 'custom', coinPrice: 88, expReward: 88, badge: '🎙️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Microphone/3D/microphone_3d.png' },
  { name: 'DJ Headphone', category: 'custom', coinPrice: 588, expReward: 588, badge: '🎧', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Headphone/3D/headphone_3d.png' },
  { name: 'Superbike', category: 'custom', coinPrice: 1888, expReward: 1888, badge: '🏍️', iconUrl: '/uploads/gifts/thumbnails/cyber_superbike.png', animationUrl: '/uploads/gifts/cyber_superbike.svga' },
  { name: 'Biker Sheep', category: 'custom', coinPrice: 2000, expReward: 2000, badge: '🐑', iconUrl: '/uploads/gifts/thumbnails/biker_sheep.png', animationUrl: '/uploads/gifts/biker_sheep.svga' },
  { name: 'Fairy Magic Dress', category: 'custom', coinPrice: 10000, expReward: 10000, badge: '🧚', iconUrl: '/uploads/gifts/thumbnails/fairy_magic_dress.png', animationUrl: '/uploads/gifts/fairy_magic_dress.svga' },
  { name: 'Hypercar', category: 'custom', coinPrice: 18888, expReward: 18888, badge: '🏎️', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png' },
  { name: 'Supercar Truck', category: 'custom', coinPrice: 38888, expReward: 38888, badge: '🚚', iconUrl: '/uploads/gifts/thumbnails/birthday_supercar_truck.png', animationUrl: '/uploads/gifts/birthday_supercar_truck.svga' },
  { name: 'Cupid Love Jet', category: 'custom', coinPrice: 88888, expReward: 88888, badge: '✈️', iconUrl: '/uploads/gifts/thumbnails/cupid_love_jet.png', animationUrl: '/uploads/gifts/cupid_love_jet.svga' },
  { name: 'Golden Throne', category: 'custom', coinPrice: 188888, expReward: 188888, badge: '👑', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/kingset.svga' },

  // ── 5. VIP TAB (Ultimate Luxury Spenders) ──
  { name: 'VIP Medal', category: 'vip', coinPrice: 500, expReward: 500, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/1st%20place%20medal/3D/1st_place_medal_3d.png' },
  { name: 'Gold Trophy', category: 'vip', coinPrice: 2000, expReward: 2000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png' },
  { name: 'Champagne Pop', category: 'vip', coinPrice: 5000, expReward: 5000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bottle%20with%20popping%20cork/3D/bottle_with_popping_cork_3d.png' },
  { name: 'Crown of Kings', category: 'vip', coinPrice: 20000, expReward: 20000, badge: 'VIP', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png', animationUrl: 'https://raw.githubusercontent.com/svga/SVGA-Samples/master/kingset.svga' },
  { name: 'Mafia Boss VIP', category: 'vip', coinPrice: 50000, expReward: 50000, badge: '🤵', iconUrl: '/uploads/gifts/thumbnails/mafia_boss_suit.png', animationUrl: '/uploads/gifts/mafia_boss_suit.svga' },
  { name: 'Celestial Palace', category: 'vip', coinPrice: 100000, expReward: 100000, badge: '🕌', iconUrl: '/uploads/gifts/thumbnails/celestial_mosque.png', animationUrl: '/uploads/gifts/celestial_mosque.svga' },
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
      gifts.length < 42 ||
      !gifts.some((g) => g.name === 'Crystal Rose Dome') ||
      gifts.some(
        (g) =>
          !g.iconUrl ||
          g.iconUrl.includes('unsplash') ||
          g.iconUrl.includes('flaticon') ||
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
