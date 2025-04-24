import { useState } from 'react';
import { scoringApi, standingsApi } from '../../api';
import type { EventScoreStatus, Standing, ScoreEventResponse, FetchFullResultsResponse } from '../../api';

export const AdminScoringPanel = () => {
  // State for event scoring
  const [eventId, setEventId] = useState('');
  const [scoreResponse, setScoreResponse] = useState<ScoreEventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // State for event status
  const [statusEventId, setStatusEventId] = useState('');
  const [eventStatus, setEventStatus] = useState<EventScoreStatus | null>(null);
  const [eventsStatus, setEventsStatus] = useState<EventScoreStatus[]>([]);

  // State for standings
  const [standingsLeagueId, setStandingsLeagueId] = useState('');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [userId, setUserId] = useState('');
  const [userStanding, setUserStanding] = useState<Standing | null>(null);

  // State for fetching results
  const [fetchEventId, setFetchEventId] = useState('');
  const [fetchResults, setFetchResults] = useState<FetchFullResultsResponse | null>(null);

  // Score an event
  const handleScoreEvent = async () => {
    if (!eventId) {
      setError('Event ID is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setScoreResponse(null);

    try {
      const response = await scoringApi.scoreEvent(eventId);
      setScoreResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch full results
  const handleFetchFullResults = async () => {
    if (!fetchEventId) {
      setError('Event ID is required for fetching results');
      return;
    }

    setIsLoading(true);
    setError('');
    setFetchResults(null);

    try {
      const response = await scoringApi.fetchFullResults(fetchEventId);
      setFetchResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get event status
  const handleGetEventStatus = async () => {
    if (!statusEventId) {
      setError('Event ID is required for status check');
      return;
    }

    setIsLoading(true);
    setError('');
    setEventStatus(null);

    try {
      const response = await scoringApi.getEventScoreStatus(statusEventId);
      setEventStatus(response.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get multiple events status
  const handleGetEventsStatus = async () => {
    setIsLoading(true);
    setError('');
    setEventsStatus([]);

    try {
      const response = await scoringApi.getEventsScoreStatus();
      setEventsStatus(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get league standings
  const handleGetLeagueStandings = async () => {
    if (!standingsLeagueId) {
      setError('League ID is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setStandings([]);

    try {
      const response = await standingsApi.getLeagueStandings(standingsLeagueId);
      setStandings(response.standings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user standing in league
  const handleGetUserStanding = async () => {
    if (!standingsLeagueId || !userId) {
      setError('League ID and User ID are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setUserStanding(null);

    try {
      const response = await standingsApi.getUserStanding(standingsLeagueId, userId);
      setUserStanding(response.standing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6 mt-4">
      <h2 className="text-xl font-semibold mb-4">Scoring Administration Panel</h2>
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Event Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">Score an Event</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event ID</label>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleScoreEvent}
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Score Event'}
            </button>
          </div>

          {scoreResponse && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Response:</h4>
              <div className="text-sm mt-2">
                <div className="mb-1"><span className="font-medium">Status:</span> {scoreResponse.success ? 'Success' : 'Failed'}</div>
                {scoreResponse.processed !== undefined && (
                  <div className="mb-1"><span className="font-medium">Predictions Processed:</span> {scoreResponse.processed}</div>
                )}
                {scoreResponse.leagues !== undefined && (
                  <div className="mb-1"><span className="font-medium">Leagues Processed:</span> {scoreResponse.leagues}</div>
                )}
                {scoreResponse.message && (
                  <div className="mb-1"><span className="font-medium">Message:</span> {scoreResponse.message}</div>
                )}
                {scoreResponse.error && (
                  <div className="mb-1 text-red-600"><span className="font-medium">Error:</span> {scoreResponse.error}</div>
                )}
              </div>
              <pre className="text-xs mt-2 overflow-auto max-h-40">
                {JSON.stringify(scoreResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Fetch Full Results Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">Fetch Full Results</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event ID</label>
              <input
                type="text"
                value={fetchEventId}
                onChange={(e) => setFetchEventId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleFetchFullResults}
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Fetching...' : 'Fetch Results'}
            </button>
          </div>

          {fetchResults && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Fetch Results:</h4>
              <div className="text-sm mt-2">
                <div className="mb-1"><span className="font-medium">Status:</span> {fetchResults.success ? 'Success' : 'Failed'}</div>
                {fetchResults.categoriesProcessed !== undefined && (
                  <div className="mb-1"><span className="font-medium">Categories Processed:</span> {fetchResults.categoriesProcessed}</div>
                )}
                {fetchResults.message && (
                  <div className="mb-1"><span className="font-medium">Message:</span> {fetchResults.message}</div>
                )}
                {fetchResults.error && (
                  <div className="mb-1 text-red-600"><span className="font-medium">Error:</span> {fetchResults.error}</div>
                )}
              </div>
              <pre className="text-xs mt-2 overflow-auto max-h-40">
                {JSON.stringify(fetchResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Event Status Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">Check Event Status</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event ID</label>
              <input
                type="text"
                value={statusEventId}
                onChange={(e) => setStatusEventId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleGetEventStatus}
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Get Status
              </button>
              <button
                onClick={handleGetEventsStatus}
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Get All Events Status
              </button>
            </div>
          </div>

          {eventStatus && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Single Event Status:</h4>
              <pre className="text-xs mt-2 overflow-auto max-h-40">
                {JSON.stringify(eventStatus, null, 2)}
              </pre>
            </div>
          )}

          {eventsStatus.length > 0 && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Multiple Events Status:</h4>
              <pre className="text-xs mt-2 overflow-auto max-h-40">
                {JSON.stringify(eventsStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Standings Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">League Standings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">League ID</label>
              <input
                type="text"
                value={standingsLeagueId}
                onChange={(e) => setStandingsLeagueId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleGetLeagueStandings}
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Get League Standings
            </button>
          </div>

          {standings.length > 0 && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Standings:</h4>
              <div className="mt-2 overflow-auto max-h-40">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standings.map((standing) => (
                      <tr key={standing._id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{standing.userId}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{standing.totalPoints}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{standing.eventHistory.length}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {standing.eventHistory.filter(entry => entry.categoryId).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* User Standing Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">User Standing</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">League ID</label>
              <input
                type="text"
                value={standingsLeagueId}
                onChange={(e) => setStandingsLeagueId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleGetUserStanding}
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Get User Standing
            </button>
          </div>

          {userStanding && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-medium">User Standing:</h4>
              <div className="mt-2 mb-2">
                <div><span className="font-medium">User ID:</span> {userStanding.userId}</div>
                <div><span className="font-medium">Total Points:</span> {userStanding.totalPoints}</div>
                <div><span className="font-medium">Events:</span> {userStanding.eventHistory.length}</div>
              </div>
              
              {userStanding.eventHistory.length > 0 && (
                <div className="mt-2">
                  <h5 className="font-medium text-sm">Event History:</h5>
                  <div className="overflow-auto max-h-40 mt-1">
                    <table className="min-w-full divide-y divide-gray-300 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Event</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Category</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Points</th>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userStanding.eventHistory.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">{entry.eventId}</td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">{entry.categoryName || '-'}</td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">{entry.points}</td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <pre className="text-xs mt-2 overflow-auto max-h-40">
                {JSON.stringify(userStanding, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminScoringPanel; 