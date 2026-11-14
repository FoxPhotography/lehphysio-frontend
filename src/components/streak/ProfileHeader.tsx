import React from 'react';
import FireGoalBackground from './FireGoalBackground';
import { UserAvatar } from '../UserAvatar';

export interface ProfileHeaderProps {
  user?: any;
  avatarUrl?: string;
  username?: string;
  tagline?: string;
  className?: string;
}

export default function ProfileHeader({
  user,
  avatarUrl = '/your-avatar.jpg',
  username = 'Ibrahim Fox',
  tagline = 'Striker • Web Developer & Creator',
  className = '',
}: ProfileHeaderProps) {
  const displayUser = user?.username || username;
  const displayAvatar = user?.avatar_url || avatarUrl;
  const displayTagline = tagline;

  return (
    <FireGoalBackground className={`w-full max-w-xl h-40 flex items-center px-6 ${className}`}>
      <div className="flex items-center gap-4 text-start">
        {user ? (
          <UserAvatar
            username={displayUser}
            avatarUrl={displayAvatar}
            equippedFrame={user.equipped_frame}
            size={64}
            className="border-2 border-orange-400 shadow-lg shrink-0"
          />
        ) : (
          <img
            src={displayAvatar}
            alt={displayUser}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://res.cloudinary.com/dp3gh51gn/image/upload/v1781337240/physioleague/k0qolxiu1gmrqtlsrtjm.jpg';
            }}
            className="w-16 h-16 rounded-full border-2 border-orange-400 shadow-lg object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white tracking-wide drop-shadow truncate">
            {displayUser}
          </h1>
          <p className="text-sm text-emerald-300 font-medium truncate drop-shadow">
            {displayTagline}
          </p>
        </div>
      </div>
    </FireGoalBackground>
  );
}
