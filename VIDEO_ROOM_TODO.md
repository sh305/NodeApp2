# 📝 Video Room Playback - Pending Task & Fix Checklist

> **User Reported Issue (27 Oct 2026):**
> *"jab ma video add krta hu to meri video add to ho jati ha lekin play nhi hoti ha"*
> *(Video adds successfully to the playlist/room, but does not play in the video player)*

---

## 📌 Status Overview
- [x] Room loading & crash fixed (`setRoomTitle` ReferenceError resolved in build `61405605`).
- [x] Room Profile Edit modal functional.
- [x] Video Add flow functional (YouTube URL & Phone scans with NSFW filters).
- [ ] **NEXT PRIORITY (Tomorrow): Video Playback Execution & Streaming**.

---

## 🔍 Investigation Checklist for Tomorrow

### 1. `mobile/src/components/RoomVideoPlayer.js` (Video Player Component)
- **YouTube Embed Handling:**
  - YouTube iframe embeds inside React Native WebView on Android often require specific HTML/CSS properties:
    - Origin whitelist: `originWhitelist={['*']}`
    - Dom storage: `domStorageEnabled={true}`
    - Hardware acceleration: `androidHardwareAccelerationDisabled={false}`
    - User agent string: Sometimes Android WebView needs a mobile Safari/Chrome user-agent to allow embedded YouTube iframes to play without "Error occurred, please try again later".
    - YouTube Iframe Player API: Ensure valid parameters (`playsinline=1`, `autoplay=1`, `enablejsapi=1`).
- **Local / Direct MP4 Video Playback:**
  - For phone MP4 uploads, ensure video URI is converted to base64 data URI or accessible via local file server / backend media stream endpoint, as raw Android content URIs (`content://...`) cannot be directly rendered inside WebView.

### 2. Backend & Socket State (`backend/src/controllers/roomController.js`)
- Verify that `addRoomVideo` sets `currentVideo.isPlaying = true` and `currentVideo.url` properly.
- Verify `sync_video_playback` / `room_video_updated` Socket.io events emit the updated video state so all room listeners immediately switch to playing state.

---

## 📁 Key Files Involved
1. `mobile/src/components/RoomVideoPlayer.js` (Video display & WebView player)
2. `mobile/src/components/RoomVideoModal.js` (Add video & playlist modal)
3. `mobile/src/screens/VoiceRoomScreen.js` (Room host screen & player container)
4. `backend/src/controllers/roomController.js` (Backend video add/play endpoints)
5. `backend/src/sockets/roomSocket.js` (Real-time video sync events)
