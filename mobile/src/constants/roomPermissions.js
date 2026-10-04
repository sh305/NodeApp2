/**
 * Room Role Authority & Permissions System
 * Governs the exact rights of Room Owner, Admin, and Host matching Screenshot 4
 */

export const ROOM_AUTHORITIES = {
  SEAT_LOCK: 'Seat Lock',
  INVITE_ON_SEAT: 'Invite on seat',
  SEAT_APPLICATION: 'Accept/Reject seat application',
  KICK_OFF_SEAT: 'Kick off the seat',
  MIC_CONTROL: 'Open Mic/Close Mic',
  FORBID_IMAGES: 'Forbid from sending images in the room',
  KICK_OFF_ROOM: 'Kick off the room',
  SET_ADMIN: 'Set/Cancel Admin',
  SET_HOST: 'Set/Cancel Host',
  MEMBER_APPLICATION: 'Accept/Reject member application',
  PLAY_MUSIC: 'Play music',
  PLAY_SOUND_EFFECT: 'Play sound effect',
  START_COUNTER: 'Start/End the counter',
};

// Check if a specific user has authority in the room
export function checkUserAuthority(user, room, authority, isHostSeatOccupied = false) {
  if (!user || !room) return false;

  const userId = (user._id || user).toString();
  const ownerId = (room.owner?._id || room.owner || '').toString();

  // 1. Room Owner has 100% of all authorities
  if (ownerId && userId === ownerId) {
    return true;
  }

  const isAdmin = (room.admins || []).some(
    (a) => (a._id || a).toString() === userId
  );

  // Host rights are granted ONLY when host seat is occupied
  const isHost =
    isHostSeatOccupied &&
    ((room.hosts || []).some((h) => (h._id || h).toString() === userId) ||
      (room.owner?._id && room.owner._id.toString() === userId));

  switch (authority) {
    // Shared rights: Admin + Host + Owner
    case ROOM_AUTHORITIES.SEAT_LOCK:
    case ROOM_AUTHORITIES.INVITE_ON_SEAT:
    case ROOM_AUTHORITIES.SEAT_APPLICATION:
    case ROOM_AUTHORITIES.KICK_OFF_SEAT:
    case ROOM_AUTHORITIES.MIC_CONTROL:
    case ROOM_AUTHORITIES.FORBID_IMAGES:
    case ROOM_AUTHORITIES.KICK_OFF_ROOM:
      return isAdmin || isHost;

    // Admin exclusive rights (Admin + Owner)
    case ROOM_AUTHORITIES.SET_HOST:
    case ROOM_AUTHORITIES.MEMBER_APPLICATION:
      return isAdmin;

    // Host exclusive entertainment rights (Host + Owner)
    case ROOM_AUTHORITIES.PLAY_MUSIC:
    case ROOM_AUTHORITIES.PLAY_SOUND_EFFECT:
    case ROOM_AUTHORITIES.START_COUNTER:
      return isHost;

    // Owner only rights
    case ROOM_AUTHORITIES.SET_ADMIN:
      return false; // Only Owner (checked above)

    default:
      return false;
  }
}
