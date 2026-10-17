const Gift = require('../models/Gift');
const User = require('../models/User');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const { addRoomExp, addUserWealthExp } = require('../services/levelService');

// Seed default gifts matching Screenshot 1 tabs (Hot, Lucky, Couple, Custom, VIP)
const defaultGifts = [
  // ── 1. HOT TAB (Matching Screenshot 1) ──
  { name: 'Train Ticket', category: 'hot', coinPrice: 39, expReward: 39, badge: 'Train', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200' },
  { name: 'Treasure Chest', category: 'hot', coinPrice: 399, expReward: 399, badge: 'Train', iconUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200' },
  { name: 'Lucky Wheel', category: 'hot', coinPrice: 3999, expReward: 3999, badge: 'Train', iconUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200' },
  { name: 'Golden Train', category: 'hot', coinPrice: 13999, expReward: 13999, badge: 'Train', iconUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=200' },
  { name: 'Flower Bouquet', category: 'hot', coinPrice: 999, expReward: 999, badge: '', iconUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200' },
  { name: 'I Love You', category: 'hot', coinPrice: 35, expReward: 35, badge: '', iconUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200' },
  { name: 'Golden Rose', category: 'hot', coinPrice: 1999, expReward: 1999, badge: '', iconUrl: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=200' },
  { name: 'Fire Tiger', category: 'hot', coinPrice: 49999, expReward: 49999, badge: '', iconUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=200' },

  // ── 2. LUCKY TAB ──
  { name: 'Lucky Clover', category: 'lucky', coinPrice: 50, expReward: 50, badge: '🍀', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' },
  { name: 'Crystal Ball', category: 'lucky', coinPrice: 200, expReward: 200, badge: '', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933890.png' },
  { name: 'Gold Jackpot', category: 'lucky', coinPrice: 1000, expReward: 1000, badge: '777', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1497/1497573.png' },
  { name: 'Diamond Ring', category: 'lucky', coinPrice: 5000, expReward: 5000, badge: '💎', iconUrl: 'https://cdn-icons-png.flaticon.com/512/765/765611.png' },
  { name: 'Magic Lamp', category: 'lucky', coinPrice: 10000, expReward: 10000, badge: '', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
  { name: 'Phoenix Feather', category: 'lucky', coinPrice: 25000, expReward: 25000, badge: '🔥', iconUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=200' },
  { name: 'Golden Dragon', category: 'lucky', coinPrice: 50000, expReward: 50000, badge: '🐉', iconUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200' },
  { name: 'Cosmic Portal', category: 'lucky', coinPrice: 100000, expReward: 100000, badge: '✨', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200' },

  // ── 3. COUPLE TAB ──
  { name: 'Love Heart', category: 'couple', coinPrice: 20, expReward: 20, badge: '❤️', iconUrl: 'https://cdn-icons-png.flaticon.com/512/765/765611.png' },
  { name: 'Sweet Kiss', category: 'couple', coinPrice: 66, expReward: 66, badge: '💋', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' },
  { name: 'Teddy Bear', category: 'couple', coinPrice: 299, expReward: 299, badge: '🧸', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
  { name: 'Couple Rings', category: 'couple', coinPrice: 1314, expReward: 1314, badge: '520', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933890.png' },
  { name: 'Love Castle', category: 'couple', coinPrice: 9999, expReward: 9999, badge: '🏰', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1497/1497573.png' },
  { name: 'Romantic Sunset', category: 'couple', coinPrice: 19999, expReward: 19999, badge: '🌅', iconUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200' },
  { name: 'Eternal Oath', category: 'couple', coinPrice: 52000, expReward: 52000, badge: '💍', iconUrl: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=200' },
  { name: 'Love Symphony', category: 'couple', coinPrice: 99999, expReward: 99999, badge: '🎵', iconUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200' },

  // ── 4. CUSTOM TAB ──
  { name: 'Mic Flame', category: 'custom', coinPrice: 88, expReward: 88, badge: '🎙️', iconUrl: 'https://cdn-icons-png.flaticon.com/512/765/765611.png' },
  { name: 'Neon Crown', category: 'custom', coinPrice: 588, expReward: 588, badge: '👑', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' },
  { name: 'Party Fireworks', category: 'custom', coinPrice: 1888, expReward: 1888, badge: '🎆', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
  { name: 'DJ Turntable', category: 'custom', coinPrice: 6666, expReward: 6666, badge: '🎧', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933890.png' },
  { name: 'Neon Supercar', category: 'custom', coinPrice: 18888, expReward: 18888, badge: '🏎️', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1497/1497573.png' },
  { name: 'Space Rocket', category: 'custom', coinPrice: 38888, expReward: 38888, badge: '🚀', iconUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200' },
  { name: 'Golden Throne', category: 'custom', coinPrice: 88888, expReward: 88888, badge: '⚜️', iconUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200' },
  { name: 'Galactic Empire', category: 'custom', coinPrice: 188888, expReward: 188888, badge: '🌌', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200' },

  // ── 5. VIP TAB ──
  { name: 'VIP Gold Medal', category: 'vip', coinPrice: 500, expReward: 500, badge: 'VIP', iconUrl: 'https://cdn-icons-png.flaticon.com/512/765/765611.png' },
  { name: 'Gold Bullion', category: 'vip', coinPrice: 2000, expReward: 2000, badge: 'VIP', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' },
  { name: 'Royal Scepter', category: 'vip', coinPrice: 8000, expReward: 8000, badge: 'VIP', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
  { name: 'Crown of Kings', category: 'vip', coinPrice: 20000, expReward: 20000, badge: 'VIP', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933890.png' },
  { name: 'Diamond Yacht', category: 'vip', coinPrice: 50000, expReward: 50000, badge: 'VIP', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1497/1497573.png' },
  { name: 'Pegasus Chariot', category: 'vip', coinPrice: 100000, expReward: 100000, badge: 'VIP', iconUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=200' },
  { name: 'King Castle', category: 'vip', coinPrice: 200000, expReward: 200000, badge: 'VIP', iconUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200' },
  { name: 'Emperor Dragon', category: 'vip', coinPrice: 500000, expReward: 500000, badge: 'VIP', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200' },
];

// @desc    Get All Gifts List
// @route   GET /api/gifts
exports.getGifts = async (req, res) => {
  try {
    let gifts = await Gift.find({ isActive: true }).sort({ coinPrice: 1 });

    if (gifts.length < 10) {
      await Gift.deleteMany({});
      gifts = await Gift.insertMany(defaultGifts);
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
    const { giftId, receiverId, receiverIds, roomId, quantity = 1, isAll = false } = req.body;
    const senderId = req.user._id;

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({ success: false, message: 'Gift not found' });
    }

    let targetReceiverIds = [];
    if (isAll && Array.isArray(receiverIds) && receiverIds.length > 0) {
      targetReceiverIds = receiverIds.filter(Boolean);
    } else if (receiverId) {
      targetReceiverIds = [receiverId];
    }

    const recipientsCount = Math.max(1, targetReceiverIds.length);
    const totalCost = gift.coinPrice * quantity * recipientsCount;
    const totalExp = gift.expReward * quantity * recipientsCount;

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
    sender.giftsSent = (sender.giftsSent || 0) + (quantity * recipientsCount);
    addUserWealthExp(sender, totalExp);
    await sender.save();

    // Receivers charm exp & diamonds reward update
    for (const rId of targetReceiverIds) {
      const receiver = await User.findById(rId);
      if (receiver) {
        receiver.charmExp += (gift.expReward * quantity);
        receiver.diamonds += Math.floor((gift.coinPrice * quantity) * 0.5); // 50% diamonds reward
        receiver.giftsReceived = (receiver.giftsReceived || 0) + quantity;
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
      quantity: quantity * recipientsCount,
      totalCoins: totalCost,
      roomExpEarned: totalExp,
    });

    return res.status(200).json({
      success: true,
      message: 'Gift sent successfully!',
      data: {
        gift,
        quantity,
        isAll,
        recipientsCount,
        senderCoins: sender.coins,
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
