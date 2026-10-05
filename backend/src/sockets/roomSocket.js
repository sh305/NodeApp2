const Room = require('../models/Room');
const User = require('../models/User');

// Active Real-time Game Lobbies in RAM
const gameLobbies = new Map(); // roomCode -> { roomCode, gameName, bet, maxPlayers, hostId, players: [...] }
const activeGameMatches = new Map(); // roomCode -> { roomCode, gameName, bet, totalPot, players: [...], activePlayersCount }

function getActiveLobbiesList() {
  const list = [];
  gameLobbies.forEach((lobby) => {
    list.push({
      roomCode: lobby.roomCode,
      gameName: lobby.gameName,
      bet: lobby.bet,
      maxPlayers: lobby.maxPlayers,
      currentPlayers: lobby.players.length,
      hostName: lobby.players[0]?.name || 'Player',
      hostAvatar: lobby.players[0]?.avatar,
    });
  });
  return list;
}

function initRoomSockets(io) {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join room
    socket.on('join_room', async ({ roomId, userId }) => {
      try {
        if (!roomId || !userId) return;

        const room = await Room.findById(roomId);
        if (!room) return;

        // Check if user is kicked from room
        const kickStatus = room.isUserKicked(userId);
        if (kickStatus.kicked) {
          socket.emit('user_kicked_from_room', {
            targetUserId: userId,
            kickType: kickStatus.kickType,
            message: kickStatus.message || 'You have been kicked out of this room.',
          });
          return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;

        const user = await User.findById(userId).select('name avatar wealthLevel activeFrame customId gender');
        if (user) {
          // Add user to room's activeMembers if not present
          const alreadyIn = room.activeMembers.some(
            (m) => (m._id ? m._id.toString() : m.toString()) === userId.toString()
          );
          if (!alreadyIn) {
            room.activeMembers.push(userId);
            await room.save();
          }
          const updatedRoom = await Room.findById(roomId)
            .populate('activeMembers', 'name avatar wealthLevel activeFrame customId gender');
          io.to(roomId).emit('active_members_updated', {
            activeMembers: updatedRoom?.activeMembers || [],
          });

          // Broadcast to everyone in room that user joined
          io.to(roomId).emit('user_joined_room', {
            user,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error('Socket join_room error:', err);
      }
    });

    // Explicit leave room
    socket.on('leave_room', async ({ roomId, userId } = {}) => {
      try {
        const targetRoomId = roomId || socket.roomId;
        const targetUserId = userId || socket.userId;
        if (targetRoomId && targetUserId) {
          socket.leave(targetRoomId);
          const room = await Room.findById(targetRoomId);
          if (room) {
            let changed = false;
            room.seats.forEach((s) => {
              if (s.user && s.user.toString() === targetUserId.toString()) {
                s.user = null;
                changed = true;
              }
            });
            const beforeLen = room.activeMembers.length;
            room.activeMembers = room.activeMembers.filter(
              (m) => (m._id ? m._id.toString() : m.toString()) !== targetUserId.toString()
            );
            if (room.activeMembers.length !== beforeLen) {
              changed = true;
            }
            let bossSeatChanged = false;
            if (room.bossSeat && room.bossSeat.user && (room.bossSeat.user._id ? room.bossSeat.user._id.toString() : room.bossSeat.user.toString()) === targetUserId.toString()) {
              room.bossSeat.user = null;
              bossSeatChanged = true;
              changed = true;
            }
            if (changed) {
              await room.save();
              const updatedRoom = await Room.findById(targetRoomId)
                .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender')
                .populate('activeMembers', 'name avatar wealthLevel activeFrame customId gender')
                .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender');
              io.to(targetRoomId).emit('seats_updated', { seats: updatedRoom.seats });
              io.to(targetRoomId).emit('active_members_updated', { activeMembers: updatedRoom.activeMembers });
              if (bossSeatChanged) {
                io.to(targetRoomId).emit('boss_seat_updated', { bossSeat: updatedRoom.bossSeat });
              }
            }
          }
        }
      } catch (e) {
        console.error('Socket leave_room error:', e);
      }
    });

    // Take a Mic Seat
    socket.on('take_seat', async ({ roomId, seatIndex, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // Check if user is kicked
        const kickStatus = room.isUserKicked(userId);
        if (kickStatus.kicked) {
          return socket.emit('error_message', { message: kickStatus.message });
        }

        room.syncSeats();

        if (seatIndex < 0 || seatIndex >= room.seats.length) {
          return socket.emit('error_message', { message: 'Invalid seat index' });
        }

        // Check if seat already taken
        const targetSeat = room.seats[seatIndex];
        if (targetSeat.user && targetSeat.user.toString() !== userId) {
          return socket.emit('error_message', { message: 'Seat already occupied' });
        }

        const isOwner = room.owner && room.owner.toString() === userId.toString();
        const isAdmin = room.admins && room.admins.some((aId) => aId.toString() === userId.toString());
        if (isOwner && room.isHostActive) {
          room.isHostActive = false;
          io.to(roomId).emit('host_status_updated', { isHostActive: false });
        }

        // When Free Mode is OFF, only owner and admin can directly take seat. Audience must apply.
        if (room.freeMode === false && !isOwner && !isAdmin) {
          return socket.emit('error_message', {
            message: 'Free Mode is OFF. Please apply to take a mic seat.',
          });
        }

        // Remove user from any other seat in same room
        room.seats.forEach((s) => {
          if (s.user && s.user.toString() === userId) {
            s.user = null;
          }
        });

        // Assign to seat
        room.seats[seatIndex].user = userId;
        await room.save();

        const updatedRoom = await Room.findById(roomId)
          .populate('seats.user', 'name avatar wealthLevel activeFrame');

        io.to(roomId).emit('seats_updated', {
          seats: updatedRoom.seats,
          seatIndex,
          userId,
        });
      } catch (err) {
        console.error('Socket take_seat error:', err);
      }
    });

    // Leave Mic Seat / Remove from Seat (Admin Rights table: Owner, Admin, Host)
    socket.on('leave_seat', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const requesterId = (socket.userId || userId)?.toString();
        const targetUserId = userId?.toString();
        const ownerId = room.owner?.toString();
        const isOwner = ownerId && requesterId === ownerId;
        const isAdmin = room.admins && room.admins.some((aId) => aId.toString() === requesterId);
        const isHost = room.isHostActive && (isOwner || (room.hosts && room.hosts.some((hId) => hId.toString() === requesterId)));
        const isSelf = requesterId === targetUserId;

        // If removing someone else: only Owner, Admin, or Host can remove (Table: Kick off the seat)
        if (!isSelf && !isOwner && !isAdmin && !isHost) {
          return socket.emit('error_message', {
            message: 'You do not have permission to remove users from seat',
          });
        }

        // Room Owner can NEVER be removed from seat by anyone else
        if (!isSelf && targetUserId === ownerId) {
          return socket.emit('error_message', {
            message: 'Cannot remove Room Owner from seat',
          });
        }

        room.seats.forEach((s) => {
          if (s.user && s.user.toString() === targetUserId) {
            s.user = null;
          }
        });

        await room.save();

        const updatedRoom = await Room.findById(roomId)
          .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender');

        io.to(roomId).emit('seats_updated', {
          seats: updatedRoom.seats,
        });
      } catch (err) {
        console.error('Socket leave_seat error:', err);
      }
    });

    // Toggle Free Mode
    socket.on('toggle_free_mode', async ({ roomId, freeMode }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        room.freeMode = Boolean(freeMode);
        await room.save();
        io.to(roomId).emit('free_mode_updated', { freeMode: room.freeMode });
        io.to(roomId).emit('new_chat_message', {
          system: true,
          text: room.freeMode ? '📢 Free Mode was turned ON' : '📢 Free Mode was turned OFF (Application required)',
        });
      } catch (err) {
        console.error('Socket toggle_free_mode error:', err);
      }
    });

    // Toggle Room Lock & 4-Digit Password
    socket.on('toggle_room_lock', async ({ roomId, isLocked, password }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        if (isLocked) {
          if (password && String(password).trim().length === 4) {
            const salt = await bcrypt.genSalt(10);
            room.passwordHash = await bcrypt.hash(String(password).trim(), salt);
            room.isLocked = true;
          }
        } else {
          room.isLocked = false;
          room.passwordHash = null;
        }
        await room.save();
        io.to(roomId).emit('room_lock_updated', { isLocked: room.isLocked });
        io.to(roomId).emit('new_chat_message', {
          system: true,
          text: room.isLocked ? '🔒 Room is now password protected' : '🔓 Room is now unlocked',
        });
      } catch (err) {
        console.error('Socket toggle_room_lock error:', err);
      }
    });

    // Update Seat Layout & Special Theme
    socket.on('update_seat_layout', async ({ roomId, seatLayout, seats }) => {
      try {
        io.to(roomId).emit('seat_layout_updated', {
          seatLayout,
          seats,
        });
        io.to(roomId).emit('new_chat_message', {
          system: true,
          text: seatLayout.type === 'special'
            ? `✨ Room seat layout switched to Special Theme: ${seatLayout.specialTheme}`
            : `🛋️ Room seat layout updated to ${seatLayout.seatCount + 2} Seats`,
        });
      } catch (err) {
        console.error('Socket update_seat_layout error:', err);
      }
    });

    // Apply for Seat (when Free Mode is OFF)
    socket.on('apply_for_seat', async ({ roomId, userId, seatIndex }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        if (!room.seatApplicants) room.seatApplicants = [];
        if (!room.seatApplicants.some((id) => id.toString() === userId.toString())) {
          room.seatApplicants.push(userId);
          await room.save();
        }
        const updatedRoom = await Room.findById(roomId)
          .populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');
        io.to(roomId).emit('seat_applicants_updated', {
          seatApplicants: updatedRoom.seatApplicants,
        });
        const applicant = await User.findById(userId);
        if (applicant) {
          io.to(roomId).emit('new_chat_message', {
            system: true,
            text: `📢 ${applicant.name} applied for a mic seat!`,
          });
        }
      } catch (err) {
        console.error('Socket apply_for_seat error:', err);
      }
    });

    // Accept Seat Applicant
    socket.on('accept_seat_applicant', async ({ roomId, applicantId, seatIndex }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        room.syncSeats();
        let targetIndex = seatIndex !== undefined && seatIndex !== null ? Number(seatIndex) : -1;
        if (targetIndex < 0 || targetIndex >= room.seats.length || room.seats[targetIndex]?.user) {
          targetIndex = room.seats.findIndex((s) => !s.user);
        }
        if (targetIndex !== -1) {
          room.seats[targetIndex].user = applicantId;
        }
        if (room.seatApplicants) {
          room.seatApplicants = room.seatApplicants.filter((id) => id.toString() !== applicantId.toString());
        }
        await room.save();
        const updatedRoom = await Room.findById(roomId)
          .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender')
          .populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');
        io.to(roomId).emit('seats_updated', { seats: updatedRoom.seats });
        io.to(roomId).emit('seat_applicants_updated', { seatApplicants: updatedRoom.seatApplicants });
      } catch (err) {
        console.error('Socket accept_seat_applicant error:', err);
      }
    });

    // Reject Seat Applicant
    socket.on('reject_seat_applicant', async ({ roomId, applicantId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        if (room.seatApplicants) {
          room.seatApplicants = room.seatApplicants.filter((id) => id.toString() !== applicantId.toString());
          await room.save();
        }
        const updatedRoom = await Room.findById(roomId)
          .populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');
        io.to(roomId).emit('seat_applicants_updated', { seatApplicants: updatedRoom.seatApplicants });
      } catch (err) {
        console.error('Socket reject_seat_applicant error:', err);
      }
    });

    // Invite User to Seat
    socket.on('invite_to_seat', async ({ roomId, targetUserId, seatIndex }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        room.syncSeats();
        let targetIndex = seatIndex !== undefined && seatIndex !== null ? Number(seatIndex) : -1;
        if (targetIndex < 0 || targetIndex >= room.seats.length || room.seats[targetIndex]?.user) {
          targetIndex = room.seats.findIndex((s) => !s.user);
        }
        if (targetIndex !== -1) {
          room.seats[targetIndex].user = targetUserId;
        }
        if (room.seatApplicants) {
          room.seatApplicants = room.seatApplicants.filter((id) => id.toString() !== targetUserId.toString());
        }
        await room.save();
        const updatedRoom = await Room.findById(roomId)
          .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender')
          .populate('seatApplicants', 'name avatar wealthLevel activeFrame customId gender');
        io.to(roomId).emit('seats_updated', { seats: updatedRoom.seats });
        io.to(roomId).emit('seat_applicants_updated', { seatApplicants: updatedRoom.seatApplicants });
      } catch (err) {
        console.error('Socket invite_to_seat error:', err);
      }
    });

    // Take Boss Seat
    socket.on('take_boss_seat', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // Check if user is kicked
        const kickStatus = room.isUserKicked(userId);
        if (kickStatus.kicked) {
          return socket.emit('error_message', { message: kickStatus.message });
        }

        if (!room.bossSeat || !room.bossSeat.isActive || (room.bossSeat.expiresAt && new Date() > room.bossSeat.expiresAt)) {
          return socket.emit('error_message', { message: 'Boss Seat is not active in this room' });
        }

        if (room.bossSeat.user && room.bossSeat.user.toString() !== userId.toString()) {
          return socket.emit('error_message', { message: 'Boss Seat is already occupied' });
        }

        // Cannot take Boss seat if active on Host seat
        const isOwner = room.owner && room.owner.toString() === userId.toString();
        if (isOwner && room.isHostActive) {
          return socket.emit('error_message', {
            message: 'You are currently on the Host seat. Please step down from Host seat first.',
          });
        }

        // Remove from regular mic seats if sitting on one
        let seatChanged = false;
        room.seats.forEach((s) => {
          if (s.user && s.user.toString() === userId.toString()) {
            s.user = null;
            seatChanged = true;
          }
        });

        room.bossSeat.user = userId;
        await room.save();

        const updatedRoom = await Room.findById(roomId)
          .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender')
          .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender');

        io.to(roomId).emit('boss_seat_updated', { bossSeat: updatedRoom.bossSeat });
        if (seatChanged) {
          io.to(roomId).emit('seats_updated', { seats: updatedRoom.seats });
        }
      } catch (err) {
        console.error('Socket take_boss_seat error:', err);
      }
    });

    // Leave Boss Seat
    socket.on('leave_boss_seat', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || !room.bossSeat) return;

        if (room.bossSeat.user && room.bossSeat.user.toString() === userId.toString()) {
          room.bossSeat.user = null;
          await room.save();
        }

        const updatedRoom = await Room.findById(roomId)
          .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender');

        io.to(roomId).emit('boss_seat_updated', { bossSeat: updatedRoom.bossSeat });
      } catch (err) {
        console.error('Socket leave_boss_seat error:', err);
      }
    });

    // Broadcast Boss Seat Purchased / Activated
    socket.on('notify_boss_seat_purchased', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId)
          .populate('bossSeat.user', 'name avatar wealthLevel activeFrame customId gender')
          .populate('bossSeat.purchasedBy', 'name avatar');
        if (room && room.bossSeat) {
          io.to(roomId).emit('boss_seat_updated', { bossSeat: room.bossSeat });
        }
      } catch (e) {
        console.error('Socket notify_boss_seat_purchased error:', e);
      }
    });

    // Leave Host Seat (Step down from Hosting)
    socket.on('leave_host', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const requesterId = (socket.userId || userId)?.toString();
        const ownerId = room.owner?.toString();
        const isAdmin = room.admins && room.admins.some((aId) => aId.toString() === requesterId);
        const isOwner = ownerId && requesterId === ownerId;
        const isSelf = requesterId === userId?.toString();

        // Authority check: Only Self, Room Owner, or Admin can perform leave_host
        if (!isSelf && !isOwner && !isAdmin) {
          return socket.emit('error_message', {
            message: 'Only Room Owner or Admin can remove someone from Hosting',
          });
        }

        // Admin CANNOT remove Room Owner from Hosting
        if (isAdmin && !isOwner && userId?.toString() === ownerId) {
          return socket.emit('error_message', {
            message: 'Cannot remove Room Owner from Hosting',
          });
        }

        room.isHostActive = false;
        await room.save();

        io.to(roomId).emit('host_status_updated', {
          isHostActive: false,
          userId,
        });
      } catch (err) {
        console.error('Socket leave_host error:', err);
      }
    });

    // Take Host Seat
    socket.on('take_host', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // Condition 1: Only the room owner can take Host seat
        if (room.owner.toString() !== userId.toString()) {
          return socket.emit('error_message', {
            message: 'Only the room owner can take the Host seat',
          });
        }

        // Condition 2: If the user is currently sitting on any mic seat, vacate that seat!
        let seatRemoved = false;
        room.seats.forEach((s) => {
          if (s.user && s.user.toString() === userId.toString()) {
            s.user = null;
            seatRemoved = true;
          }
        });

        room.isHostActive = true;
        await room.save();

        if (seatRemoved) {
          const updatedRoom = await Room.findById(roomId)
            .populate('seats.user', 'name avatar wealthLevel activeFrame');
          io.to(roomId).emit('seats_updated', {
            seats: updatedRoom.seats,
          });
        }

        io.to(roomId).emit('host_status_updated', {
          isHostActive: true,
          userId,
        });
      } catch (err) {
        console.error('Socket take_host error:', err);
      }
    });

    // Toggle Mic Mute (Self Only)
    socket.on('toggle_mic_mute', async ({ roomId, seatIndex, isMuted, isHost, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // Case 1: Host toggling their own mic
        if (isHost || (room.owner && room.owner.toString() === userId?.toString() && seatIndex === undefined)) {
          if (room.owner && room.owner.toString() !== userId?.toString()) {
            return socket.emit('error_message', { message: 'You can only toggle your own microphone' });
          }

          room.isHostMuted = isMuted;
          await room.save();
          io.to(roomId).emit('host_mute_status_changed', {
            isHostMuted: isMuted,
          });
          return;
        }

        // Case 2: Seat user toggling their own seat mic
        if (seatIndex !== undefined && room.seats[seatIndex]) {
          const targetSeat = room.seats[seatIndex];
          if (targetSeat.user && targetSeat.user.toString() !== userId?.toString()) {
            return socket.emit('error_message', { message: 'You can only toggle your own microphone' });
          }

          targetSeat.isMuted = isMuted;
          await room.save();

          io.to(roomId).emit('seat_mute_status_changed', {
            seatIndex,
            isMuted,
          });
        }
      } catch (err) {
        console.error('Socket toggle_mic_mute error:', err);
      }
    });

    // Send Live Chat Message
    socket.on('send_chat_message', async ({ roomId, sender, message, imageUrl }) => {
      io.to(roomId).emit('new_chat_message', {
        sender,
        message,
        imageUrl,
        timestamp: new Date(),
      });
    });

    // Broadcast Gift Animation to Room
    socket.on('broadcast_gift', ({ roomId, giftData }) => {
      io.to(roomId).emit('gift_received_animation', giftData);
    });

    // Real-time Voice Room Animated Emoji Reaction
    socket.on('send_room_emoji', ({ roomId, userId, userName, userAvatar, seatIndex, isHost, emoji, emojiData }) => {
      io.to(roomId).emit('room_emoji_received', {
        userId,
        userName,
        userAvatar,
        seatIndex,
        isHost,
        emoji,
        emojiData,
        timestamp: Date.now(),
      });
    });

    // Realtime Kick Notification (Forces target user out of room)
    socket.on('notify_user_kicked', ({ roomId, targetUserId, kickType, message }) => {
      io.to(roomId).emit('user_kicked_from_room', {
        targetUserId,
        kickType,
        message,
      });
    });

    // Realtime Unkick Notification
    socket.on('notify_user_unkicked', ({ roomId, targetUserId }) => {
      io.to(roomId).emit('user_unkicked_from_room', {
        targetUserId,
      });
    });

    // WebRTC Audio Signaling (Mesh / SFU signaling)
    socket.on('webrtc_signal', ({ roomId, targetSocketId, signalData }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_signal_received', {
          senderSocketId: socket.id,
          signalData,
        });
      } else {
        socket.to(roomId).emit('webrtc_signal_received', {
          senderSocketId: socket.id,
          signalData,
        });
      }
    });

    // ================= REAL-TIME REGISTERED USERS GAME LOBBY =================
    socket.on('find_or_create_game_lobby', async ({ gameId, gameMode, bet, maxPlayers, userId }, callback) => {
      try {
        const realUser = await User.findById(userId).select('name avatar gameCoins');
        if (!realUser) {
          const err = { message: 'Only registered users can join games.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const requiredBet = Number(bet) || 100;
        if ((realUser.gameCoins || 0) < requiredBet) {
          const err = { message: `Insufficient Game Coins! ${requiredBet} coins required to join this match.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // 1. Look for existing open lobby waiting for players
        let targetLobby = null;
        for (const [code, lobby] of gameLobbies.entries()) {
          const isSameGame = String(lobby.gameName || 'Ludo').toLowerCase() === String(gameId || 'Ludo').toLowerCase();
          const isSameMode = String(lobby.gameMode || 'classic').toLowerCase() === String(gameMode || 'classic').toLowerCase();
          const isSameBet = Number(lobby.bet) === Number(bet || 100);
          const isSamePlayers = Number(lobby.maxPlayers) === Number(maxPlayers || 2);
          const hasSpace = lobby.players.length < lobby.maxPlayers;
          const userAlreadyIn = lobby.players.some((p) => p.userId === realUser._id.toString());

          if (isSameGame && isSameMode && isSameBet && isSamePlayers && hasSpace && !userAlreadyIn) {
            targetLobby = lobby;
            break;
          }
        }

        // 2. If open lobby found, join this registered user into next slot
        if (targetLobby) {
          const nextSlot = targetLobby.players.length + 1;
          const colors = [
            { color: '#DC2626', colorKey: 'red' },
            { color: '#10B981', colorKey: 'green' },
            { color: '#F59E0B', colorKey: 'yellow' },
            { color: '#2563EB', colorKey: 'blue' },
          ];
          const assignedColor = colors[nextSlot - 1] || colors[1];

          targetLobby.players.push({
            userId: realUser._id.toString(),
            name: realUser.name,
            avatar: realUser.avatar,
            color: assignedColor.color,
            colorKey: assignedColor.colorKey,
            slot: nextSlot,
            isHost: false,
            status: 'ready',
          });

          const roomChannel = `game_lobby_${targetLobby.roomCode}`;
          socket.join(roomChannel);
          socket.gameLobbyCode = targetLobby.roomCode;
          socket.userId = userId;

          if (callback) callback({ lobby: targetLobby, isHost: false });
          io.to(roomChannel).emit('game_lobby_updated', targetLobby);
          io.emit('active_game_lobbies_changed', getActiveLobbiesList());
          return;
        }

        // 3. Otherwise, create a new lobby with this user as Host in Slot 1
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const roomChannel = `game_lobby_${code}`;
        socket.join(roomChannel);
        socket.gameLobbyCode = code;
        socket.userId = userId;

        const newLobby = {
          roomCode: code,
          gameName: gameId || 'Ludo',
          gameMode: gameMode || 'classic',
          bet: bet || 100,
          maxPlayers: maxPlayers || 2,
          hostId: userId,
          players: [
            {
              userId: realUser._id.toString(),
              name: realUser.name,
              avatar: realUser.avatar,
              color: '#DC2626',
              colorKey: 'red',
              slot: 1,
              isHost: true,
              status: 'ready',
            },
          ],
        };

        gameLobbies.set(code, newLobby);
        if (callback) callback({ lobby: newLobby, isHost: true });
        io.to(roomChannel).emit('game_lobby_updated', newLobby);
        io.emit('active_game_lobbies_changed', getActiveLobbiesList());
      } catch (err) {
        console.error('Error find_or_create_game_lobby:', err);
        if (callback) callback({ error: 'Server error in matchmaking' });
      }
    });

    socket.on('verify_and_enter_game_code', async (data, callback) => {
      try {
        const cleanCode = String(data?.roomCode || data?.gameCode || '').trim();
        const userId = data?.userId;
        console.log(`🔍 [Socket] Verifying game code: "${cleanCode}" for user: ${userId}. Active lobbies:`, Array.from(gameLobbies.keys()));

        const lobby = gameLobbies.get(cleanCode);
        if (!lobby) {
          console.log(`❌ [Socket] Game code "${cleanCode}" not found in:`, Array.from(gameLobbies.keys()));
          const err = { message: 'Invalid Game Code! Room not found.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // 1. Strict Game Name Check (case-insensitive & trimmed)
        const hostGame = String(lobby.gameName || 'Ludo').toLowerCase().trim();
        const expectedGame = String(data?.expectedGameName || '').toLowerCase().trim();
        if (expectedGame && hostGame !== expectedGame) {
          const err = { message: `This Game Code is for ${lobby.gameName}! Please join from ${lobby.gameName}.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // 2. Strict Game Mode Check (Classic vs Turbo) - Always normalize
        const hostMode = String(lobby.gameMode || 'classic').toLowerCase().trim();
        const expectedMode = String(data?.expectedGameMode || 'classic').toLowerCase().trim();
        if (hostMode !== expectedMode) {
          const hostModeName = hostMode === 'turbo' ? 'Turbo' : 'Classic';
          const err = { message: `This Game Code is for ${hostModeName} mode! Please join from ${hostModeName}.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        let realUser = null;
        if (userId) {
          realUser = await User.findById(userId).select('name avatar gameCoins');
        }
        if (!realUser) {
          const err = { message: 'Only registered users can join games.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const requiredBet = Number(lobby.bet) || 100;
        if ((realUser.gameCoins || 0) < requiredBet) {
          const err = { message: `Insufficient Game Coins! ${requiredBet} coins required to join this match.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // Strict duplicate check: Same user cannot join twice!
        const isHost = String(lobby.hostId) === String(realUser._id);
        const isAlreadyIn = lobby.players.some((p) => String(p.userId) === String(realUser._id));
        if (isHost || isAlreadyIn) {
          const err = { message: 'You already created or joined this lobby! Same user cannot join twice.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        if (lobby.players.length >= lobby.maxPlayers) {
          const err = { message: 'This Game Room is already full!' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // Auto-assign player to next available slot (Slot 2, 3, etc.)
        const colors = [
          { color: '#DC2626', colorKey: 'red' },
          { color: '#10B981', colorKey: 'green' },
          { color: '#F59E0B', colorKey: 'yellow' },
          { color: '#2563EB', colorKey: 'blue' },
        ];
        let assignedSlot = null;
        for (let s = 2; s <= lobby.maxPlayers; s++) {
          if (!lobby.players.some((p) => p.slot === s)) {
            assignedSlot = s;
            break;
          }
        }

        if (assignedSlot) {
          const assignedColor = colors[assignedSlot - 1] || colors[1];
          lobby.players.push({
            userId: realUser._id.toString(),
            name: realUser.name,
            avatar: realUser.avatar,
            color: assignedColor.color,
            colorKey: assignedColor.colorKey,
            slot: assignedSlot,
            isHost: false,
            status: 'ready',
          });
        }

        // Connect user socket to this lobby channel
        const roomChannel = `game_lobby_${cleanCode}`;
        socket.join(roomChannel);
        socket.gameLobbyCode = cleanCode;
        socket.userId = userId;

        console.log(`✅ [Socket] User ${realUser.name} (${realUser._id}) verified and joined slot ${assignedSlot} in lobby "${cleanCode}"`);
        if (callback) callback({ success: true, lobby });

        // Broadcast to everyone in lobby that slot is claimed and user entered
        io.to(roomChannel).emit('game_lobby_updated', lobby);
        io.to(roomChannel).emit('player_entered_lobby', {
          roomCode: cleanCode,
          userId: realUser._id.toString(),
          name: realUser.name,
          avatar: realUser.avatar,
          slot: assignedSlot,
        });
        io.emit('active_game_lobbies_changed', getActiveLobbiesList());
      } catch (err) {
        console.error('Error verify_and_enter_game_code:', err);
        if (callback) callback({ error: 'Server error verifying game code' });
      }
    });

    socket.on('claim_lobby_slot', async (data, callback) => {
      try {
        const cleanCode = String(data?.roomCode || data?.gameCode || '').trim();
        const slotNum = Number(data?.slotNum);
        const userId = data?.userId;
        console.log(`🎯 [Socket] Claim slot ${slotNum} in lobby "${cleanCode}" for user: ${userId}`);

        const lobby = gameLobbies.get(cleanCode);
        if (!lobby) {
          const err = { message: 'Game Room Code not found.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        let realUser = null;
        if (userId) {
          realUser = await User.findById(userId).select('name avatar gameCoins');
        }
        if (!realUser) {
          const err = { message: 'Only registered users can join this game.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const requiredBet = Number(lobby.bet) || 100;
        if ((realUser.gameCoins || 0) < requiredBet) {
          const err = { message: `Insufficient Game Coins! ${requiredBet} coins required to join this match.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // Strict duplicate check: Same user cannot claim multiple slots!
        const alreadyIn = lobby.players.some((p) => String(p.userId) === String(realUser._id));
        if (alreadyIn) {
          const err = { message: 'You are already joined in this room! Same user cannot join twice.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // Check if slotNum is already taken
        const slotTaken = lobby.players.some((p) => p.slot === slotNum);
        if (slotTaken) {
          const err = { message: 'This slot is already taken!' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const colors = [
          { color: '#DC2626', colorKey: 'red' },
          { color: '#10B981', colorKey: 'green' },
          { color: '#F59E0B', colorKey: 'yellow' },
          { color: '#2563EB', colorKey: 'blue' },
        ];
        const assignedColor = colors[slotNum - 1] || colors[1];

        lobby.players.push({
          userId: realUser._id.toString(),
          name: realUser.name,
          avatar: realUser.avatar,
          color: assignedColor.color,
          colorKey: assignedColor.colorKey,
          slot: slotNum,
          isHost: false,
          status: 'ready',
        });

        const roomChannel = `game_lobby_${cleanCode}`;
        socket.join(roomChannel);
        socket.gameLobbyCode = cleanCode;
        socket.userId = userId;

        console.log(`✅ [Socket] Slot ${slotNum} claimed by ${realUser.name} in lobby "${cleanCode}". Total ready: ${lobby.players.length}`);
        if (callback) callback({ success: true, lobby });
        io.to(roomChannel).emit('game_lobby_updated', lobby);
        io.emit('active_game_lobbies_changed', getActiveLobbiesList());
      } catch (err) {
        console.error('Error claim_lobby_slot:', err);
        if (callback) callback({ error: 'Server error claiming slot' });
      }
    });

    socket.on('create_game_lobby', async (data, callback) => {
      try {
        const userId = data?.userId;
        const code = String(data?.roomCode || data?.gameCode || Math.floor(1000 + Math.random() * 9000)).trim();
        console.log(`✨ [Socket] Creating game lobby: "${code}" for user: ${userId}`);

        let realUser = null;
        if (userId) {
          realUser = await User.findById(userId).select('name avatar gameCoins');
        }
        if (!realUser) {
          console.warn(`⚠️ [Socket] User ${userId} not found in DB for create_game_lobby`);
          const err = { message: 'Only registered users can create a game room.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const requiredBet = Number(data?.bet) || 100;
        if ((realUser.gameCoins || 0) < requiredBet) {
          const err = { message: `Insufficient Game Coins! ${requiredBet} coins required to create this match.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const roomChannel = `game_lobby_${code}`;
        socket.join(roomChannel);
        socket.gameLobbyCode = code;
        socket.userId = userId;

        const lobby = {
          roomCode: code,
          gameName: data?.gameName || 'Ludo',
          gameMode: data?.gameMode || 'classic',
          bet: requiredBet,
          maxPlayers: data?.maxPlayers || 2,
          hostId: realUser._id.toString(),
          players: [
            {
              userId: realUser._id.toString(),
              name: realUser.name,
              avatar: realUser.avatar,
              color: '#DC2626',
              colorKey: 'red',
              slot: 1,
              isHost: true,
              status: 'ready',
            },
          ],
        };

        gameLobbies.set(code, lobby);
        console.log(`🎉 [Socket] Lobby "${code}" successfully stored! Total active lobbies: ${gameLobbies.size}`);
        if (callback) callback({ success: true, lobby });
        io.to(roomChannel).emit('game_lobby_updated', lobby);
        io.emit('active_game_lobbies_changed', getActiveLobbiesList());
      } catch (err) {
        console.error('Error create_game_lobby:', err);
        if (callback) callback({ error: 'Server error creating lobby' });
      }
    });

    socket.on('join_game_lobby', async ({ roomCode, userId }, callback) => {
      try {
        const lobby = gameLobbies.get(roomCode);
        if (!lobby) {
          const err = { message: 'Game Room Code not found.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const realUser = await User.findById(userId).select('name avatar gameCoins');
        if (!realUser) {
          const err = { message: 'Only registered users can join this game.' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const requiredBet = Number(lobby.bet) || 100;
        if ((realUser.gameCoins || 0) < requiredBet) {
          const err = { message: `Insufficient Game Coins! ${requiredBet} coins required to join this match.` };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        // If already in lobby
        const alreadyIn = lobby.players.find((p) => p.userId === realUser._id.toString());
        if (alreadyIn) {
          socket.join(`game_lobby_${roomCode}`);
          socket.gameLobbyCode = roomCode;
          if (callback) callback({ lobby });
          return socket.emit('game_lobby_updated', lobby);
        }

        if (lobby.players.length >= lobby.maxPlayers) {
          const err = { message: 'Game Room is already full!' };
          if (callback) callback({ error: err.message });
          return socket.emit('game_lobby_error', err);
        }

        const nextSlot = lobby.players.length + 1;
        const colors = [
          { color: '#DC2626', colorKey: 'red' },
          { color: '#10B981', colorKey: 'green' },
          { color: '#F59E0B', colorKey: 'yellow' },
          { color: '#2563EB', colorKey: 'blue' },
        ];
        const assignedColor = colors[nextSlot - 1] || colors[1];

        lobby.players.push({
          userId: realUser._id.toString(),
          name: realUser.name,
          avatar: realUser.avatar,
          color: assignedColor.color,
          colorKey: assignedColor.colorKey,
          slot: nextSlot,
          isHost: false,
          status: 'ready',
        });

        const roomChannel = `game_lobby_${roomCode}`;
        socket.join(roomChannel);
        socket.gameLobbyCode = roomCode;
        socket.userId = userId;

        if (callback) callback({ success: true, lobby });
        io.to(roomChannel).emit('game_lobby_updated', lobby);
        io.emit('active_game_lobbies_changed', getActiveLobbiesList());
      } catch (err) {
        console.error('Error join_game_lobby:', err);
        if (callback) callback({ error: 'Server error joining lobby' });
      }
    });

    socket.on('leave_game_lobby', async ({ roomCode, userId }) => {
      const lobby = gameLobbies.get(roomCode);
      if (lobby) {
        const leavingUserId = String(userId || '');
        const isHostLeaving = String(lobby.hostId) === leavingUserId;

        if (isHostLeaving) {
          gameLobbies.delete(roomCode);
          io.to(`game_lobby_${roomCode}`).emit('game_lobby_disbanded', {
            message: 'Host left the game room.',
          });
        } else {
          lobby.players = lobby.players.filter((p) => String(p.userId) !== leavingUserId);
          socket.leave(`game_lobby_${roomCode}`);
          io.to(`game_lobby_${roomCode}`).emit('game_lobby_updated', lobby);
          io.to(`game_lobby_${roomCode}`).emit('player_left_lobby', {
            roomCode,
            userId,
          });
        }
        io.emit('active_game_lobbies_changed', getActiveLobbiesList());
      }
    });

    socket.on('start_game_match', async ({ roomCode, userId }) => {
      const cleanCode = String(roomCode || '').trim();
      const lobby = gameLobbies.get(cleanCode);
      if (!lobby) {
        return socket.emit('game_lobby_error', { message: 'Game room not found.' });
      }

      if (String(lobby.hostId) !== String(userId)) {
        return socket.emit('game_lobby_error', {
          message: 'Only the lobby host can start the match!',
        });
      }

      if (lobby.players.length < 2) {
        return socket.emit('game_lobby_error', {
          message: 'At least 2 registered players required to start.',
        });
      }

      const betAmt = Number(lobby.bet) || 100;
      const totalPot = betAmt * lobby.players.length;

      // Verify all players have sufficient game coins right before starting
      for (const p of lobby.players) {
        if (p.userId) {
          const userDoc = await User.findById(p.userId).select('name gameCoins');
          if (!userDoc || (userDoc.gameCoins || 0) < betAmt) {
            const err = {
              message: `${p.name || 'A player'} has insufficient Game Coins (${userDoc?.gameCoins || 0}/${betAmt}) to start!`,
            };
            return io.to(`game_lobby_${cleanCode}`).emit('game_lobby_error', err);
          }
        }
      }

      // Deduct bet coins from all participating players in MongoDB upon match start
      for (const p of lobby.players) {
        if (p.userId) {
          try {
            await User.findByIdAndUpdate(
              p.userId,
              { $inc: { gameCoins: -betAmt } },
              { new: true }
            );
            console.log(`💸 [Match Start] Deducted ${betAmt} game coins from ${p.name} (${p.userId})`);
          } catch (e) {
            console.error(`Error deducting bet for user ${p.userId}:`, e);
          }
        }
      }

      // Register active match in RAM to track players and total pot
      const activeMatch = {
        roomCode: cleanCode,
        gameName: lobby.gameName || 'Ludo',
        bet: betAmt,
        totalPot: totalPot,
        players: lobby.players.map((p) => ({
          userId: String(p.userId),
          name: p.name,
          avatar: p.avatar,
          slot: p.slot,
          color: p.color,
          colorKey: p.colorKey,
          status: p.status || 'ready',
          isHost: p.isHost,
          hasQuit: false,
        })),
        activePlayersCount: lobby.players.length,
      };
      activeGameMatches.set(cleanCode, activeMatch);

      const roomChannel = `game_lobby_${cleanCode}`;
      console.log(`🚀 [Socket] Host ${userId} launched match for room: "${cleanCode}". Total pot: ${totalPot} coins. Players:`, lobby.players.map((p) => `${p.name} (Slot ${p.slot} / ${p.colorKey})`));
      io.to(roomChannel).emit('game_match_started', {
        roomCode: cleanCode,
        gameName: lobby.gameName,
        gameMode: lobby.gameMode || 'classic',
        bet: betAmt,
        totalPot: totalPot,
        playersCount: lobby.players.length,
        players: lobby.players,
      });
      gameLobbies.delete(cleanCode);
      io.emit('active_game_lobbies_changed', getActiveLobbiesList());
    });

    // Multiplayer Ludo In-Game Event Relays
    socket.on('ludo_dice_rolled', ({ roomCode, player, diceValue }) => {
      const cleanCode = String(roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('ludo_dice_rolled', { player, diceValue });
    });

    socket.on('ludo_token_moved', ({ roomCode, player, tokenId, diceValue }) => {
      const cleanCode = String(roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('ludo_token_moved', { player, tokenId, diceValue });
    });

    socket.on('ludo_turn_passed', ({ roomCode, nextPlayer }) => {
      const cleanCode = String(roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('ludo_turn_passed', { nextPlayer });
    });

    // Multiplayer Snake & Ladder In-Game Event Relays
    socket.on('snake_dice_rolled', ({ roomCode, player, diceValue }) => {
      const cleanCode = String(roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('snake_dice_rolled', { player, diceValue });
    });

    socket.on('snake_token_moved', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('snake_token_moved', data);
    });

    socket.on('snake_turn_passed', ({ roomCode, nextPlayer }) => {
      const cleanCode = String(roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('snake_turn_passed', { nextPlayer });
    });

    // Multiplayer Tic Tac Toe In-Game Event Relays
    socket.on('tictactoe_move_made', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('tictactoe_move_made', data);
    });

    socket.on('tictactoe_turn_passed', ({ roomCode, nextPlayer }) => {
      const cleanCode = String(roomCode || '').trim();
      socket.to(`game_lobby_${cleanCode}`).emit('tictactoe_turn_passed', { nextPlayer });
    });

    socket.on('tictactoe_match_draw', async ({ roomCode }) => {
      try {
        const cleanCode = String(roomCode || '').trim();
        const match = activeGameMatches.get(cleanCode);
        if (!match) return;

        console.log(`🤝 [Match] Tic Tac Toe Draw in room "${cleanCode}". Refunding ${match.bet} coins to each player.`);
        for (const p of match.players) {
          if (p.userId) {
            try {
              await User.findByIdAndUpdate(p.userId, { $inc: { gameCoins: match.bet } });
            } catch (e) {
              console.error('Error refunding draw coins:', e);
            }
          }
        }

        const roomChannel = `game_lobby_${cleanCode}`;
        io.to(roomChannel).emit('game_match_draw', {
          roomCode: cleanCode,
          message: 'Match ended in a Draw! Bets refunded.',
          bet: match.bet,
        });

        activeGameMatches.delete(cleanCode);
      } catch (err) {
        console.error('Error tictactoe_match_draw:', err);
      }
    });

    // Multiplayer Carrom In-Game Event Relays
    socket.on('carrom_join_room', ({ roomCode }) => {
      const cleanCode = String(roomCode || '').trim();
      if (cleanCode) {
        socket.join(`game_lobby_${cleanCode}`);
        console.log(`🎯 [Carrom Socket] Socket ${socket.id} joined room game_lobby_${cleanCode}`);
      }
    });

    socket.on('carrom_aim_update', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('carrom_aim_update', data);
    });

    socket.on('carrom_strike_fired', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`💥 [Carrom Socket] Strike fired in room ${cleanCode} from slot ${data?.fromSlot}, angle: ${data?.angle}`);
      socket.to(`game_lobby_${cleanCode}`).emit('carrom_strike_fired', data);
    });

    socket.on('carrom_puck_pocketed', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('carrom_puck_pocketed', data);
    });

    socket.on('carrom_turn_passed', ({ roomCode, nextPlayer }) => {
      const cleanCode = String(roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`🔄 [Carrom Socket] Turn passed in room ${cleanCode} -> nextPlayer: ${nextPlayer}`);
      socket.to(`game_lobby_${cleanCode}`).emit('carrom_turn_passed', { nextPlayer });
    });

    socket.on('carrom_extra_turn', ({ roomCode, slot }) => {
      const cleanCode = String(roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`🌟 [Carrom Socket] Extra turn in room ${cleanCode} for slot ${slot}`);
      socket.to(`game_lobby_${cleanCode}`).emit('carrom_extra_turn', { slot });
    });

    socket.on('carrom_sync_board', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('carrom_sync_board', data);
    });

    // Multiplayer Dice Battle In-Game Event Relays
    socket.on('dice_battle_join', ({ roomCode }) => {
      const cleanCode = String(roomCode || '').trim();
      if (cleanCode) {
        socket.join(`game_lobby_${cleanCode}`);
        console.log(`🎲 [Dice Battle] Socket ${socket.id} joined room game_lobby_${cleanCode}`);
      }
    });

    socket.on('dice_battle_roll', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`🎲 [Dice Battle] Roll in room ${cleanCode} from slot ${data?.fromSlot}, values:`, data?.diceValues);
      socket.to(`game_lobby_${cleanCode}`).emit('dice_battle_roll', data);
    });

    socket.on('dice_battle_turn_passed', ({ roomCode, nextSlot }) => {
      const cleanCode = String(roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`🎲 [Dice Battle] Turn passed in room ${cleanCode} -> nextSlot: ${nextSlot}`);
      socket.to(`game_lobby_${cleanCode}`).emit('dice_battle_turn_passed', { nextSlot });
    });

    socket.on('dice_battle_sync_round', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('dice_battle_sync_round', data);
    });

    // Multiplayer Card Clash In-Game Event Relays
    socket.on('card_clash_join', ({ roomCode }) => {
      const cleanCode = String(roomCode || '').trim();
      if (cleanCode) {
        socket.join(`game_lobby_${cleanCode}`);
        console.log(`🃏 [Card Clash] Socket ${socket.id} joined room game_lobby_${cleanCode}`);
      }
    });

    socket.on('card_clash_reveal', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`🃏 [Card Clash] Reveal in room ${cleanCode} from slot ${data?.fromSlot}, card:`, data?.card);
      socket.to(`game_lobby_${cleanCode}`).emit('card_clash_reveal', data);
    });

    socket.on('card_clash_turn_passed', ({ roomCode, nextSlot }) => {
      const cleanCode = String(roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      console.log(`🃏 [Card Clash] Turn passed in room ${cleanCode} -> nextSlot: ${nextSlot}`);
      socket.to(`game_lobby_${cleanCode}`).emit('card_clash_turn_passed', { nextSlot });
    });

    socket.on('card_clash_sync_round', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('card_clash_sync_round', data);
    });

    // ── TIME BOMB PASS GAME ────────────────────────────────────────
    socket.on('time_bomb_join', ({ roomCode }) => {
      const cleanCode = String(roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
    });

    socket.on('time_bomb_pass', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('time_bomb_passed', data);
    });

    socket.on('time_bomb_exploded', (data) => {
      const cleanCode = String(data?.roomCode || '').trim();
      if (!cleanCode) return;
      socket.join(`game_lobby_${cleanCode}`);
      socket.to(`game_lobby_${cleanCode}`).emit('time_bomb_exploded', data);
    });

    // Handle mid-match quit / forfeit
    socket.on('player_quit_match', async ({ roomCode, userId }) => {
      try {
        const cleanCode = String(roomCode || '').trim();
        const match = activeGameMatches.get(cleanCode);
        if (!match) return;

        const quitter = match.players.find((p) => String(p.userId) === String(userId));
        if (!quitter || quitter.hasQuit) return;

        quitter.hasQuit = true;
        match.activePlayersCount = Math.max(0, match.activePlayersCount - 1);
        const roomChannel = `game_lobby_${cleanCode}`;

        console.log(`👋 [Match] Player ${quitter.name} (${userId}) quit match in room "${cleanCode}". Remaining active: ${match.activePlayersCount}`);

        // If only 1 player remains, that last player WINS THE ENTIRE POT!
        if (match.activePlayersCount === 1) {
          const winner = match.players.find((p) => !p.hasQuit);
          if (winner) {
            console.log(`🏆 [Match] Last remaining player ${winner.name} (${winner.userId}) wins entire pot of ${match.totalPot} coins!`);

            // Automatically add entire pot to winner in MongoDB
            try {
              const winUser = await User.findById(winner.userId);
              if (winUser) {
                winUser.gameCoins = (winUser.gameCoins || 0) + match.totalPot;
                await winUser.save();
                console.log(`💰 [Match] Added ${match.totalPot} coins to ${winUser.name}. New balance: ${winUser.gameCoins}`);
              }
            } catch (dbErr) {
              console.error('Error awarding win coins to last player:', dbErr);
            }

            io.to(roomChannel).emit('game_match_ended_by_forfeit', {
              roomCode: cleanCode,
              winner: {
                userId: winner.userId,
                name: winner.name,
                avatar: winner.avatar,
              },
              quitter: {
                userId: quitter.userId,
                name: quitter.name,
              },
              totalPot: match.totalPot,
              bet: match.bet,
              reason: 'opponent_quit',
            });
          }
          activeGameMatches.delete(cleanCode);
        } else if (match.activePlayersCount > 1) {
          // More than 1 player still playing (> 2 players total)
          io.to(roomChannel).emit('player_forfeited_mid_game', {
            roomCode: cleanCode,
            quitter: {
              userId: quitter.userId,
              name: quitter.name,
            },
            remainingPlayersCount: match.activePlayersCount,
            totalPot: match.totalPot,
          });
        }
      } catch (err) {
        console.error('Error player_quit_match:', err);
      }
    });

    // Handle normal match win (tokens finished)
    socket.on('player_won_match', async ({ roomCode, userId }) => {
      try {
        const cleanCode = String(roomCode || '').trim();
        const match = activeGameMatches.get(cleanCode);
        if (!match) return;

        const winner = match.players.find((p) => String(p.userId) === String(userId));
        if (!winner) return;

        console.log(`🏆 [Match] Player ${winner.name} won match in room "${cleanCode}". Total pot: ${match.totalPot}`);

        // Automatically add entire pot to winner in MongoDB
        try {
          const winUser = await User.findById(winner.userId);
          if (winUser) {
            winUser.gameCoins = (winUser.gameCoins || 0) + match.totalPot;
            await winUser.save();
            console.log(`💰 [Match] Added ${match.totalPot} coins to ${winUser.name}. New balance: ${winUser.gameCoins}`);
          }
        } catch (dbErr) {
          console.error('Error awarding win coins in DB:', dbErr);
        }

        const roomChannel = `game_lobby_${cleanCode}`;
        io.to(roomChannel).emit('game_match_finished', {
          roomCode: cleanCode,
          winner: {
            userId: winner.userId,
            name: winner.name,
            avatar: winner.avatar,
          },
          totalPot: match.totalPot,
          bet: match.bet,
        });

        activeGameMatches.delete(cleanCode);
      } catch (err) {
        console.error('Error player_won_match:', err);
      }
    });

    socket.on('get_active_game_lobbies', () => {
      socket.emit('active_game_lobbies_list', getActiveLobbiesList());
    });

    socket.on('get_lobby_preview', ({ code }, callback) => {
      const cleanCode = String(code || '').trim();
      const lobby = gameLobbies.get(cleanCode);
      if (lobby) {
        if (callback) {
          callback({
            found: true,
            roomCode: lobby.roomCode,
            gameName: lobby.gameName,
            gameMode: lobby.gameMode || 'classic',
            bet: Number(lobby.bet) || 100,
            maxPlayers: lobby.maxPlayers,
            currentPlayers: lobby.players.length,
            hostName: lobby.players[0]?.name || 'Player 1',
            hostAvatar: lobby.players[0]?.avatar,
          });
        }
      } else {
        if (callback) callback({ found: false });
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      if (socket.roomId && socket.userId) {
        try {
          const room = await Room.findById(socket.roomId);
          if (room) {
            let changed = false;
            room.seats.forEach((s) => {
              if (s.user && s.user.toString() === socket.userId) {
                s.user = null;
                changed = true;
              }
            });
            // Also remove from activeMembers
            const beforeLen = room.activeMembers.length;
            room.activeMembers = room.activeMembers.filter(
              (m) => (m._id ? m._id.toString() : m.toString()) !== socket.userId.toString()
            );
            if (room.activeMembers.length !== beforeLen) {
              changed = true;
            }

            if (changed) {
              await room.save();
              const updatedRoom = await Room.findById(socket.roomId)
                .populate('seats.user', 'name avatar wealthLevel activeFrame customId gender')
                .populate('activeMembers', 'name avatar wealthLevel activeFrame customId gender');
              io.to(socket.roomId).emit('seats_updated', { seats: updatedRoom.seats });
              io.to(socket.roomId).emit('active_members_updated', { activeMembers: updatedRoom.activeMembers });
            }
          }
        } catch (e) {}
      }

      if (socket.gameLobbyCode && socket.userId) {
        const cleanCode = socket.gameLobbyCode;

        // 1. If currently in an active ongoing match, treat disconnect as forfeit
        const match = activeGameMatches.get(cleanCode);
        if (match) {
          const quitter = match.players.find((p) => String(p.userId) === String(socket.userId));
          if (quitter && !quitter.hasQuit) {
            quitter.hasQuit = true;
            match.activePlayersCount = Math.max(0, match.activePlayersCount - 1);
            const roomChannel = `game_lobby_${cleanCode}`;
            console.log(`🔌 [Match Disconnect] Player ${quitter.name} (${socket.userId}) disconnected in "${cleanCode}". Remaining active: ${match.activePlayersCount}`);

            if (match.activePlayersCount === 1) {
              const winner = match.players.find((p) => !p.hasQuit);
              if (winner) {
                // Award total pot to the last remaining player in DB
                User.findById(winner.userId).then((winUser) => {
                  if (winUser) {
                    winUser.gameCoins = (winUser.gameCoins || 0) + match.totalPot;
                    return winUser.save();
                  }
                }).catch((e) => console.error('Error awarding win coins on disconnect:', e));

                io.to(roomChannel).emit('game_match_ended_by_forfeit', {
                  roomCode: cleanCode,
                  winner: {
                    userId: winner.userId,
                    name: winner.name,
                    avatar: winner.avatar,
                  },
                  quitter: {
                    userId: quitter.userId,
                    name: quitter.name,
                  },
                  totalPot: match.totalPot,
                  reason: 'opponent_quit',
                });
              }
              activeGameMatches.delete(cleanCode);
            } else if (match.activePlayersCount > 1) {
              io.to(roomChannel).emit('player_forfeited_mid_game', {
                roomCode: cleanCode,
                quitter: {
                  userId: quitter.userId,
                  name: quitter.name,
                },
                remainingPlayersCount: match.activePlayersCount,
                totalPot: match.totalPot,
              });
            }
          }
        }

        // 2. If in pre-game lobby, handle leave/disband
        const lobby = gameLobbies.get(socket.gameLobbyCode);
        if (lobby) {
          const disUserId = String(socket.userId || '');
          const isHostLeaving = String(lobby.hostId) === disUserId;

          if (isHostLeaving) {
            gameLobbies.delete(socket.gameLobbyCode);
            io.to(`game_lobby_${socket.gameLobbyCode}`).emit('game_lobby_disbanded', {
              message: 'Host left the game room.',
            });
          } else {
            lobby.players = lobby.players.filter((p) => String(p.userId) !== disUserId);
            io.to(`game_lobby_${socket.gameLobbyCode}`).emit('game_lobby_updated', lobby);
            io.to(`game_lobby_${socket.gameLobbyCode}`).emit('player_left_lobby', {
              roomCode: socket.gameLobbyCode,
              userId: socket.userId,
            });
          }
          io.emit('active_game_lobbies_changed', getActiveLobbiesList());
        }
      }
    });
  });
}

module.exports = initRoomSockets;
