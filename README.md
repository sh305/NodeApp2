# 🎙️ YoYo Style Real-Time Voice Chat & Social App Architecture

Ek complete **YoYo-style Live Voice Chatting, Gifting, Room Leveling, Frame Badging, Kick/Block, aur Moderation Reporting** application ka full-stack code ready hai.

---

## 📁 Full Project Folder Structure

```text
e:/NodeApp/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js                 # Online MongoDB Atlas Connection
│       │   └── redis.js              # Redis High-Speed Caching (with memory fallback)
│       ├── controllers/
│       │   ├── authController.js     # Phone OTP, Google & Facebook Login
│       │   ├── roomController.js     # Lock/Unlock, Dynamic Seats, Kick (3d/Perm) & Unkick
│       │   ├── giftController.js     # Virtual Gifting, Coin transactions, Level & EXP
│       │   ├── userController.js     # User Profile, ID Block & Unblock checks
│       │   └── reportController.js   # User ID Reporting (3 Days, 7 Days, Permanent Ban)
│       ├── middlewares/
│       │   ├── authMiddleware.js     # JWT & Ban status enforcement
│       │   └── blockMiddleware.js    # ID Block validation
│       ├── models/
│       │   ├── User.js               # Auth, Levels, Frames, Ban & Block states
│       │   ├── Room.js               # Dynamic Seats, Password Hash, Kick list
│       │   ├── Gift.js               # Gifts Catalog with Coin & EXP rates
│       │   ├── Report.js             # Reports with 3d / 7d / Permanent penalties
│       │   └── Transaction.js        # Gifting transaction history
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── roomRoutes.js
│       │   ├── userRoutes.js
│       │   ├── reportRoutes.js
│       │   └── giftRoutes.js
│       ├── services/
│       │   └── levelService.js       # Dynamic Seat Scaling & Frame Formula engine
│       ├── sockets/
│       │   └── roomSocket.js         # Real-time Voice Seats, Live Chat, Gifts & WebRTC Signaling
│       └── server.js                 # Express + HTTP + Socket.io Server Entry
│
└── mobile/
    ├── package.json
    ├── App.js                        # Navigation Stack & Global Auth State
    └── src/
        ├── api/
        │   └── client.js             # Axios Client with JWT Token Interceptors
        ├── components/
        │   ├── AvatarWithFrame.js    # Dynamic Glowing Level Frame for Avatars
        │   ├── RoomSeatGrid.js       # Dynamic Seat Grid (8, 12, 16, 20... Seats)
        │   ├── GiftBottomSheet.js   # Interactive Gift Tray & Coin Balance
        │   ├── RoomLockModal.js      # PIN / Password entry for Locked Rooms
        │   ├── KickModal.js          # 3 Days vs Permanent Kick Selection Dialog
        │   └── ReportModal.js        # 3 Days, 7 Days, Permanent Ban Report Dialog
        └── screens/
            ├── AuthScreen.js         # Mobile OTP, Google & Facebook Login Tabs
            ├── HomeScreen.js         # Live Rooms with Level Frames, Lock status & Creator
            ├── VoiceRoomScreen.js    # Full Live Voice Room with Mic Seats, Chat & Gifting
            └── UserProfileScreen.js  # Profile view with Block/Unblock & Level frames
```

---

## ⚙️ Core Logic & Formulas Implemented

### 1. 💺 Automatic Room Seat Scaling Formula
- Initial Room Seats: **8 Seats** (Level 1 - 11)
- Level 12 par: **+4 Seats = 12 Seats**
- Level 24 par: **+4 Seats = 16 Seats**
- Level 36 par: **+4 Seats = 20 Seats**
- **Formula (`levelService.js`):**
  $$\text{Total Seats} = 8 + \left(\lfloor \text{RoomLevel} / 12 \rfloor \times 4\right)$$

### 2. 🔒 Room Lock & Unlock
- Room owner room ko lock kar sakta hai **Password/PIN** daal kar (`bcrypt` hashed).
- Bina sahi password enter kiye koi bhi unauthorized user room me enter nahi kar sakta.

### 3. 🎖️ Room Frames & User Avatar Frames
- **Room Level Frames**: Bronze Spark (Lv. 1-11), Silver Glow (Lv. 12-23), Golden Royale (Lv. 24-35), Diamond Monarch (Lv. 36-47), Dragon Master (Lv. 48+).
- **User Wealth Frames**: Starter Frame (Lv. 1-5), Ruby Neon Ring (Lv. 6-15), Royal Sapphire Crown (Lv. 16-30), Imperial Emerald (Lv. 31-50), Supreme Phoenix (Lv. 51+).

### 4. 👢 Room Kick System (3 Days vs Permanent)
- **3 Days Kick**: User 3 din tak us specific room me enter nahi kar sakta (`expiresAt = Date.now() + 3 days`). 3 din baad automatic unkick ho jata hai.
- **Permanent Kick**: Jab tak room owner unhe kick list se remove (`unkickUser`) nahi karega, tab tak wo room me enter nahi kar sakta.

### 5. 🚩 Report & Ban System (3 Days, 7 Days, Permanent)
- **3 Days Ban**: Account temporarily suspend hota hai 3 dino ke liye.
- **7 Days Ban**: Account suspend hota hai 7 dino ke liye.
- **Permanent Ban**: Account permanent blacklist ho jata hai (`isBanned: true, banType: 'permanent'`). Wo user dubara app par login nahi kar sakta.

### 6. 🚷 User-to-User ID Block & Unblock
- Agar User A ne User B ko block kiya:
  - User B User A ki profile visit nahi kar sakta (`403 Forbidden`).
  - Jab tak User A use unblock nahi karega tab tak access restricted rahega.

---

## 🚀 How to Run Backend

1. **Backend folder me jayein**:
   ```bash
   cd e:/NodeApp/backend
   npm install
   ```
2. **MongoDB Atlas URI set karein**:
   `.env.example` ko copy karke `.env` banayein aur apna online MongoDB Atlas connection string dalein:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/yoyo_app?retryWrites=true&w=majority
   ```
3. **Server Start karein**:
   ```bash
   npm run dev
   ```

---

## 📱 How to Run Mobile App (React Native / Expo)

1. **Mobile folder me jayein**:
   ```bash
   cd e:/NodeApp/mobile
   npm install
   ```
2. **Backend IP update karein** ([client.js](file:///e:/NodeApp/mobile/src/api/client.js)):
   Apna computer ka local IP (jaise `http://192.168.1.5:5000`) set karein.
3. **App launch karein**:
   ```bash
   npx expo start
   ```
