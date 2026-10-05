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

// User Avatar Frames Catalog (Default fallback)
const USER_FRAMES = [
  { minLevel: 1, maxLevel: 5, id: 'user_frame_lv1', name: 'Novice Glow', frameUrl: 'https://cdn.example.com/frames/user_novice.png' },
  { minLevel: 6, maxLevel: 15, id: 'user_frame_lv6', name: 'Ruby Neon Ring', frameUrl: 'https://cdn.example.com/frames/user_ruby.png' },
  { minLevel: 16, maxLevel: 30, id: 'user_frame_lv16', name: 'Royal Sapphire Crown', frameUrl: 'https://cdn.example.com/frames/user_sapphire.png' },
  { minLevel: 31, maxLevel: 50, id: 'user_frame_lv31', name: 'Imperial Emerald Wings', frameUrl: 'https://cdn.example.com/frames/user_emerald.png' },
  { minLevel: 51, maxLevel: 999, id: 'user_frame_lv51', name: 'Supreme Phoenix Avatar Frame', frameUrl: 'https://cdn.example.com/frames/user_phoenix.png' },
];

// Official 100-Level Cumulative Progression Table
const USER_LEVEL_PROGRESSION_TABLE = [
  { level: 1, exp: 1000 },
  { level: 2, exp: 1200 },
  { level: 3, exp: 1500 },
  { level: 4, exp: 1900 },
  { level: 5, exp: 2400 },
  { level: 6, exp: 3000 },
  { level: 7, exp: 3700 },
  { level: 8, exp: 4500 },
  { level: 9, exp: 5400 },
  { level: 10, exp: 6500 },
  { level: 11, exp: 7700 },
  { level: 12, exp: 9000 },
  { level: 13, exp: 10500 },
  { level: 14, exp: 12200 },
  { level: 15, exp: 14000 },
  { level: 16, exp: 16000 },
  { level: 17, exp: 18200 },
  { level: 18, exp: 20600 },
  { level: 19, exp: 23200 },
  { level: 20, exp: 26000 },
  { level: 21, exp: 29100 },
  { level: 22, exp: 32400 },
  { level: 23, exp: 36000 },
  { level: 24, exp: 39800 },
  { level: 25, exp: 44000 },
  { level: 26, exp: 48500 },
  { level: 27, exp: 53300 },
  { level: 28, exp: 58400 },
  { level: 29, exp: 63800 },
  { level: 30, exp: 69600 },
  { level: 31, exp: 75800 },
  { level: 32, exp: 82400 },
  { level: 33, exp: 89400 },
  { level: 34, exp: 96800 },
  { level: 35, exp: 104700 },
  { level: 36, exp: 113000 },
  { level: 37, exp: 121800 },
  { level: 38, exp: 131100 },
  { level: 39, exp: 140900 },
  { level: 40, exp: 151200 },
  { level: 41, exp: 162100 },
  { level: 42, exp: 173500 },
  { level: 43, exp: 185500 },
  { level: 44, exp: 198100 },
  { level: 45, exp: 211300 },
  { level: 46, exp: 225100 },
  { level: 47, exp: 239500 },
  { level: 48, exp: 254600 },
  { level: 49, exp: 270300 },
  { level: 50, exp: 286700 },
  { level: 51, exp: 303800 },
  { level: 52, exp: 321600 },
  { level: 53, exp: 340100 },
  { level: 54, exp: 359300 },
  { level: 55, exp: 379300 },
  { level: 56, exp: 400000 },
  { level: 57, exp: 421500 },
  { level: 58, exp: 443800 },
  { level: 59, exp: 466900 },
  { level: 60, exp: 490800 },
  { level: 61, exp: 515600 },
  { level: 62, exp: 541200 },
  { level: 63, exp: 567700 },
  { level: 64, exp: 595100 },
  { level: 65, exp: 623400 },
  { level: 66, exp: 652600 },
  { level: 67, exp: 682700 },
  { level: 68, exp: 713800 },
  { level: 69, exp: 745800 },
  { level: 70, exp: 778800 },
  { level: 71, exp: 812800 },
  { level: 72, exp: 847800 },
  { level: 73, exp: 883800 },
  { level: 74, exp: 920800 },
  { level: 75, exp: 958900 },
  { level: 76, exp: 998000 },
  { level: 77, exp: 1038200 },
  { level: 78, exp: 1079500 },
  { level: 79, exp: 1121900 },
  { level: 80, exp: 1165400 },
  { level: 81, exp: 1210000 },
  { level: 82, exp: 1255800 },
  { level: 83, exp: 1302700 },
  { level: 84, exp: 1350800 },
  { level: 85, exp: 1400100 },
  { level: 86, exp: 1450600 },
  { level: 87, exp: 1502300 },
  { level: 88, exp: 1555200 },
  { level: 89, exp: 1609400 },
  { level: 90, exp: 1664800 },
  { level: 91, exp: 1721500 },
  { level: 92, exp: 1779500 },
  { level: 93, exp: 1838800 },
  { level: 94, exp: 1899400 },
  { level: 95, exp: 1961300 },
  { level: 96, exp: 2024600 },
  { level: 97, exp: 2089200 },
  { level: 98, exp: 2155200 },
  { level: 99, exp: 2222600 },
  { level: 100, exp: 2291400 },
];

