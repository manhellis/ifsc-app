import { useState, useEffect } from 'react';
import { standingsApi } from '../../api';
import type { Standing } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

interface LeagueStandingsProps {
  leagueId: string;
  limit?: number;
}

export const LeagueStandings = ({ leagueId, limit = 10 }: LeagueStandingsProps) => {
  const { user } = useAuth();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [userStanding, setUserStanding] = useState<Standing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get user ID from auth context - adjust the property based on your actual User type
  const userId = user?.userId || '';

  // Fetch league standings
  useEffect(() => {
    if (!leagueId) return;

    const fetchStandings = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await standingsApi.getLeagueStandings(leagueId);
        setStandings(response.standings.slice(0, limit));
      } catch (err) {
        setError('Failed to load standings');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId, limit]);

  // Fetch current user's standing if logged in
  useEffect(() => {
    if (!leagueId || !userId) return;

    const fetchUserStanding = async () => {
      try {
        const response = await standingsApi.getUserStanding(leagueId, userId);
        setUserStanding(response.standing);
      } catch (err) {
        console.error('Failed to load user standing:', err);
      }
    };

    fetchUserStanding();
  }, [leagueId, userId]);

  // Find user's rank
  const getUserRank = () => {
    if (!userStanding || !userId) return null;
    
    const index = standings.findIndex(s => s.userId === userId);
    return index >= 0 ? index + 1 : null;
  };

  const userRank = getUserRank();

  if (isLoading) {
    return <div className="p-4 text-center">Loading standings...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-indigo-50 border-b border-indigo-100">
        <h3 className="text-lg font-medium text-indigo-900">League Standings</h3>
      </div>

      {standings.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No standings available yet
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Events
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((standing, index) => (
                  <tr 
                    key={standing._id} 
                    className={userId && standing.userId === userId ? 'bg-indigo-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.userId === userId ? 'You' : standing.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.eventHistory.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show user's standing if not in top ranks */}
          {userStanding && userRank && userRank > limit && (
            <div className="p-3 bg-indigo-50 border-t border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-indigo-800">Your Rank: #{userRank}</div>
                <div className="text-sm text-indigo-800">Points: {userStanding.totalPoints}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeagueStandings; 