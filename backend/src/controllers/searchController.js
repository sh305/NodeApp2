const User = require('../models/User');
const Room = require('../models/Room');

// Sample family data matching Screenshot 5
const SAMPLE_FAMILIES = [
  {
    _id: 'fam_001',
    name: 'King',
    badge: 'king🦁',
    badgeLevel: 1,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    membersCount: 21,
    maxMembers: 100,
    familyId: '733024',
    disabled: true,
  },
  {
    _id: 'fam_002',
    name: 'KING FAIMLY',
    badge: 'KING NO1',
    badgeLevel: 2,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    membersCount: 41,
    maxMembers: 100,
    familyId: '301436',
    disabled: true,
  },
  {
    _id: 'fam_003',
    name: 'Royal Stars',
    badge: 'ROYAL👑',
    badgeLevel: 3,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    membersCount: 68,
    maxMembers: 100,
    familyId: '519283',
    disabled: true,
  },
];

// Helper to generate consistent numeric display ID from mongo _id or stored customId
const getDisplayId = (item, prefix = '') => {
  if (item.customId) return item.customId;
  if (item.roomId) return item.roomId;
  // Convert last 6-8 hex chars of ObjectId to numeric string
  const hex = (item._id || '').toString().slice(-6);
  const num = parseInt(hex, 16) || 123456;
  return `${prefix}${num % 90000000 + 10000000}`;
};

// @desc    Global Search (Users, Rooms, Families)
// @route   GET /api/search?q=keyword&type=all|user|room|family
exports.globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const type = (req.query.type || 'all').toLowerCase();
    const currentUserId = req.user?._id;

    // Load current user's following list if authenticated
    let followingIds = new Set();
    if (currentUserId) {
      const me = await User.findById(currentUserId).select('following');
      if (me?.following) {
        me.following.forEach((id) => followingIds.add(id.toString()));
      }
    }

    const results = {
      users: [],
      rooms: [],
      families: [],
    };

    // 1. Search Users
    if (type === 'all' || type === 'user') {
      const userCondition = q
        ? {
            $or: [
              { name: { $regex: q, $options: 'i' } },
              { customId: { $regex: q, $options: 'i' } },
            ],
          }
        : {};

      const userLimit = type === 'user' ? 60 : 3;
      const foundUsers = await User.find(userCondition)
        .select('name avatar wealthLevel gender activeFrame customId')
        .limit(userLimit)
        .lean();

      results.users = foundUsers.map((u) => {
        const uIdStr = u._id.toString();
        return {
          _id: u._id,
          name: u.name,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          wealthLevel: u.wealthLevel || 1,
          gender: u.gender || 'male',
          activeFrame: u.activeFrame,
          displayId: u.customId || getDisplayId(u),
          isFollowing: followingIds.has(uIdStr),
          isSelf: currentUserId ? currentUserId.toString() === uIdStr : false,
        };
      });
    }

    // 2. Search Rooms
    if (type === 'all' || type === 'room') {
      const roomCondition = q
        ? {
            $or: [
              { title: { $regex: q, $options: 'i' } },
              { topic: { $regex: q, $options: 'i' } },
              { roomId: { $regex: q, $options: 'i' } },
            ],
          }
        : {};

      const roomLimit = type === 'room' ? 60 : 4;
      const foundRooms = await Room.find(roomCondition)
        .populate('owner', 'name avatar')
        .limit(roomLimit)
        .lean();

      results.rooms = foundRooms.map((r) => {
        const numId = r.roomId || ((parseInt(r._id.toString().slice(-5), 16) || 100000) % 900000 + 100000).toString();
        return {
          _id: r._id,
          title: r.title,
          topic: r.topic || "Welcome, everyone! Let's chat and share the journey.",
          coverImage:
            r.coverImage ||
            r.backgroundImage ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
          roomLevel: r.roomLevel || 1,
          displayRoomId: numId,
          activeMemberCount: r.activeMembers?.length || 0,
          isLocked: Boolean(r.isLocked),
          ownerName: r.owner?.name || 'Host',
        };
      });
    }

    // 3. Search Families (Disabled for now as requested)
    if (type === 'all' || type === 'family') {
      if (!q) {
        results.families = SAMPLE_FAMILIES;
      } else {
        const lowerQ = q.toLowerCase();
        results.families = SAMPLE_FAMILIES.filter(
          (f) =>
            f.name.toLowerCase().includes(lowerQ) ||
            f.badge.toLowerCase().includes(lowerQ) ||
            f.familyId.includes(lowerQ)
        );
      }
    }

    return res.status(200).json({
      success: true,
      query: q,
      type,
      ...results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