/**
 * Calculates user's level based on cumulative EXPs.
 */
function getUserLevelFromExp(rawExp) {
  const exp = Math.max(0, Number(rawExp) || 0);
  const maxEntry = USER_LEVEL_PROGRESSION_TABLE[USER_LEVEL_PROGRESSION_TABLE.length - 1];
  if (exp >= maxEntry.exp) return 100;
  if (exp < USER_LEVEL_PROGRESSION_TABLE[0].exp) return 1;
  for (let i = USER_LEVEL_PROGRESSION_TABLE.length - 2; i >= 0; i--) {
    if (exp >= USER_LEVEL_PROGRESSION_TABLE[i].exp) {
      return USER_LEVEL_PROGRESSION_TABLE[i].level + 1;
    }
  }
  return 1;
}

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
  const lvl = Math.max(1, Math.min(100, parseInt(currentLevel, 10) || 1));
  return USER_LEVEL_PROGRESSION_TABLE[lvl - 1]?.exp || 2291400;
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
  const safeLevel = Math.max(1, Math.min(100, Math.floor(Number(userLevel) || 1)));
  return {
    id: `level_${String(safeLevel).padStart(2, '0')}`,
    name: `Level ${safeLevel} Frame`,
    frameUrl: `/icons/User Level Frame/level_${String(safeLevel).padStart(2, '0')}.svg`,
  };
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
  const oldLevel = user.wealthLevel || 1;
  user.wealthExp = (user.wealthExp || 0) + Math.max(0, parseInt(expToAdd, 10) || 0);
  const newLevel = getUserLevelFromExp(user.wealthExp);
  user.wealthLevel = Math.max(oldLevel, newLevel);
  const leveledUp = user.wealthLevel > oldLevel;

  const newFrame = getUserFrameByLevel(user.wealthLevel);
  user.activeFrame = {
    id: newFrame.id,
    name: newFrame.name,
    frameUrl: newFrame.frameUrl,
  };

  return { leveledUp, newLevel: user.wealthLevel, currentExp: user.wealthExp };
}

module.exports = {
  calculateRoomSeats,
  getRoomExpForNextLevel,
  getUserExpForNextLevel,
  getUserLevelFromExp,
  getRoomFrameByLevel,
  getUserFrameByLevel,
  addRoomExp,
  addUserWealthExp,
  ROOM_FRAMES,
  USER_FRAMES,
  USER_LEVEL_PROGRESSION_TABLE,
};
