import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { standingsApi, LeaderboardEntry } from '../../api/standings';
import { leagueApi } from '../../api/leagues';
import { eventsApi } from '../../api/events';

// Badge component for event results
const EventPointsBadge = ({ points, eventName }: { points: number; eventName?: string }) => {
  // Color based on points
  const getColor = (pts: number) => {
    if (pts >= 100) return 'bg-green-100 text-green-800';
    if (pts >= 50) return 'bg-blue-100 text-blue-800';
    if (pts >= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor(points)}`}
      title={eventName || `${points} points`}
    >
      {points} pts
    </span>
  );
};

const Leaderboards = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | undefined>(leagueId);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [eventNames, setEventNames] = useState<Record<string, string>>({});
  const [loadingEventNames, setLoadingEventNames] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Fetch event name by ID
  const fetchEventName = async (eventId: string) => {
    if (eventNames[eventId]) return eventNames[eventId]; // Return from cache if available
    
    try {
      const response = await eventsApi.fetchEventNameById(parseInt(eventId));
      const name = response.name || eventId;
      
      // Update cache with proper string type
      setEventNames(prev => {
        const newCache = { ...prev };
        newCache[eventId] = name.toString();
        return newCache;
      });
      
      return name;
    } catch (err) {
      console.error(`Failed to fetch event name for ${eventId}:`, err);
      return eventId; // Fallback to ID on error
    }
  };
  
  // Fetch event names for all events in the leaderboard
  const fetchEventNames = async (entries: LeaderboardEntry[]) => {
    if (entries.length === 0 || loadingEventNames) return;
    
    setLoadingEventNames(true);
    
    // Collect all unique event IDs
    const eventIds = new Set<string>();
    entries.forEach(entry => {
      entry.eventResults.forEach(result => {
        if (!eventNames[result.eventId]) {
          eventIds.add(result.eventId);
        }
      });
    });
    
    // Fetch names for all events
    const promises = Array.from(eventIds).map(fetchEventName);
    
    try {
      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to fetch some event names:', err);
    } finally {
      setLoadingEventNames(false);
    }
  };

  // Toggle expanded state for a user
  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  // Fetch user's leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await leagueApi.getMyLeagues();
        if (response.leagues) {
          setLeagues(response.leagues);
          
          // If no leagueId provided in URL, use the first league
          if (!selectedLeagueId && response.leagues.length > 0) {
            setSelectedLeagueId(response.leagues[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch leagues:', err);
        setError('Failed to load your leagues. Please try again later.');
      }
    };
    
    fetchLeagues();
  }, [selectedLeagueId]);
  
  // Fetch leaderboard data
  useEffect(() => {
    if (!selectedLeagueId) return;
    
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * pageSize;
      
      try {
        const data = await standingsApi.getLeagueLeaderboard(selectedLeagueId, {
          limit: pageSize,
          offset
        });
        
        setLeaderboard(data.rankings);
        setTotalEntries(data.total);
        fetchEventNames(data.rankings);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [selectedLeagueId, currentPage, pageSize]);
  
  // Handle league change
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLeagueId = e.target.value;
    setSelectedLeagueId(newLeagueId);
    setCurrentPage(1); // Reset to first page
    setExpandedUsers(new Set()); // Reset expanded users
    navigate(`/dashboard/leaderboards/${newLeagueId}`);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalEntries / pageSize);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leaderboards</h1>
      
      {/* League selector */}
      <div className="mb-6">
        <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select League
        </label>
        <select
          id="league-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedLeagueId}
          onChange={handleLeagueChange}
        >
          {leagues.length === 0 ? (
            <option value="">No leagues available</option>
          ) : (
            leagues.map(league => (
              <option key={league._id} value={league._id}>
                {league.name}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Leaderboard table */}
          {leaderboard.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
              {selectedLeagueId 
                ? "No rankings available yet in this league." 
                : "Please select a league to view its leaderboard."}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                      Recent Events
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <React.Fragment key={entry.userId}>
                      <tr className={`hover:bg-gray-50 ${expandedUsers.has(entry.userId) ? 'bg-gray-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.avatarUrl ? (
                              <img 
                                className="h-8 w-8 rounded-full" 
                                src={entry.avatarUrl} 
                                alt={`${entry.userName} avatar`} 
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  {entry.userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{entry.userName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-md leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {entry.totalPoints}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-2">
                            {entry.eventResults.slice(-3).map((result, idx) => (
                              <EventPointsBadge 
                                key={idx} 
                                points={result.points} 
                                eventName={result.categoryName || `Event: ${result.eventId}`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleUserExpand(entry.userId)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {expandedUsers.has(entry.userId) ? 'Hide Details' : 'Show Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded details row */}
                      {expandedUsers.has(entry.userId) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="px-4 py-3 border-t border-gray-200">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Event Details</h3>
                              {entry.eventResults.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                      <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {entry.eventResults
                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map((result, idx) => (
                                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                              {eventNames[result.eventId] || 
                                                (result.eventId.includes('_') 
                                                  ? result.eventId.split('_').map(word => 
                                                      word.charAt(0).toUpperCase() + word.slice(1)
                                                    ).join(' ')
                                                  : result.eventId)
                                            }
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {result.categoryName || (result.categoryId ? `Category ${result.categoryId}` : 'N/A')}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                              <EventPointsBadge points={result.points} />
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No event history available.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalEntries)}
                    </span>{' '}
                    of <span className="font-medium">{totalEntries}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Calculate which page numbers to show
                      let pageNum = 1;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboards;