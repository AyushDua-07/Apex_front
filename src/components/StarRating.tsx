import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  showNumber?: boolean;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<Props> = ({ rating, showNumber = false, size = 16, interactive = false, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating ? 'fill-gold text-gold' : 'fill-none text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-gold' : ''}`}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
      {showNumber && <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>}
    </div>
  );
};

export default StarRating;
