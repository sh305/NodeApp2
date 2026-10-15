const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get Trending Posts (Only real posts created by registered app users)
// @route   GET /api/posts/trending
exports.getTrendingPosts = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const currentUser = await User.findById(currentUserId).select('following');
    const myFollowingSet = new Set((currentUser?.following || []).map((id) => id.toString()));

    const posts = await Post.find()
      .populate({
        path: 'user',
        select: 'name avatar signature bio customId commentDisabledUsers blockedUsers isOnline currentRoom activeFrame wealthLevel',
        populate: {
          path: 'currentRoom',
          select: '_id title isLocked',
        },
      })
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = posts
      .filter((p) => p.user) // Ensure real registered user exists
      .map((p) => {
        const uId = p.user._id.toString();
        const isLiked = (p.likes || []).some(
          (id) => id && currentUserId && id.toString() === currentUserId.toString()
        );
        const isAuthor = currentUserId && uId === currentUserId.toString();
        const isCommentDisabled =
          !isAuthor &&
          (p.user.commentDisabledUsers || []).some(
            (id) => id && currentUserId && id.toString() === currentUserId.toString()
          );
        const isBlockedByAuthor =
          !isAuthor &&
          (p.user.blockedUsers || []).some(
            (id) => id && currentUserId && id.toString() === currentUserId.toString()
          );
        return {
          _id: p._id.toString(),
          user: {
            _id: p.user._id,
            name: p.user.name,
            avatar: p.user.avatar,
            signature: p.user.signature || p.user.bio || '',
            customId: p.user.customId || '',
            isOnline: Boolean(p.user.isOnline || p.user.currentRoom),
            currentRoom: p.user.currentRoom
              ? {
                  _id: p.user.currentRoom._id,
                  title: p.user.currentRoom.title,
                  isLocked: p.user.currentRoom.isLocked,
                }
              : null,
            activeFrame: p.user.activeFrame || null,
            wealthLevel: p.user.wealthLevel || 1,
          },
          caption: p.caption,
          media: p.media || [],
          likeCount: p.likeCount || 0,
          commentCount: p.commentCount || 0,
          isLiked,
          isFollowing: myFollowingSet.has(uId),
          isCommentDisabled: !!isCommentDisabled,
          isBlockedByAuthor: !!isBlockedByAuthor,
          createdAt: p.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      posts: formatted,
    });
  } catch (err) {
    console.error('Error fetching trending posts:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch trending posts' });
  }
};

// @desc    Get Following Posts (Only posts by users that the current user actually follows)
// @route   GET /api/posts/following
exports.getFollowingPosts = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser?.following || [];

    if (followingIds.length === 0) {
      return res.status(200).json({
        success: true,
        posts: [],
      });
    }

    const posts = await Post.find({ user: { $in: followingIds } })
      .populate({
        path: 'user',
        select: 'name avatar signature bio customId commentDisabledUsers blockedUsers isOnline currentRoom activeFrame wealthLevel',
        populate: {
          path: 'currentRoom',
          select: '_id title isLocked',
        },
      })
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = posts
      .filter((p) => p.user)
      .map((p) => {
        const uId = p.user._id.toString();
        const isLiked = (p.likes || []).some(
          (id) => id && currentUserId && id.toString() === currentUserId.toString()
        );
        const isAuthor = currentUserId && uId === currentUserId.toString();
        const isCommentDisabled =
          !isAuthor &&
          (p.user.commentDisabledUsers || []).some(
            (id) => id && currentUserId && id.toString() === currentUserId.toString()
          );
        const isBlockedByAuthor =
          !isAuthor &&
          (p.user.blockedUsers || []).some(
            (id) => id && currentUserId && id.toString() === currentUserId.toString()
          );
        return {
          _id: p._id.toString(),
          user: {
            _id: p.user._id,
            name: p.user.name,
            avatar: p.user.avatar,
            signature: p.user.signature || p.user.bio || '',
            customId: p.user.customId || '',
            isOnline: Boolean(p.user.isOnline || p.user.currentRoom),
            currentRoom: p.user.currentRoom
              ? {
                  _id: p.user.currentRoom._id,
                  title: p.user.currentRoom.title,
                  isLocked: p.user.currentRoom.isLocked,
                }
              : null,
            activeFrame: p.user.activeFrame || null,
            wealthLevel: p.user.wealthLevel || 1,
          },
          caption: p.caption,
          media: p.media || [],
          likeCount: p.likeCount || 0,
          commentCount: p.commentCount || 0,
          isLiked,
          isFollowing: true,
          isCommentDisabled: !!isCommentDisabled,
          isBlockedByAuthor: !!isBlockedByAuthor,
          createdAt: p.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      posts: formatted,
    });
  } catch (err) {
    console.error('Error fetching following posts:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch following posts' });
  }
};

