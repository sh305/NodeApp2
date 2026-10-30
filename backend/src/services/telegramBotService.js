const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'FunMazaApp_bot';
const TELEGRAM_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

let lastUpdateId = 0;
let isPollingActive = false;
let pollingTimeoutRef = null;
let ioInstance = null;

// In-memory active Telegram Login Sessions map
const telegramLoginSessions = new Map();

function createLoginSession() {
  const sessionId = crypto.randomBytes(16).toString('hex');
  telegramLoginSessions.set(sessionId, {
    status: 'pending',
    createdAt: Date.now(),
  });
  // Auto-expire after 10 minutes
  setTimeout(() => {
    if (telegramLoginSessions.has(sessionId)) {
      telegramLoginSessions.delete(sessionId);
    }
  }, 10 * 60 * 1000);

  return {
    sessionId,
    botUsername: BOT_USERNAME,
    botUrl: `https://t.me/${BOT_USERNAME}?start=login_${sessionId}`,
  };
}

function getLoginSession(sessionId) {
  return telegramLoginSessions.get(sessionId);
}

/**
 * Send a text message to a Telegram chat
 */
async function sendMessage(chatId, text, extraParams = {}) {
  if (!TELEGRAM_API) return null;
  try {
    const res = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...extraParams,
    });
    return res.data;
  } catch (err) {
    console.error('Telegram sendMessage error:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Verify Web Widget data using HMAC-SHA256 hash check
 */
function verifyTelegramWidgetData(authData) {
  if (!BOT_TOKEN) return false;
  const { hash, ...data } = authData;
  if (!hash) return false;

  const dataCheckString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}

/**
 * Handle incoming Telegram command or message
 */
async function handleTelegramMessage(message) {
  if (!message || !message.text) return;
  const chatId = message.chat?.id;
  const from = message.from || {};
  const text = message.text.trim();

  // Handle /start command with bind parameter: e.g. /start bind_65b32...
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const param = parts[1] || '';

    if (param.startsWith('bind_')) {
      const userId = param.replace('bind_', '').trim();
      try {
        const user = await User.findById(userId);
        if (!user) {
          await sendMessage(
            chatId,
            `⚠️ <b>FunMaza Account Not Found</b>\n\nPlease ensure you are logged into FunMaza and open the binding link from the app.`
          );
          return;
        }

        // Check if telegram account is already linked to another user
        const existingTelegram = await User.findOne({
          $or: [
            { telegramId: String(from.id) },
            { 'boundAccounts.telegram.id': String(from.id) },
          ],
          _id: { $ne: user._id },
        });

        if (existingTelegram) {
          await sendMessage(
            chatId,
            `⚠️ <b>Already Bound</b>\n\nThis Telegram account (ID: <code>${from.id}</code>) is already bound to another FunMaza profile.`
          );
          return;
        }

        // Link Telegram account
        if (!user.boundAccounts) user.boundAccounts = {};
        user.telegramId = String(from.id);
        user.boundAccounts.telegram = {
          id: String(from.id),
          username: from.username ? `@${from.username.replace('@', '')}` : '',
          firstName: from.first_name || '',
          lastName: from.last_name || '',
          boundAt: new Date(),
        };

        user.markModified('boundAccounts');
        await user.save();

        const displayName = from.first_name || from.username || 'User';
        await sendMessage(
          chatId,
          `🎉 <b>Account Linked Successfully!</b>\n\n` +
          `Hello <b>${displayName}</b>, your Telegram account has been linked to your FunMaza profile.\n\n` +
          `✅ <b>Telegram:</b> ${from.username ? '@' + from.username : from.first_name}\n` +
          `📱 <b>FunMaza User:</b> ${user.name || 'Member'}\n\n` +
          `You can now return to the FunMaza app.`
        );

        // Notify client via Socket.io if active
        if (ioInstance) {
          ioInstance.emit(`account_bound:${userId}`, {
            provider: 'telegram',
            telegramId: String(from.id),
            username: from.username ? `@${from.username}` : '',
            firstName: from.first_name || '',
          });
        }
      } catch (err) {
        console.error('Error binding via Telegram /start:', err);
        await sendMessage(
          chatId,
          `❌ <i>Something went wrong while linking your account. Please try again.</i>`
        );
      }
      return;
    }

    if (param.startsWith('login_')) {
      const sessionId = param.replace('login_', '').trim();
      try {
        let user = await User.findOne({
          $or: [
            { telegramId: String(from.id) },
            { 'boundAccounts.telegram.id': String(from.id) },
          ],
        });

        if (!user) {
          // If no user found, auto-create a user authenticated via Telegram
          const displayName = from.first_name || from.username || `User_${String(from.id).slice(-4)}`;
          user = await User.create({
            name: displayName,
            telegramId: String(from.id),
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            boundAccounts: {
              telegram: {
                id: String(from.id),
                username: from.username ? `@${from.username.replace('@', '')}` : '',
                firstName: from.first_name || '',
                lastName: from.last_name || '',
                boundAt: new Date(),
              },
            },
          });
        }

        const banCheck = user.checkActiveBan ? user.checkActiveBan() : { banned: false };
        if (banCheck.banned) {
          await sendMessage(chatId, `🚫 <b>Account Suspended:</b> ${banCheck.message}`);
          return;
        }

        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^',
          { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
        );

        telegramLoginSessions.set(sessionId, {
          status: 'success',
          token,
          user,
          updatedAt: Date.now(),
        });

        const welcomeName = from.first_name || from.username || user.name || 'Member';
        const returnUrl = `https://nodeapp2-yl8c.onrender.com/api/auth/telegram-redirect?token=${token}&sessionId=${sessionId}`;
        await sendMessage(
          chatId,
          `🎉 <b>Login Successful!</b>\n\n` +
          `Welcome back, <b>${welcomeName}</b>!\n` +
          `You have successfully authenticated with FunMaza.\n\n` +
          `👇 Tap the button below to return to FunMaza immediately:`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Open FunMaza App Now',
                    url: returnUrl,
                  },
                ],
              ],
            },
          }
        );

        if (ioInstance) {
          ioInstance.emit(`telegram_login_done:${sessionId}`, {
            success: true,
            token,
            user,
          });
        }
      } catch (err) {
        console.error('Error handling Telegram login /start:', err);
        await sendMessage(
          chatId,
          `❌ <i>Something went wrong during Telegram authentication. Please try again.</i>`
        );
      }
      return;
    }

    // Handle plain /start command (auto-login if user is already recognized in FunMaza)
    try {
      let user = await User.findOne({
        $or: [
          { telegramId: String(from.id) },
          { 'boundAccounts.telegram.id': String(from.id) },
        ],
      });

      // Find if there is an active pending session (within last 10 minutes)
      let activeSessionId = null;
      for (const [sId, sess] of telegramLoginSessions.entries()) {
        if (sess.status === 'pending' && Date.now() - sess.createdAt < 10 * 60 * 1000) {
          activeSessionId = sId;
          break;
        }
      }

      if (user) {
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^',
          { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
        );

        if (activeSessionId) {
          telegramLoginSessions.set(activeSessionId, {
            status: 'success',
            token,
            user,
            updatedAt: Date.now(),
          });
          if (ioInstance) {
            ioInstance.emit(`telegram_login_done:${activeSessionId}`, {
              success: true,
              token,
              user,
            });
          }
        }

        const welcomeName = from.first_name || from.username || user.name || 'Member';
        const returnUrl = `https://nodeapp2-yl8c.onrender.com/api/auth/telegram-redirect?token=${token}&sessionId=${activeSessionId || ''}`;
        await sendMessage(
          chatId,
          `🎉 <b>Login Successful!</b>\n\n` +
          `Welcome back, <b>${welcomeName}</b>!\n` +
          `You have successfully authenticated with FunMaza.\n\n` +
          `👇 Tap the button below to return to FunMaza immediately:`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Open FunMaza App Now',
                    url: returnUrl,
                  },
                ],
              ],
            },
          }
        );
        return;
      }
    } catch (err) {
      console.error('Error handling plain /start auto-auth:', err);
    }

    // Default /start greeting for new visitors
    const welcomeName = from.first_name || 'Friend';
    await sendMessage(
      chatId,
      `👋 <b>Welcome to FunMaza Bot, ${welcomeName}!</b>\n\n` +
      `FunMaza is your go-to Live Voice & Games Party App.\n\n` +
      `To link your Telegram account:\n` +
      `1️⃣ Open <b>FunMaza App</b>\n` +
      `2️⃣ Go to <b>Profile</b> > <b>Account Binding</b>\n` +
      `3️⃣ Tap <b>Bind Telegram</b>\n\n` +
      `Have fun chatting and playing! 🎙️✨`
    );
  }
}

