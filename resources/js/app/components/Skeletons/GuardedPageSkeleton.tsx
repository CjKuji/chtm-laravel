import React from 'react';

export function GuardedPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-3 sm:px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />

        <div className="bg-white rounded-xl shadow p-6">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="h-10 bg-gray-200 rounded w-full mb-4" />
          <div className="h-10 bg-gray-200 rounded w-full mb-4" />
          <div className="h-10 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}


