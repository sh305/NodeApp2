const io = require('./mobile/node_modules/socket.io-client');

const socket = io('http://localhost:5000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  const roomId = '6abb610f0f3daf395cff3e3a';
  
  socket.emit('join_room', { roomId, userId: '6ab75a294514d1f71381a6bc' });
  
  setTimeout(() => {
    console.log('Emitting request_pk_match for roomId:', roomId);
    socket.emit('request_pk_match', {
      roomId,
      roomName: 'Singing Rroom',
      roomAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    });
  }, 1000);
});

socket.on('pk_matching_waiting', (data) => {
  console.log('EVENT pk_matching_waiting:', data);
});

socket.on('pk_battle_started', (data) => {
  console.log('EVENT pk_battle_started SUCCESS:', data);
  process.exit(0);
});

socket.on('pk_error', (data) => {
  console.log('EVENT pk_error:', data);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for response');
  process.exit(1);
}, 6000);
