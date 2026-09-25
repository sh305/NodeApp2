require('dotenv').config(); // Live environment configured
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const initRoomSockets = require('./sockets/roomSocket');

// Route files
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const giftRoutes = require('./routes/giftRoutes');
const translationRoutes = require('./routes/translationRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/translations', translationRoutes);

// Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'YoYo Voice Backend Engine is running smoothly 🚀',
    timestamp: new Date(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('YoYo Real-Time Voice Social API Service');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Initialize real-time room socket handlers
initRoomSockets(io);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas and start server
if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('<username>')) {
  connectDB();
} else {
  console.log('ℹ️ Notice: Please update MONGO_URI in your .env file with your online MongoDB Atlas connection string.');
}

server.listen(PORT, () => {
  console.log(`🚀 YoYo Voice Backend Server running on port ${PORT}`);
});
