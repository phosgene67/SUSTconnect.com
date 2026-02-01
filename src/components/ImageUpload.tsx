import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, Loader2, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  variant?: 'avatar' | 'cover';
  fallback?: string;
  className?: string;
  disabled?: boolean;
  type?: 'profile' | 'korum';
}

export function ImageUpload({
  currentImage,
  onUpload,
  isUploading = false,
  variant = 'avatar',
  fallback = '',
  className,
  disabled = false,
  type = 'profile',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const result = await onUpload(file);
    if (!result) {
      setPreview(null);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayImage = preview || currentImage;

  if (variant === 'cover') {
    return (
      <div className={cn('relative group', className)}>
        <div
          className={cn(
            'relative h-32 md:h-48 rounded-lg overflow-hidden bg-muted cursor-pointer',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          onClick={handleClick}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-secondary/20">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <div className="text-white text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm">Change Cover</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative group inline-block', className)}>
      <div
        className={cn(
          'relative cursor-pointer',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onClick={handleClick}
      >
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayImage || undefined} />
          <AvatarFallback className="text-2xl">
            {fallback ? (
              fallback.charAt(0).toUpperCase()
            ) : type === 'korum' ? (
              <Users className="h-8 w-8" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </AvatarFallback>
        </Avatar>
        
        {!disabled && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        )}
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
