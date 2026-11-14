import React from 'react';
import FireGoalBackground from './FireGoalBackground';

export default function ProfileHeader() {
  return (
    <FireGoalBackground className="w-full max-w-xl h-40 flex items-center">
      <div className="flex items-center gap-4">
        <img
          src="/your-avatar.jpg"
          alt="Ibrahim Fox"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://res.cloudinary.com/dp3gh51gn/image/upload/v1781337240/physioleague/k0qolxiu1gmrqtlsrtjm.jpg';
          }}
          className="w-16 h-16 rounded-full border-2 border-orange-400 shadow-lg object-cover"
        />
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide drop-shadow">
            Ibrahim Fox
          </h1>
          <p className="text-sm text-emerald-300 font-medium">
            Striker • Web Developer & Creator
          </p>
        </div>
      </div>
    </FireGoalBackground>
  );
}
