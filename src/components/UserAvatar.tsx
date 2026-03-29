import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  imageUrl?: string;
  name: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  name,
  className = "h-10 w-10"
}) => {
  const baseUrl = (import.meta as any).env.VITE_API_URL || '';
  const fullImageUrl = imageUrl ? `${baseUrl}${imageUrl}` : null;

  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`${className} relative`}>
      
      {/* ✅ Image */}
      {fullImageUrl && !imageError && (
        <img
          src={fullImageUrl}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* ✅ Fallback */}
      {(imageError || !fullImageUrl) && (
        <div className="h-full w-full flex items-center justify-center rounded-full bg-slate-200 text-slate-600">
          {name ? (
            <span className="text-sm font-medium">
              {getInitials(name)}
            </span>
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>
      )}

    </div>
  );
};
