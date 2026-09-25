const Gift = require('../models/Gift');
const User = require('../models/User');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const { addRoomExp, addUserWealthExp } = require('../services/levelService');

// Seed default gifts if catalog is empty
const defaultGifts = [
  { name: 'Rose', category: 'popular', coinPrice: 10, expReward: 10, iconUrl: 'https://cdn-icons-png.flaticon.com/512/765/765611.png' },
  { name: 'Heart Ring', category: 'popular', coinPrice: 50, expReward: 50, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' },
  { name: 'Sports Car', category: 'luxury', coinPrice: 500, expReward: 500, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png', animationUrl: 'https://assets.example.com/svga/sports_car.svga' },
  { name: 'Luxury Yacht', category: 'luxury', coinPrice: 2000, expReward: 2000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933890.png', animationUrl: 'https://assets.example.com/svga/yacht.svga' },
  { name: 'Dragon Castle', category: 'effects', coinPrice: 5000, expReward: 5000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/1497/1497573.png', animationUrl: 'https://assets.example.com/svga/dragon.svga' },
];

// @desc    Get All Gifts List
// @route   GET /api/gifts
exports.getGifts = async (req, res) => {
  try {
    let gifts = await Gift.find({ isActive: true }).sort({ coinPrice: 1 });

    if (gifts.length === 0) {
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
    const { giftId, receiverId, roomId, quantity = 1 } = req.body;
    const senderId = req.user._id;

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({ success: false, message: 'Gift not found' });
    }

    const totalCost = gift.coinPrice * quantity;
    const totalExp = gift.expReward * quantity;

    // Sender balance check
    const sender = await User.findById(senderId);
    if (sender.coins < totalCost) {
      return res.status(400).json({
        success: false,
        message: 'Aapke paas paryapt coins nahi hain. Kripya coins recharge karein.',
      });
    }

    // Deduct coins & add wealth exp
    sender.coins -= totalCost;
    const senderLevelResult = addUserWealthExp(sender, totalExp);
    await sender.save();

    // Receiver charm exp update
    let receiver = null;
    if (receiverId) {
      receiver = await User.findById(receiverId);
      if (receiver) {
        receiver.charmExp += totalExp;
        receiver.diamonds += Math.floor(totalCost * 0.5); // 50% diamonds reward to receiver
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
    const transaction = await Transaction.create({
      sender: senderId,
      receiver: receiverId || null,
      room: roomId,
      gift: giftId,
      quantity,
      totalCoins: totalCost,
      roomExpEarned: totalExp,
    });

    return res.status(200).json({
      success: true,
      message: 'Gift safaltapoorvak bhej diya gaya!',
      data: {
        gift,
        quantity,
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
