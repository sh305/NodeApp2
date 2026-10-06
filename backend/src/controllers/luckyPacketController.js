const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const LuckyPacket = require('../models/LuckyPacket');
const User = require('../models/User');
const Room = require('../models/Room');

const MIN_RECIPIENTS = 20;
const MAX_RECIPIENTS = 100;
const MIN_COINS = 300;
const COUNTDOWN_MS = 5 * 60 * 1000;
const PACKET_TTL_MS = 24 * 60 * 60 * 1000;

const generateShares = (totalCoins, count) => {
  const shares = new Array(count).fill(0);
  let remaining = Math.max(0, Number(totalCoins) || 0);
  for (let i = 0; i < count - 1; i += 1) {
    const slotsLeft = count - i;
    const avg = remaining / slotsLeft;
    const maxGive = Math.min(remaining, Math.max(0, Math.floor(avg * 2)));
    const amount = Math.floor(Math.random() * (maxGive + 1));
    shares[i] = amount;
    remaining -= amount;
  }
  shares[count - 1] = remaining;
  for (let i = shares.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shares[i];
    shares[i] = shares[j];
    shares[j] = tmp;
  }
  const sum = shares.reduce((acc, n) => acc + n, 0);
  if (sum !== Number(totalCoins)) {
    shares[shares.length - 1] += Number(totalCoins) - sum;
  }
  return shares;
};

const toPublicPacket = (packet, currentUserId) => {
  if (!packet) return null;
  const obj = packet.toObject ? packet.toObject() : packet;
  const userId = currentUserId ? String(currentUserId) : '';
  const claimedUserIds = Array.isArray(obj.claims)
    ? obj.claims.map((c) => String(c.user))
    : [];
  const remainingCount = Array.isArray(obj.remainingShares)
    ? obj.remainingShares.length
    : Math.max(0, (obj.recipientCount || 0) - claimedUserIds.length);
  const now = Date.now();
  const opensAt = obj.opensAt ? new Date(obj.opensAt).getTime() : now;
  const isOpen = obj.packetType !== 'countdown' || opensAt <= now;

  return {
    id: String(obj._id),
    roomId: String(obj.room),
    roomTitle: obj.roomTitle || 'Voice Room',
    sender: {
      _id: obj.sender,
      name: obj.senderName || 'User',
      avatar: obj.senderAvatar || '',
      isVip: Boolean(obj.senderIsVip),
    },
    packetType: obj.packetType,
    recipientCount: obj.recipientCount,
    totalCoins: obj.totalCoins,
    remainingCount,
    claimedCount: claimedUserIds.length,
    claimedUserIds,
    hasPassword: obj.packetType === 'password',
    opensAt: obj.opensAt,
    isOpen,
    status: obj.status,
    claimedByMe: Boolean(userId && claimedUserIds.includes(userId)),
    createdAt: obj.createdAt,
  };
};

const buildFlyingPayload = (packet) => ({
  id: `lp_${packet._id}_${Date.now()}`,
  packetId: String(packet._id),
  type: 'lucky_packet',
  sender: {
    _id: packet.sender,
    name: packet.senderName,
    avatar: packet.senderAvatar,
    isVip: Boolean(packet.senderIsVip),
  },
  roomId: packet.room,
  roomTitle: packet.roomTitle,
  message: 'I sent a Lucky Packet',
  packetType: packet.packetType,
  timestamp: new Date(),
});

exports.sendLuckyPacket = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { packetType, recipientCount, coins, password } = req.body || {};

    const type = String(packetType || 'common').toLowerCase();
    if (!['common', 'password', 'countdown'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lucky packet type',
      });
    }

    const count = Number(recipientCount);
    const totalCoins = Number(coins);

    if (!Number.isInteger(count) || count < MIN_RECIPIENTS || count > MAX_RECIPIENTS) {
      return res.status(400).json({
        success: false,
        message: 'For each Packet, the number of recipients must be greater than or equal to 20',
      });
    }

    if (!Number.isSafeInteger(totalCoins) || totalCoins < MIN_COINS) {
      return res.status(400).json({
        success: false,
        message: 'When putting in coins, a minimum of 300 coins must be put in',
      });
    }

    let passwordHash = null;
    if (type === 'password') {
      const pwd = String(password || '').trim();
      if (pwd.length < 4 || pwd.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a password between 4 and 20 characters',
        });
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(pwd, salt);
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const session = await mongoose.startSession();
    let sender;
    let packet;
    try {
      await session.withTransaction(async () => {
        sender = await User.findOneAndUpdate(
          { _id: req.user._id, coins: { $gte: totalCoins } },
          { $inc: { coins: -totalCoins } },
          { new: true, session }
        );
        if (!sender) return;

        const shares = generateShares(totalCoins, count);
        const now = new Date();
        const opensAt = type === 'countdown' ? new Date(now.getTime() + COUNTDOWN_MS) : now;
        const [createdPacket] = await LuckyPacket.create(
          [{
            room: room._id,
            roomTitle: room.title || 'Voice Room',
            sender: sender._id,
            senderName: sender.name,
            senderAvatar: sender.avatar,
            senderIsVip: Boolean(sender.isVip || (sender.vipLevel && sender.vipLevel > 0)),
            packetType: type,
            recipientCount: count,
            totalCoins,
            remainingCoins: totalCoins,
            remainingShares: shares,
            passwordHash,
            opensAt,
            status: 'active',
            claims: [],
          }],
          { session }
        );
        packet = createdPacket;
      });
    } finally {
      await session.endSession();
    }

    if (!sender) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient gold coins to send this lucky packet',
      });
    }

    const publicPacket = toPublicPacket(packet, req.user._id);
    const flyingPayload = buildFlyingPayload(packet);

    const io = req.app.get('io');
    if (io) {
      io.to(String(room._id)).emit('lucky_packet_created', publicPacket);
      io.emit('global_lucky_packet_broadcast', flyingPayload);
    }

    return res.status(200).json({
      success: true,
      message: 'Lucky Packet sent successfully!',
      packet: publicPacket,
      remainingCoins: sender.coins,
    });
  } catch (error) {
    console.error('sendLuckyPacket error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error sending lucky packet',
    });
  }
};

