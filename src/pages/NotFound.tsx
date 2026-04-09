import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-navy/20">404</h1>
        <h2 className="text-2xl font-bold text-navy mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
