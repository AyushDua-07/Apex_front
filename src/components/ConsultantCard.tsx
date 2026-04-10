import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, DollarSign } from 'lucide-react';
import type { Consultant } from '../types';
import { getInitials, formatCurrency, getUploadUrl } from '../utils/helpers';
import StarRating from './StarRating';

interface Props {
  consultant: Consultant;
}

const ConsultantCard: React.FC<Props> = ({ consultant }) => {
  const photoUrl = consultant.profilePhoto
    ? getUploadUrl(consultant.profilePhoto)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={consultant.user?.fullName}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center text-lg font-bold">
            {getInitials(consultant.user?.fullName || '')}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{consultant.user?.fullName}</h3>
          <span className="inline-block px-2 py-0.5 bg-royal/10 text-royal text-xs rounded-full font-medium">
            {consultant.specialization}
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
        {consultant.bio || 'No bio available.'}
      </p>
      <div className="flex items-center justify-between mb-4">
        <StarRating rating={consultant.averageRating} showNumber />
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Briefcase size={14} />
          <span>{consultant.yearsExperience || 0} yrs</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-navy font-semibold">
          <DollarSign size={16} />
          <span>{formatCurrency(consultant.hourlyRate)}/hr</span>
        </div>
        <Link
          to={`/consultants/${consultant._id}`}
          className="px-4 py-2 bg-royal text-white text-sm rounded-lg hover:bg-royal-dark transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default ConsultantCard;