exports.getRoomLuckyPackets = async (req, res) => {
  try {
    const roomId = req.params.id;
    const since = new Date(Date.now() - PACKET_TTL_MS);
    const packets = await LuckyPacket.find({
      room: roomId,
      status: 'active',
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(8);

    return res.status(200).json({
      success: true,
      packets: packets.map((p) => toPublicPacket(p, req.user._id)),
    });
  } catch (error) {
    console.error('getRoomLuckyPackets error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load lucky packets',
    });
  }
};

exports.claimLuckyPacket = async (req, res) => {
  try {
    const roomId = req.params.id;
    const packetId = req.params.packetId;
    const password = String(req.body?.password || '').trim();
    const userId = req.user._id;
    const now = new Date();

    if (!mongoose.Types.ObjectId.isValid(packetId)) {
      return res.status(400).json({ success: false, message: 'Invalid lucky packet' });
    }

    const packet = await LuckyPacket.findOne({ _id: packetId, room: roomId }).select(
      '+passwordHash'
    );
    if (!packet) {
      return res.status(404).json({ success: false, message: 'Lucky packet not found' });
    }

    if (packet.status === 'exhausted' || (packet.remainingShares || []).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This lucky packet is empty',
        packet: toPublicPacket(packet, userId),
      });
    }

    if (packet.claims.some((c) => String(c.user) === String(userId))) {
      return res.status(400).json({
        success: false,
        message: 'You have already opened this lucky packet',
        packet: toPublicPacket(packet, userId),
        alreadyClaimed: true,
      });
    }

    if (packet.packetType === 'countdown' && packet.opensAt && packet.opensAt.getTime() > now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Lucky package will open in 5 minutes',
        packet: toPublicPacket(packet, userId),
        opensAt: packet.opensAt,
      });
    }

    if (packet.packetType === 'password') {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Please enter the password',
          needsPassword: true,
          packet: toPublicPacket(packet, userId),
        });
      }
      const ok = packet.passwordHash
        ? await bcrypt.compare(password, packet.passwordHash)
        : false;
      if (!ok) {
        return res.status(400).json({
          success: false,
          message: 'Wrong password. You cannot loot this lucky packet.',
          needsPassword: true,
          packet: toPublicPacket(packet, userId),
        });
      }
    }

    const session = await mongoose.startSession();
    let updated;
    let remainingWallet = req.user.coins || 0;
    let safeWon = 0;
    try {
      await session.withTransaction(async () => {
        updated = await LuckyPacket.findOneAndUpdate(
          {
            _id: packet._id,
            status: 'active',
            remainingShares: { $exists: true, $ne: [] },
            'claims.user': { $ne: userId },
            $or: [
              { packetType: { $ne: 'countdown' } },
              { opensAt: { $lte: now } },
            ],
          },
          [
            { $set: { _grab: { $arrayElemAt: ['$remainingShares', 0] } } },
            {
              $set: {
                remainingShares: {
                  $slice: ['$remainingShares', 1, { $size: '$remainingShares' }],
                },
                remainingCoins: {
                  $subtract: ['$remainingCoins', { $ifNull: ['$_grab', 0] }],
                },
                claims: {
                  $concatArrays: [
                    '$claims',
                    [
                      {
                        user: userId,
                        name: req.user.name || 'User',
                        avatar: req.user.avatar || '',
                        coins: { $ifNull: ['$_grab', 0] },
                        claimedAt: now,
                      },
                    ],
                  ],
                },
              },
            },
            {
              $set: {
                status: {
                  $cond: [{ $eq: [{ $size: '$remainingShares' }, 0] }, 'exhausted', '$status'],
                },
              },
            },
            { $unset: '_grab' },
          ],
          { new: true, session }
        );
        if (!updated) return;

        const myClaim = updated.claims.find((c) => String(c.user) === String(userId));
        const wonCoins = Number(myClaim?.coins || 0);
        if (!Number.isSafeInteger(wonCoins) || wonCoins < 0 || wonCoins > updated.totalCoins) {
          throw new Error('Invalid lucky packet reward');
        }

        safeWon = wonCoins;
        if (safeWon > 0) {
          const walletUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { coins: safeWon } },
            { new: true, session }
          );
          if (!walletUser) throw new Error('Failed to credit lucky packet reward');
          remainingWallet = walletUser.coins;
        }
      });
    } finally {
      await session.endSession();
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'This lucky packet is empty',
      });
    }

    const publicPacket = toPublicPacket(updated, userId);
    const io = req.app.get('io');
    if (io) {
      io.to(String(roomId)).emit('lucky_packet_updated', publicPacket);
    }

    return res.status(200).json({
      success: true,
      wonCoins: safeWon,
      betterLuck: safeWon === 0,
      message:
        safeWon > 0
          ? `You received ${safeWon} gold coins from the lucky packet`
          : 'Better luck next time',
      packet: publicPacket,
      remainingCoins: remainingWallet,
    });
  } catch (error) {
    console.error('claimLuckyPacket error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to open lucky packet',
    });
  }
};
