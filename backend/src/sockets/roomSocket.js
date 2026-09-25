const Room = require('../models/Room');
const User = require('../models/User');

function initRoomSockets(io) {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join room
    socket.on('join_room', async ({ roomId, userId }) => {
      try {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;

        const user = await User.findById(userId).select('name avatar wealthLevel activeFrame');
        if (user) {
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

    // Leave Mic Seat
    socket.on('leave_seat', async ({ roomId, userId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        room.seats.forEach((s) => {
          if (s.user && s.user.toString() === userId) {
            s.user = null;
          }
        });

        await room.save();

        const updatedRoom = await Room.findById(roomId)
          .populate('seats.user', 'name avatar wealthLevel activeFrame');

        io.to(roomId).emit('seats_updated', {
          seats: updatedRoom.seats,
        });
      } catch (err) {
        console.error('Socket leave_seat error:', err);
      }
    });

    // Toggle Mic Mute
    socket.on('toggle_mic_mute', async ({ roomId, seatIndex, isMuted }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || !room.seats[seatIndex]) return;

        room.seats[seatIndex].isMuted = isMuted;
        await room.save();

        io.to(roomId).emit('seat_mute_status_changed', {
          seatIndex,
          isMuted,
        });
      } catch (err) {
        console.error('Socket toggle_mic_mute error:', err);
      }
    });

    // Send Live Chat Message
    socket.on('send_chat_message', async ({ roomId, sender, message }) => {
      io.to(roomId).emit('new_chat_message', {
        sender,
        message,
        timestamp: new Date(),
      });
    });

    // Broadcast Gift Animation to Room
    socket.on('broadcast_gift', ({ roomId, giftData }) => {
      io.to(roomId).emit('gift_received_animation', giftData);
    });

    // Realtime Kick Notification (Forces target user out of room)
    socket.on('notify_user_kicked', ({ roomId, targetUserId, kickType, message }) => {
      io.to(roomId).emit('user_kicked_from_room', {
        targetUserId,
        kickType,
        message,
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
            if (changed) {
              await room.save();
              const updatedRoom = await Room.findById(socket.roomId)
                .populate('seats.user', 'name avatar wealthLevel activeFrame');
              io.to(socket.roomId).emit('seats_updated', { seats: updatedRoom.seats });
            }
          }
        } catch (e) {}
      }
    });
  });
}

module.exports = initRoomSockets;
