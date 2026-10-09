const Family = require('../models/Family');
const User = require('../models/User');

// @desc    Get Recommended Families
// @route   GET /api/families/recommendations
exports.getFamilyRecommendations = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;

    const families = await Family.find()
      .populate('owner', 'name avatar customId')
      .sort({ 'members.length': -1, createdAt: -1 })
      .limit(40);

    const formatted = families.map((fam) => {
      const isMember = (fam.members || []).some(
        (m) => m.user?.toString() === currentUserId.toString()
      );
      const isPending = (fam.pendingRequests || []).some(
        (r) => r.user?.toString() === currentUserId.toString()
      );
      const isOwner = fam.owner?._id?.toString() === currentUserId.toString();

      return {
        _id: fam._id.toString(),
        name: fam.name,
        tag: fam.tag,
        avatar: fam.avatar,
        announcement: fam.announcement || '',
        customId: fam.customId,
        reviewMethod: fam.reviewMethod,
        minUserLevel: fam.minUserLevel || 0,
        minWealthLevel: fam.minWealthLevel || 0,
        memberCount: fam.members?.length || 1,
        maxMembers: fam.maxMembers || 1000,
        isMember,
        isPending,
        isOwner,
        owner: fam.owner,
      };
    });

    return res.status(200).json({
      success: true,
      families: formatted,
    });
  } catch (err) {
    console.error('Error fetching family recommendations:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch family recommendations' });
  }
};

// @desc    Create a new Family
// @route   POST /api/families/create
exports.createFamily = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const {
      name,
      tag,
      avatar,
      announcement,
      reviewMethod = 'admin_review',
      minUserLevel = 0,
      minWealthLevel = 0,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Family Name is required' });
    }
    if (!tag || !tag.trim()) {
      return res.status(400).json({ success: false, message: 'Family Tag is required' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Level 30 requirement check
    const currentLevel = Math.max(currentUser.userLevel || 1, currentUser.wealthLevel || 1);
    if (currentLevel < 30) {
      return res.status(400).json({
        success: false,
        message: `Free create requires Level 30 or above. Your current level is LV.${currentLevel}.`,
      });
    }

    // Check if user already owns a family
    const existingFamily = await Family.findOne({ owner: currentUserId });
    if (existingFamily) {
      return res.status(400).json({
        success: false,
        message: 'You have already created a family!',
      });
    }

    // Check if family tag is already taken
    const cleanTag = tag.trim().toUpperCase();
    const tagExists = await Family.findOne({ tag: cleanTag });
    if (tagExists) {
      return res.status(400).json({
        success: false,
        message: 'This Family Tag is already taken. Please choose another.',
      });
    }

    const newFamily = await Family.create({
      name: name.trim(),
      tag: cleanTag,
      avatar: avatar || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200',
      announcement: announcement ? announcement.trim() : '',
      owner: currentUserId,
      reviewMethod: reviewMethod === 'automatic' ? 'automatic' : 'admin_review',
      minUserLevel: Math.min(70, Math.max(0, Number(minUserLevel) || 0)),
      minWealthLevel: Math.min(100, Math.max(0, Number(minWealthLevel) || 0)),
      members: [
        {
          user: currentUserId,
          role: 'captain',
          joinedAt: new Date(),
        },
      ],
      pendingRequests: [],
    });

    currentUser.family = newFamily._id;
    await currentUser.save();

    return res.status(201).json({
      success: true,
      family: newFamily,
      message: 'Family created successfully! 🎉',
    });
  } catch (err) {
    console.error('Error creating family:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create family' });
  }
};

// @desc    Join / Apply for a Family
// @route   POST /api/families/:id/join
exports.joinFamily = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const family = await Family.findById(id);
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already a member
    const isMember = (family.members || []).some(
      (m) => m.user?.toString() === currentUserId.toString()
    );
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this family' });
    }

    // Check join requirements
    const userLvl = currentUser.userLevel || 1;
    const wealthLvl = currentUser.wealthLevel || 1;

    if (family.minUserLevel > 0 && userLvl < family.minUserLevel) {
      return res.status(400).json({
        success: false,
        message: `User level LV.${family.minUserLevel} required to join this family (Your level: LV.${userLvl}).`,
      });
    }

    if (family.minWealthLevel > 0 && wealthLvl < family.minWealthLevel) {
      return res.status(400).json({
        success: false,
        message: `Wealth level LV.${family.minWealthLevel} required to join this family (Your level: LV.${wealthLvl}).`,
      });
    }

    if (family.reviewMethod === 'automatic') {
      // Pass automatically
      family.members.push({
        user: currentUserId,
        role: 'member',
        joinedAt: new Date(),
      });
      await family.save();

      currentUser.family = family._id;
      await currentUser.save();

      return res.status(200).json({
        success: true,
        status: 'joined',
        message: `Joined ${family.name} successfully! 🎉`,
      });
    } else {
      // Admin's Review
      const alreadyRequested = (family.pendingRequests || []).some(
        (r) => r.user?.toString() === currentUserId.toString()
      );
      if (alreadyRequested) {
        return res.status(400).json({
          success: false,
          message: 'Your join request is already under review by family admin.',
        });
      }

      family.pendingRequests.push({
        user: currentUserId,
        requestedAt: new Date(),
      });
      await family.save();

      return res.status(200).json({
        success: true,
        status: 'pending',
        message: 'Join request submitted! Awaiting family admin review.',
      });
    }
  } catch (err) {
    console.error('Error joining family:', err);
    return res.status(500).json({ success: false, message: 'Failed to join family' });
  }
};

// @desc    Get My Family Details
// @route   GET /api/families/my-family
exports.getMyFamily = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const currentUser = await User.findById(currentUserId);

    let family = null;
    if (currentUser?.family) {
      family = await Family.findById(currentUser.family)
        .populate('owner', 'name avatar customId')
        .populate('members.user', 'name avatar userLevel wealthLevel');
    } else {
      family = await Family.findOne({ 'members.user': currentUserId })
        .populate('owner', 'name avatar customId')
        .populate('members.user', 'name avatar userLevel wealthLevel');
    }

    return res.status(200).json({
      success: true,
      family,
    });
  } catch (err) {
    console.error('Error fetching my family:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch my family' });
  }
};