// @desc    Create a new post
// @route   POST /api/posts/create
exports.createPost = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { caption, media } = req.body;

    if (!caption && (!media || media.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either text caption or media image',
      });
    }

    const mediaArray = [];
    if (Array.isArray(media)) {
      for (const m of media) {
        if (typeof m === 'string') {
          mediaArray.push({ url: m, type: 'image' });
        } else if (m && m.url) {
          mediaArray.push({ url: m.url, type: m.type || 'image' });
        }
      }
    }

    const newPost = await Post.create({
      user: currentUserId,
      caption: caption || '',
      media: mediaArray,
      likeCount: 0,
      commentCount: 0,
      likes: [],
      comments: [],
    });

    const populated = await Post.findById(newPost._id).populate(
      'user',
      'name avatar signature bio customId'
    );

    return res.status(201).json({
      success: true,
      post: {
        _id: populated._id.toString(),
        user: {
          _id: populated.user._id,
          name: populated.user.name,
          avatar: populated.user.avatar,
          signature: populated.user.signature || populated.user.bio || '',
          customId: populated.user.customId || '',
        },
        caption: populated.caption,
        media: populated.media || [],
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isFollowing: false,
        createdAt: populated.createdAt,
      },
      message: 'Post created successfully!',
    });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// @desc    Toggle Like on Post
// @route   POST /api/posts/:id/like
exports.toggleLikePost = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isAlreadyLiked = (post.likes || []).some(
      (uid) => uid.toString() === currentUserId.toString()
    );

    if (isAlreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (uid) => uid.toString() !== currentUserId.toString()
      );
      post.likeCount = Math.max(0, post.likes.length);
      await post.save();

      return res.status(200).json({
        success: true,
        isLiked: false,
        likeCount: post.likeCount,
      });
    } else {
      // Like
      if (!post.likes) post.likes = [];
      post.likes.push(currentUserId);
      post.likeCount = post.likes.length;
      await post.save();

      return res.status(200).json({
        success: true,
        isLiked: true,
        likeCount: post.likeCount,
      });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
exports.getComments = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate({
        path: 'comments.user',
        select: 'name avatar customId',
      })
      .populate({
        path: 'user',
        select: 'commentDisabledUsers',
      });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isAuthor =
      post.user && currentUserId && post.user._id.toString() === currentUserId.toString();
    const isCommentDisabled =
      !isAuthor &&
      post.user &&
      (post.user.commentDisabledUsers || []).some(
        (uid) => uid && currentUserId && uid.toString() === currentUserId.toString()
      );

    const formatted = (post.comments || [])
      .filter((c) => c.user)
      .map((c) => ({
        _id: c._id.toString(),
        text: c.text,
        user: {
          _id: c.user._id,
          name: c.user.name,
          avatar: c.user.avatar,
          customId: c.user.customId || '',
        },
        createdAt: c.createdAt,
      }))
      .reverse();

    return res.status(200).json({
      success: true,
      comments: formatted,
      commentCount: formatted.length,
      isCommentDisabled: !!isCommentDisabled,
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if post author has disabled comments from current user
    if (post.user && post.user.toString() !== currentUserId.toString()) {
      const author = await User.findById(post.user).select('commentDisabledUsers');
      if (
        author &&
        Array.isArray(author.commentDisabledUsers) &&
        author.commentDisabledUsers.some((uid) => uid.toString() === currentUserId.toString())
      ) {
        return res.status(403).json({
          success: false,
          message: 'The author has disabled your ability to comment on their posts.',
        });
      }
    }

    const newComment = {
      user: currentUserId,
      text: text.trim(),
      createdAt: new Date(),
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.commentCount = post.comments.length;
    await post.save();

    const currentUser = await User.findById(currentUserId).select('name avatar customId');

    return res.status(201).json({
      success: true,
      comment: {
        _id: post.comments[post.comments.length - 1]._id.toString(),
        text: newComment.text,
        user: {
          _id: currentUser._id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          customId: currentUser.customId || '',
        },
        createdAt: newComment.createdAt,
      },
      commentCount: post.commentCount,
      message: 'Comment posted successfully',
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};
