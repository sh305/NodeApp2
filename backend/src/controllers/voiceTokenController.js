const { RtcTokenBuilder, RtcRole } = require('agora-token');
const Room = require('../models/Room');

// @desc Generate Agora RTC Token for a voice room
// @route POST /api/rooms/:id/voice-token
// @access Private
const getVoiceToken = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({
        success: false,
        message: 'Agora Voice credentials are not configured on the server',
      });
    }

    // Channel name is the unique room ID
    const channelName = String(roomId);

    // Agora numeric UID (positive 32-bit integer)
    let uid = 0;
    if (req.user?.yoyoId && !isNaN(Number(req.user.yoyoId))) {
      uid = Number(req.user.yoyoId) % 2147483647;
    } else if (req.user?._id) {
      uid = parseInt(req.user._id.toString().slice(-6), 16) || Math.floor(Math.random() * 1000000) + 1;
    } else {
      uid = Math.floor(Math.random() * 1000000) + 1;
    }

    // Allow publishing audio when seated
    const role = RtcRole.PUBLISHER;

    // Token validity: 24 hours (86400 seconds)
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return res.status(200).json({
      success: true,
      token,
      appId,
      channelName,
      uid,
    });
  } catch (error) {
    console.error('Error generating Agora Voice Token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate voice token',
      error: error.message,
    });
  }
};

module.exports = { getVoiceToken };
