import React from 'react';

const MyPicks = () => {
  return (
    <div className="p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-4">My Picks</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <select className="border border-gray-300 p-2 rounded w-40">
          <option>Year</option>
        </select>
        <select className="border border-gray-300 p-2 rounded w-40">
          <option>Discipline</option>
        </select>
        <select className="border border-gray-300 p-2 rounded w-40">
          <option>League</option>
        </select>
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Placeholder #1 */}
          <div className="bg-gray-200 h-40 relative">
            <button className="absolute bottom-2 right-2 bg-gray-600 text-white px-2 py-1 text-sm rounded">
              Edit
            </button>
          </div>
          {/* Placeholder #2 */}
          <div className="bg-gray-200 h-40" />
          {/* Placeholder #3 */}
          <div className="bg-gray-200 h-40" />
          {/* Placeholder #4 (new) */}
          <div className="bg-gray-200 h-40" />
        </div>
      </div>

      {/* Past */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Past</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-200 h-40" />
          <div className="bg-gray-200 h-40" />
          <div className="bg-gray-200 h-40" />
          <div className="bg-gray-200 h-40" />
        </div>
      </div>
    </div>
  );
};

export default MyPicks;