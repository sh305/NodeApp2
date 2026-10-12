import React from 'react';
import AvatarWithFrame from './AvatarWithFrame';

export default function UserAvatarWithFrame({
  avatarUri,
  avatarSource,
  level = 1,
  frame = null,
  size = 76,
  style,
  avatarStyle,
  activeEmoji = null,
  onEmojiComplete = null,
  showLevelBadge = false,
}) {
  const resolvedUri = avatarSource
    ? (typeof avatarSource === 'string' ? avatarSource : avatarSource?.uri)
    : avatarUri;

  return (
    <AvatarWithFrame
      avatarUri={resolvedUri}
      level={level}
      frame={frame}
      size={size}
      style={style}
      avatarStyle={avatarStyle}
      activeEmoji={activeEmoji}
      onEmojiComplete={onEmojiComplete}
      showLevelBadge={showLevelBadge}
    />
  );
}
