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
      .populate('owner', 'name avatar wealthLevel activeFrame customId gender')
      .populate('hosts', 'name avatar wealthLevel activeFrame customId gender')
      .populate('admins', 'name avatar wealthLevel activeFrame customId gender')
      .populate('members', 'name avatar wealthLevel activeFrame customId gender')
      .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender')
      .populate('activeMembers', 'name avatar wealthLevel activeFrame customId gender')
      .populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender')
      .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender')
      .populate('bossSeat.purchasedBy', 'name avatar');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.checkBossSeatActive) {
      room.checkBossSeatActive();
    }

    // Check if user is kicked from room (3 days vs permanent) BEFORE adding to activeMembers
    const kickStatus = room.isUserKicked(userId);
    if (kickStatus.kicked) {
      // Remove kicked user from active members or seats if present
      let changed = false;
      room.seats.forEach((seat) => {
        if (seat.user && (seat.user._id ? seat.user._id.toString() : seat.user.toString()) === userId.toString()) {
          seat.user = null;
          changed = true;
        }
      });
      const beforeLen = room.activeMembers.length;
      room.activeMembers = room.activeMembers.filter(
        (m) => (m._id ? m._id.toString() : m.toString()) !== userId.toString()
      );
      if (room.activeMembers.length !== beforeLen) {
        changed = true;
      }
      if (changed) {
        await room.save();
      }

      return res.status(403).json({
        success: false,
        kicked: true,
        kickType: kickStatus.kickType,
        expiresAt: kickStatus.expiresAt,
        message: kickStatus.message,
      });
    }

    // Register user in activeMembers if not already present
    const alreadyActive = room.activeMembers.some(
      (m) => (m._id ? m._id.toString() : m.toString()) === userId.toString()
    );
    if (!alreadyActive) {
      room.activeMembers.push(userId);
      await room.save();
      await room.populate('activeMembers', 'name avatar wealthLevel activeFrame customId gender');
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
    const { targetUserId, kickType = 'permanent', reason } = req.body; // kickType: '3days' | 'permanent'
    const ownerId = req.user._id;

    const chosenKickType = ['3days', 'permanent'].includes(kickType) ? kickType : 'permanent';

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const isOwner = room.owner.toString() === ownerId.toString();
    const isAdmin = room.admins && room.admins.some((a) => (a._id ? a._id.toString() : a.toString()) === ownerId.toString());
    const isHost = room.isHostActive && (isOwner || (room.hosts && room.hosts.some((h) => (h._id ? h._id.toString() : h.toString()) === ownerId.toString())));
    if (!isOwner && !isAdmin && !isHost) {
      return res.status(403).json({ success: false, message: 'Only room owner, admin, or host can kick users' });
    }

    if (targetUserId.toString() === room.owner.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot kick room owner' });
    }

    if (targetUserId.toString() === ownerId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot kick yourself' });
    }

    let expiresAt = null;
    if (chosenKickType === '3days') {
      expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    // Look up kicker name
    const kicker = await User.findById(ownerId).select('name');
    const kickerName = kicker?.name || (isOwner ? 'Room Owner' : 'Room Admin');

    // Remove existing kick for this user if any
    room.kickedUsers = room.kickedUsers.filter(
      (k) => k.user && (k.user._id ? k.user._id.toString() : k.user.toString()) !== targetUserId.toString()
    );

    room.kickedUsers.push({
      user: targetUserId,
      kickType: chosenKickType,
      expiresAt,
      reason: reason || 'Kicked by room owner',
      kickedBy: ownerId,
      kickedByName: kickerName,
      kickedAt: new Date(),
    });

    // Remove target user from active seats
    room.seats.forEach((seat) => {
      if (seat.user && (seat.user._id ? seat.user._id.toString() : seat.user.toString()) === targetUserId.toString()) {
        seat.user = null;
      }
    });

    // Remove from activeMembers
    room.activeMembers = room.activeMembers.filter(
      (m) => (m._id ? m._id.toString() : m.toString()) !== targetUserId.toString()
    );

    await room.save();

    return res.status(200).json({
      success: true,
      message:
        chosenKickType === '3days'
          ? 'User kicked from room for 3 days.'
          : 'User kicked from room permanently until unblocked.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unkick User from Room (Room Owner / Admin removes user from kick list)
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

    const isOwner = room.owner.toString() === ownerId.toString();
    const isAdmin = room.admins && room.admins.some((a) => (a._id ? a._id.toString() : a.toString()) === ownerId.toString());
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only room owner or admin can unblock users' });
    }

    room.kickedUsers = room.kickedUsers.filter(
      (k) => k.user && (k.user._id ? k.user._id.toString() : k.user.toString()) !== targetUserId.toString()
    );

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'User unblocked from room successfully.',
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

    const room = await Room.findById(id)
      .populate('kickedUsers.user', 'name avatar wealthLevel customId')
      .populate('kickedUsers.kickedBy', 'name avatar');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const isOwner = room.owner.toString() === ownerId.toString();
    const isAdmin = room.admins && room.admins.some((a) => (a._id ? a._id.toString() : a.toString()) === ownerId.toString());
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const formattedList = (room.kickedUsers || [])
      .filter((k) => k && k.user)
      .map((k) => {
        const u = k.user;
        let displayId = '';
        if (u.customId) {
          displayId = u.customId;
        } else if (u._id) {
          const hex = u._id.toString().slice(-6);
          const num = parseInt(hex, 16) || 123456;
          displayId = `${(num % 90000000) + 10000000}`;
        }
        return {
          _id: u._id,
          user: u,
          displayId,
          kickType: k.kickType || 'permanent',
          kickedAt: k.kickedAt,
          expiresAt: k.expiresAt,
          kickedByName: k.kickedBy?.name || k.kickedByName || 'Room Owner',
        };
      });

    return res.status(200).json({
      success: true,
      kickedUsers: formattedList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Room People (Hosts, Admins, Members)
// @route   GET /api/rooms/:id/people
exports.getRoomPeople = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id)
      .populate('owner', 'name avatar wealthLevel activeFrame customId gender')
      .populate('hosts', 'name avatar wealthLevel activeFrame customId gender')
      .populate('admins', 'name avatar wealthLevel activeFrame customId gender')
      .populate('members', 'name avatar wealthLevel activeFrame customId gender')
      .populate('activeMembers', 'name avatar wealthLevel activeFrame customId gender');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const ownerId = (room.owner?._id || room.owner || '').toString();

    // Room owner can NEVER be in hosts or admins list (owner cannot be removed)
    const hostList = (room.hosts || []).filter(
      (h) => (h._id ? h._id.toString() : h.toString()) !== ownerId
    );
    const adminList = (room.admins || []).filter(
      (a) => (a._id ? a._id.toString() : a.toString()) !== ownerId
    );
    const memberList = (room.members || []).filter(
      (m) => (m._id ? m._id.toString() : m.toString()) !== ownerId
    );

    return res.status(200).json({
      success: true,
      hosts: hostList,
      admins: adminList,
      members: memberList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove User from Host Team
// @route   POST /api/rooms/:id/remove-host
exports.removeHost = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const ownerId = (room.owner?._id || room.owner || '').toString();
    if (ownerId && targetUserId.toString() === ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Room owner cannot be removed from Host team',
      });
    }

    room.hosts = (room.hosts || []).filter(
      (h) => (h._id ? h._id.toString() : h.toString()) !== targetUserId.toString()
    );

    await room.save();

    const updatedRoom = await Room.findById(id)
      .populate('hosts', 'name avatar wealthLevel activeFrame customId gender');

    const hostList = (updatedRoom.hosts || []).filter(
      (h) => (h._id ? h._id.toString() : h.toString()) !== ownerId
    );

    return res.status(200).json({
      success: true,
      message: 'User removed from Host team',
      hosts: hostList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove User from Admin Team
// @route   POST /api/rooms/:id/remove-admin
exports.removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const ownerId = (room.owner?._id || room.owner || '').toString();
    if (ownerId && targetUserId.toString() === ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Room owner cannot be removed from Admin team',
      });
    }

    room.admins = (room.admins || []).filter(
      (a) => (a._id ? a._id.toString() : a.toString()) !== targetUserId.toString()
    );

    await room.save();

    const updatedRoom = await Room.findById(id)
      .populate('admins', 'name avatar wealthLevel activeFrame customId gender');

    const adminList = (updatedRoom.admins || []).filter(
      (a) => (a._id ? a._id.toString() : a.toString()) !== ownerId
    );

    return res.status(200).json({
      success: true,
      message: 'User removed from Admin team',
      admins: adminList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add User to Host Team
// @route   POST /api/rooms/:id/add-host
exports.addHost = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.hosts) room.hosts = [];
    if (!room.hosts.some(h => (h._id ? h._id.toString() : h.toString()) === targetUserId.toString())) {
      room.hosts.push(targetUserId);
      await room.save();
    }

    const updatedRoom = await Room.findById(id)
      .populate('hosts', 'name avatar wealthLevel activeFrame customId gender');

    return res.status(200).json({
      success: true,
      message: 'User added to Host team',
      hosts: updatedRoom.hosts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add User to Admin Team
// @route   POST /api/rooms/:id/add-admin
exports.addAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.admins) room.admins = [];
    if (!room.admins.some(a => (a._id ? a._id.toString() : a.toString()) === targetUserId.toString())) {
      room.admins.push(targetUserId);
      await room.save();
    }

    const updatedRoom = await Room.findById(id)
      .populate('admins', 'name avatar wealthLevel activeFrame customId gender');

    return res.status(200).json({
      success: true,
      message: 'User added to Admin team',
      admins: updatedRoom.admins,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Purchase Boss Seat (1 month: 100k, 3 months: 240k, 12 months: 720k)
// @route   POST /api/rooms/:id/boss-seat/purchase
exports.purchaseBossSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMonths } = req.body; // 1, 3, or 12
    const userId = req.user._id;

    const PRICING = {
      1: { coins: 100000, days: 30 },
      3: { coins: 240000, days: 90 },
      12: { coins: 720000, days: 365 },
    };

    const tier = PRICING[Number(durationMonths)];
    if (!tier) {
      return res.status(400).json({ success: false, message: 'Invalid duration selected' });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has enough coins
    const currentCoins = Number(user.coins || 0);
    if (currentCoins < tier.coins) {
      return res.status(400).json({
        success: false,
        notEnoughCoins: true,
        message: 'Not enough coins, please recharge first',
      });
    }

    // Deduct coins from user balance
    user.coins = currentCoins - tier.coins;
    await user.save();

    // Calculate expiration date
    const now = new Date();
    let baseDate = now;
    if (room.bossSeat && room.bossSeat.isActive && room.bossSeat.expiresAt && room.bossSeat.expiresAt > now) {
      baseDate = new Date(room.bossSeat.expiresAt);
    }
    const newExpiresAt = new Date(baseDate.getTime() + tier.days * 24 * 60 * 60 * 1000);

    if (!room.bossSeat) {
      room.bossSeat = {};
    }
    room.bossSeat.isActive = true;
    room.bossSeat.expiresAt = newExpiresAt;
    room.bossSeat.purchasedBy = userId;
    await room.save();

    const populatedRoom = await Room.findById(id)
      .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender')
      .populate('bossSeat.purchasedBy', 'name avatar');

    return res.status(200).json({
      success: true,
      message: 'Boss Seat activated successfully!',
      bossSeat: populatedRoom.bossSeat,
      remainingCoins: user.coins,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Take Boss Seat
// @route   POST /api/rooms/:id/boss-seat/take
exports.takeBossSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.bossSeat || !room.bossSeat.isActive || (room.bossSeat.expiresAt && new Date() > room.bossSeat.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Boss Seat is not active in this room' });
    }

    if (room.bossSeat.user && room.bossSeat.user.toString() !== userId.toString()) {
      return res.status(400).json({ success: false, message: 'Boss Seat is already occupied' });
    }

    // A user cannot be on Host seat and Boss seat at the same time
    const isOwner = room.owner.toString() === userId.toString();
    if (isOwner && room.isHostActive) {
      return res.status(400).json({
        success: false,
        message: 'You are currently on the Host seat. Please step down from Host seat first.',
      });
    }

    // Remove user from regular mic seats if sitting on one
    room.seats.forEach((s) => {
      if (s.user && (s.user._id ? s.user._id.toString() : s.user.toString()) === userId.toString()) {
        s.user = null;
      }
    });

    room.bossSeat.user = userId;
    await room.save();

    const populatedRoom = await Room.findById(id)
      .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender')
      .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender');

    return res.status(200).json({
      success: true,
      message: 'You took the Boss Seat',
      bossSeat: populatedRoom.bossSeat,
      seats: populatedRoom.seats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave Boss Seat
// @route   POST /api/rooms/:id/boss-seat/leave
exports.leaveBossSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.bossSeat && room.bossSeat.user && (room.bossSeat.user._id ? room.bossSeat.user._id.toString() : room.bossSeat.user.toString()) === userId.toString()) {
      room.bossSeat.user = null;
      await room.save();
    }

    const populatedRoom = await Room.findById(id)
      .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender');

    return res.status(200).json({
      success: true,
      message: 'You stepped down from the Boss Seat',
      bossSeat: populatedRoom.bossSeat,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Free Mode (Open mic vs Queue/Application mode)
// @route   POST /api/rooms/:id/free-mode
exports.toggleFreeMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { freeMode } = req.body;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    room.freeMode = Boolean(freeMode);
    await room.save();
    return res.status(200).json({
      success: true,
      freeMode: room.freeMode,
      message: room.freeMode ? 'Free Mode enabled' : 'Free Mode disabled',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply for a Mic Seat (when Free Mode is OFF)
// @route   POST /api/rooms/:id/seat-applicants/apply
exports.applyForSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (!room.seatApplicants) room.seatApplicants = [];
    if (!room.seatApplicants.some((aId) => aId.toString() === userId.toString())) {
      room.seatApplicants.push(userId);
      await room.save();
    }
    const populated = await Room.findById(id).populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');
    return res.status(200).json({
      success: true,
      message: 'Application sent to host!',
      seatApplicants: populated.seatApplicants,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept Seat Applicant
// @route   POST /api/rooms/:id/seat-applicants/accept
exports.acceptSeatApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicantId, seatIndex } = req.body;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    room.syncSeats();
    let targetIndex = seatIndex !== undefined && seatIndex !== null ? Number(seatIndex) : -1;
    if (targetIndex < 0 || targetIndex >= room.seats.length || room.seats[targetIndex]?.user) {
      targetIndex = room.seats.findIndex((s) => !s.user);
    }
    if (targetIndex !== -1) {
      room.seats[targetIndex].user = applicantId;
    }
    if (room.seatApplicants) {
      room.seatApplicants = room.seatApplicants.filter((aId) => aId.toString() !== applicantId.toString());
    }
    await room.save();
    const populated = await Room.findById(id)
      .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender')
      .populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');

    return res.status(200).json({
      success: true,
      message: 'Applicant placed on seat',
      seats: populated.seats,
      seatApplicants: populated.seatApplicants,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject Seat Applicant
// @route   POST /api/rooms/:id/seat-applicants/reject
exports.rejectSeatApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicantId } = req.body;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (room.seatApplicants) {
      room.seatApplicants = room.seatApplicants.filter((aId) => aId.toString() !== applicantId.toString());
      await room.save();
    }
    const populated = await Room.findById(id).populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');
    return res.status(200).json({
      success: true,
      message: 'Applicant removed',
      seatApplicants: populated.seatApplicants,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

