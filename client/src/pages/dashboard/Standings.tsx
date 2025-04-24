import { useState } from 'react';
import LeagueStandings from '../../components/standings/LeagueStandings';

const StandingsPage = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [leagueIdInput, setLeagueIdInput] = useState('');

  // Simulate a list of leagues the user belongs to
  const userLeagues = [
    { id: 'league1', name: 'IFSC World Cup 2023' },
    { id: 'league2', name: 'Boulder Champions League' },
    { id: 'league3', name: 'Lead Climbing Series' },
  ];

  const handleViewStandings = () => {
    setSelectedLeagueId(leagueIdInput);
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Standings</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Select League</h2>
        
        {/* League dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Leagues
            </label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={leagueIdInput}
              onChange={(e) => setLeagueIdInput(e.target.value)}
            >
              <option value="">Select a league</option>
              {userLeagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleViewStandings}
              disabled={!leagueIdInput}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              View Standings
            </button>
          </div>
        </div>
        
        {/* Custom league ID input (for testing) */}
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Manual League ID Input (for testing)
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={leagueIdInput}
              onChange={(e) => setLeagueIdInput(e.target.value)}
              placeholder="Enter league ID"
              className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            <button
              onClick={handleViewStandings}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go
            </button>
          </div>
        </div>
      </div>
      
      {/* Display standings when a league is selected */}
      {selectedLeagueId ? (
        <LeagueStandings leagueId={selectedLeagueId} limit={20} />
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Select a league to view standings</p>
        </div>
      )}
    </div>
  );
};

export default StandingsPage; 