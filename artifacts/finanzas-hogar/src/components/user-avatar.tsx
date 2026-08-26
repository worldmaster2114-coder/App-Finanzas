import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

type UserAvatarProps = {
  picture?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isSuperAdmin?: boolean;
};

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm font-bold',
  lg: 'h-14 w-14 text-lg font-bold',
  xl: 'h-20 w-20 text-2xl font-bold',
};

export function UserAvatar({ picture, name, size = 'sm', className = '', isSuperAdmin = false }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initial = name ? name.trim().charAt(0).toUpperCase() : null;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  if (picture && !hasError) {
    return (
      <img
        src={picture}
        alt={name || 'Usuario'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 border-2 ${
          isSuperAdmin ? 'border-amber-500 shadow-xs' : 'border-primary/40'
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full flex items-center justify-center font-extrabold ${
        isSuperAdmin
          ? 'bg-amber-500/20 text-amber-500 border-2 border-amber-500/40 shadow-xs'
          : 'bg-primary/15 text-primary border-2 border-primary/20 shadow-xs'
      } ${className}`}
    >
      {initial ? initial : <UserIcon size={size === 'xl' ? 32 : size === 'lg' ? 24 : 16} />}
    </div>
  );
}
