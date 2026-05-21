import React from 'react';

export function PageSkeleton({ title = 'Loading...' }: { title?: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse px-6 py-8 max-w-7xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-2/5 mb-6" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-10 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="h-6 bg-gray-200 rounded w-full mb-3" />
            <div className="h-6 bg-gray-200 rounded w-full mb-3" />
            <div className="h-6 bg-gray-200 rounded w-5/6 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="h-6 bg-gray-200 rounded w-full mb-3" />
            <div className="h-6 bg-gray-200 rounded w-5/6 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-4/6 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-3/6" />
          </div>
        </div>

        <div className="mt-10">
          <div className="h-10 bg-gray-200 rounded w-2/5" />
        </div>
      </div>

      <div className="sr-only">{title}</div>
    </div>
  );
}

