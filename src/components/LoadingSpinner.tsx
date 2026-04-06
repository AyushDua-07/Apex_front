import React from 'react';

interface Props {
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({ fullPage }) => {
  const spinner = (
    <div className="w-10 h-10 border-4 border-royal/30 border-t-royal rounded-full animate-spin" />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
};

export default LoadingSpinner;
