const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all distinct conversation threads for the current user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const userObjId = new mongoose.Types.ObjectId(currentUserId);

    // Find all messages involving current user
    const recentMessages = await DirectMessage.aggregate([
      {
        $match: {
          $or: [{ sender: userObjId }, { receiver: userObjId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userObjId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$createdAt' },
          lastMessageSender: { $first: '$sender' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userObjId] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    // Populate user profile details for each conversation partner
    const populated = await Promise.all(
      recentMessages.map(async (conv) => {
        const partner = await User.findById(conv._id).select(
          'name avatar wealthLevel charmLevel isOnline'
        );
        return {
          partnerId: conv._id,
          partner: partner || {
            _id: conv._id,
            name: 'User',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          },
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          isMine: conv.lastMessageSender.toString() === currentUserId.toString(),
          unreadCount: conv.unreadCount || 0,
        };
      })
    );

    return res.json({
      success: true,
      conversations: populated,
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
};

// Get message history with a specific user
exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { partnerId } = req.params;

    if (!partnerId) {
      return res.status(400).json({ success: false, message: 'Partner ID required' });
    }

    const messages = await DirectMessage.find({
      $or: [
        { sender: currentUserId, receiver: partnerId },
        { sender: partnerId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200);

    // Mark incoming messages as read
    await DirectMessage.updateMany(
      { sender: partnerId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    const partner = await User.findById(partnerId).select(
      'name avatar wealthLevel charmLevel isOnline'
    );

    return res.json({
      success: true,
      messages,
      partner,
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
};

// Send a direct message to another user
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id || req.user.id;
    const { partnerId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    if (senderId.toString() === partnerId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newMsg = await DirectMessage.create({
      sender: senderId,
      receiver: partnerId,
      text: text.trim(),
    });

    const populatedMsg = await DirectMessage.findById(newMsg._id).populate(
      'sender',
      'name avatar'
    );

    // Real-time socket delivery
    const io = req.app.get('io');
    if (io) {
      io.emit('new_direct_message', {
        message: populatedMsg,
        receiverId: partnerId,
        senderId,
      });
    }

    return res.json({
      success: true,
      message: populatedMsg,
    });
  } catch (err) {
    console.error('Error sending direct message:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
};

// Get total unread direct message count
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const count = await DirectMessage.countDocuments({
      receiver: currentUserId,
      isRead: false,
    });

    return res.json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    return res.status(500).json({ success: false, unreadCount: 0 });
  }
};