/**
 * Long-polling worker loop for Telegram updates
 */
async function pollLoop() {
  if (!isPollingActive || !TELEGRAM_API) return;

  try {
    const res = await axios.get(`${TELEGRAM_API}/getUpdates`, {
      params: {
        offset: lastUpdateId + 1,
        timeout: 10,
        allowed_updates: ['message'],
      },
      timeout: 15000,
    });

    if (res.data?.ok && Array.isArray(res.data.result)) {
      for (const update of res.data.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        if (update.message) {
          await handleTelegramMessage(update.message);
        }
      }
    }
  } catch (err) {
    // Silent catch on network timeout; will retry next tick
    if (err.code !== 'ECONNABORTED' && !err.message?.includes('timeout')) {
      console.warn('Telegram poll loop notice:', err.message);
    }
  }

  if (isPollingActive) {
    pollingTimeoutRef = setTimeout(pollLoop, 1500);
  }
}

/**
 * Start Telegram bot service
 */
function initTelegramBot(io) {
  if (io) ioInstance = io;
  if (!BOT_TOKEN) {
    console.log('ℹ️ Telegram Bot Token not configured, skipping bot polling.');
    return;
  }

  isPollingActive = true;
  console.log(`🤖 FunMaza Telegram Bot initialized (@${BOT_USERNAME})`);
  pollLoop();
}

/**
 * Stop Telegram bot service
 */
function stopTelegramBot() {
  isPollingActive = false;
  if (pollingTimeoutRef) clearTimeout(pollingTimeoutRef);
}

module.exports = {
  initTelegramBot,
  stopTelegramBot,
  handleTelegramMessage,
  sendMessage,
  verifyTelegramWidgetData,
  createLoginSession,
  getLoginSession,
};
