const Room = require('../models/Room');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { calculateRoomSeats, getRoomFrameByLevel } = require('../services/levelService');
const { cacheService } = require('../config/redis');

// @desc    Create a new Voice Room
// @route   POST /api/rooms
exports.createRoom = async (req, res) => {
  try {
    const { title, topic, coverImage, isLocked, password } = req.body;
    const userId = req.user._id;

    let passwordHash = null;
    if (isLocked && password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const initialSeatsCount = calculateRoomSeats(1); // 8 seats
    const initialSeats = [];
    for (let i = 0; i < initialSeatsCount; i++) {
      initialSeats.push({
        seatIndex: i,
        user: null,
        isMuted: false,
        isLockedByOwner: false,
      });
    }

    const initialFrame = getRoomFrameByLevel(1);

    const room = await Room.create({
      title: title || `${req.user.name}'s Room`,
      topic: topic || 'Chill & Chat 🎧',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
      owner: userId,
      roomLevel: 1,
      roomExp: 0,
      roomFrame: {
        id: initialFrame.id,
        name: initialFrame.name,
        frameUrl: initialFrame.frameUrl,
      },
      isLocked: !!isLocked,
      passwordHash,
      seats: initialSeats,
      activeMembers: [userId],
    });

    return res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Live Voice Rooms
// @route   GET /api/rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({})
      .populate('owner', 'name avatar wealthLevel activeFrame')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const formattedRooms = rooms.map((r) => {
      const totalSeats = r.calculateTotalSeats();
      return {
        _id: r._id,
        title: r.title,
        topic: r.topic,
        coverImage: r.coverImage,
        owner: r.owner,
        roomLevel: r.roomLevel,
        roomFrame: r.roomFrame,
        isLocked: r.isLocked,
        totalSeats,
        activeMemberCount: r.activeMembers ? r.activeMembers.length : 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedRooms.length,
      rooms: formattedRooms,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Room Details by ID (Checks Kick Status)
// @route   GET /api/rooms/:id
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(id)
      .populate('owner', 'name avatar wealthLevel activeFrame')
      .populate('seats.user', 'name avatar wealthLevel activeFrame')
      .populate('activeMembers', 'name avatar wealthLevel');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user is kicked from room (3 days vs permanent)
    const kickStatus = room.isUserKicked(userId);
    if (kickStatus.kicked) {
      return res.status(403).json({
        success: false,
        kicked: true,
        kickType: kickStatus.kickType,
        expiresAt: kickStatus.expiresAt,
        message: kickStatus.message,
      });
    }

    room.syncSeats();

    const roomData = room.toObject();
    delete roomData.passwordHash;
    roomData.totalSeats = room.calculateTotalSeats();

    return res.status(200).json({
      success: true,
      room: roomData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Room Password to Enter Locked Room
// @route   POST /api/rooms/:id/verify-password
exports.verifyRoomPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.isLocked) {
      return res.status(200).json({ success: true, message: 'Room is not locked' });
    }

    const isValid = await room.verifyPassword(password || '');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Galat Password! Kripya sahi password enter karein.' });
    }

    return res.status(200).json({ success: true, message: 'Password verified successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lock or Unlock Room (Owner Only)
// @route   PUT /api/rooms/:id/lock-status
exports.toggleLockRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked, password } = req.body;
    const userId = req.user._id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only room owner can lock/unlock the room' });
    }

    room.isLocked = !!isLocked;
    if (room.isLocked) {
      if (!password || password.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Room lock karne ke liye password zaroori hai' });
      }
      const salt = await bcrypt.genSalt(10);
      room.passwordHash = await bcrypt.hash(password, salt);
    } else {
      room.passwordHash = null;
    }

    await room.save();

    return res.status(200).json({
      success: true,
      isLocked: room.isLocked,
      message: room.isLocked ? 'Room lock ho gaya hai password ke saath.' : 'Room unlock ho gaya hai.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Kick User from Room (3 Days or Permanent)
// @route   POST /api/rooms/:id/kick
exports.kickUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId, kickType, reason } = req.body; // kickType: '3days' | 'permanent'
    const ownerId = req.user._id;

    if (!['3days', 'permanent'].includes(kickType)) {
      return res.status(400).json({ success: false, message: 'Invalid kickType. Must be 3days or permanent' });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: 'Sirf room owner hi kick kar sakta hai' });
    }

    if (targetUserId.toString() === ownerId.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot kick themselves' });
    }

    let expiresAt = null;
    if (kickType === '3days') {
      expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    // Remove existing kick for this user if any
    room.kickedUsers = room.kickedUsers.filter(
      (k) => k.user && k.user.toString() !== targetUserId.toString()
    );

    room.kickedUsers.push({
      user: targetUserId,
      kickType,
      expiresAt,
      reason: reason || 'Kicked by room owner',
      kickedAt: new Date(),
    });

    // Remove target user from active seats
    room.seats.forEach((seat) => {
      if (seat.user && seat.user.toString() === targetUserId.toString()) {
        seat.user = null;
      }
    });

    // Remove from activeMembers
    room.activeMembers = room.activeMembers.filter(
      (m) => m.toString() !== targetUserId.toString()
    );

    await room.save();

    return res.status(200).json({
      success: true,
      message:
        kickType === '3days'
          ? 'User ko 3 din ke liye room se kick kar diya gaya hai.'
          : 'User ko permanent kick kar diya gaya hai. Jab tak aap unkick nahi karenge wo nahi aa payenge.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unkick User from Room (Room Owner removes user from kick list)
// @route   POST /api/rooms/:id/unkick
exports.unkickUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const ownerId = req.user._id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: 'Only room owner can unkick users' });
    }

    room.kickedUsers = room.kickedUsers.filter(
      (k) => k.user && k.user.toString() !== targetUserId.toString()
    );

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'User ko room ke kick list se hata diya gaya hai. Wo ab enter kar sakte hain.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get List of Kicked Users in Room
// @route   GET /api/rooms/:id/kicked-users
exports.getKickedUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const room = await Room.findById(id).populate('kickedUsers.user', 'name avatar wealthLevel');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({
      success: true,
      kickedUsers: room.kickedUsers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
