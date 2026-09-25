/**
 * Leveling & Frame Service for YoYo Style App
 * Handles:
 * 1. Room Seat Scaling (Base 8 seats, +4 seats every 12 levels)
 * 2. Room Levels and Dynamic Room Frames
 * 3. User Wealth & Charm Levels and Avatar Frames
 */

// Room Frames Catalog based on Level
const ROOM_FRAMES = [
  { minLevel: 1, maxLevel: 11, id: 'room_frame_bronze', name: 'Bronze Spark Frame', frameUrl: 'https://cdn.example.com/frames/room_bronze.png' },
  { minLevel: 12, maxLevel: 23, id: 'room_frame_silver', name: 'Silver Glow Frame (12 Seats)', frameUrl: 'https://cdn.example.com/frames/room_silver.png' },
  { minLevel: 24, maxLevel: 35, id: 'room_frame_gold', name: 'Golden Royale Frame (16 Seats)', frameUrl: 'https://cdn.example.com/frames/room_gold.png' },
  { minLevel: 36, maxLevel: 47, id: 'room_frame_diamond', name: 'Diamond Monarch Frame (20 Seats)', frameUrl: 'https://cdn.example.com/frames/room_diamond.png' },
  { minLevel: 48, maxLevel: 999, id: 'room_frame_legend', name: 'Dragon Master Frame (24+ Seats)', frameUrl: 'https://cdn.example.com/frames/room_dragon.png' },
];

// User Avatar Frames Catalog based on Wealth Level
const USER_FRAMES = [
  { minLevel: 1, maxLevel: 5, id: 'user_frame_lv1', name: 'Novice Glow', frameUrl: 'https://cdn.example.com/frames/user_novice.png' },
  { minLevel: 6, maxLevel: 15, id: 'user_frame_lv6', name: 'Ruby Neon Ring', frameUrl: 'https://cdn.example.com/frames/user_ruby.png' },
  { minLevel: 16, maxLevel: 30, id: 'user_frame_lv16', name: 'Royal Sapphire Crown', frameUrl: 'https://cdn.example.com/frames/user_sapphire.png' },
  { minLevel: 31, maxLevel: 50, id: 'user_frame_lv31', name: 'Imperial Emerald Wings', frameUrl: 'https://cdn.example.com/frames/user_emerald.png' },
  { minLevel: 51, maxLevel: 999, id: 'user_frame_lv51', name: 'Supreme Phoenix Avatar Frame', frameUrl: 'https://cdn.example.com/frames/user_phoenix.png' },
];

/**
 * Calculates total seats for a given room level.
 * Level < 12 -> 8 seats
 * Level 12 -> 12 seats (+4)
 * Level 24 -> 16 seats (+4)
 * Level 36 -> 20 seats (+4)
 */
function calculateRoomSeats(roomLevel) {
  const level = Math.max(1, parseInt(roomLevel, 10) || 1);
  const baseSeats = 8;
  const multiplier = Math.floor(level / 12);
  return baseSeats + multiplier * 4;
}

/**
 * Calculate EXP needed for the next room level
 */
function getRoomExpForNextLevel(currentLevel) {
  return currentLevel * 500; // e.g., Level 1 -> 500 exp, Level 12 -> 6000 exp
}

/**
 * Calculate EXP needed for the next user wealth level
 */
function getUserExpForNextLevel(currentLevel) {
  return currentLevel * 300;
}

/**
 * Get Room Frame by room level
 */
function getRoomFrameByLevel(roomLevel) {
  const frame = ROOM_FRAMES.find(
    (f) => roomLevel >= f.minLevel && roomLevel <= f.maxLevel
  );
  return frame || ROOM_FRAMES[0];
}

/**
 * Get User Frame by user level
 */
function getUserFrameByLevel(userLevel) {
  const frame = USER_FRAMES.find(
    (f) => userLevel >= f.minLevel && userLevel <= f.maxLevel
  );
  return frame || USER_FRAMES[0];
}

/**
 * Process room EXP gain and auto-level up and expand seats
 */
function addRoomExp(room, expToAdd) {
  room.roomExp += expToAdd;
  let expRequired = getRoomExpForNextLevel(room.roomLevel);

  let leveledUp = false;
  while (room.roomExp >= expRequired) {
    room.roomExp -= expRequired;
    room.roomLevel += 1;
    expRequired = getRoomExpForNextLevel(room.roomLevel);
    leveledUp = true;
  }

  if (leveledUp) {
    // Update frame
    const newFrame = getRoomFrameByLevel(room.roomLevel);
    room.roomFrame = {
      id: newFrame.id,
      name: newFrame.name,
      frameUrl: newFrame.frameUrl,
    };

    // Expand seats if level crossed a multiple of 12
    const totalRequiredSeats = calculateRoomSeats(room.roomLevel);
    if (room.seats.length < totalRequiredSeats) {
      for (let i = room.seats.length; i < totalRequiredSeats; i++) {
        room.seats.push({
          seatIndex: i,
          user: null,
          isMuted: false,
          isLockedByOwner: false,
        });
      }
    }
  }

  return { leveledUp, newLevel: room.roomLevel, currentSeats: room.seats.length };
}

/**
 * Process user wealth EXP gain and auto-level up user frame
 */
function addUserWealthExp(user, expToAdd) {
  user.wealthExp += expToAdd;
  let expRequired = getUserExpForNextLevel(user.wealthLevel);

  let leveledUp = false;
  while (user.wealthExp >= expRequired) {
    user.wealthExp -= expRequired;
    user.wealthLevel += 1;
    expRequired = getUserExpForNextLevel(user.wealthLevel);
    leveledUp = true;
  }

  if (leveledUp) {
    const newFrame = getUserFrameByLevel(user.wealthLevel);
    user.activeFrame = {
      id: newFrame.id,
      name: newFrame.name,
      frameUrl: newFrame.frameUrl,
    };
  }

  return { leveledUp, newLevel: user.wealthLevel };
}

module.exports = {
  calculateRoomSeats,
  getRoomExpForNextLevel,
  getUserExpForNextLevel,
  getRoomFrameByLevel,
  getUserFrameByLevel,
  addRoomExp,
  addUserWealthExp,
  ROOM_FRAMES,
  USER_FRAMES,
};
