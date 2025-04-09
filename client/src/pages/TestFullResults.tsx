import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FullResult, RankingEntry, CategoryRound } from '../../../shared/types/fullResults';
import { resultsApi } from '../api';

const RankingTable = ({ ranking }: { ranking: RankingEntry[] }) => {
  if (!ranking || ranking.length === 0) {
    return <div className="text-gray-500 italic">No ranking data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Place</th>
            <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Name</th>
            <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Country</th>
            <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ranking.map((entry, index) => (
            <tr key={`${entry.athlete_id}-${index}`}>
              <td className="py-2 px-3 text-sm">{entry.place}</td>
              <td className="py-2 px-3 text-sm">{entry.name}</td>
              <td className="py-2 px-3 text-sm">{entry.country}</td>
              <td className="py-2 px-3 text-sm">{entry.score ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CategoryRoundsList = ({ categoryRounds }: { categoryRounds: CategoryRound[] }) => {
  if (!categoryRounds || categoryRounds.length === 0) {
    return <div className="text-gray-500 italic">No category rounds available</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      {categoryRounds.map((round, index) => (
        <div key={index} className="bg-gray-50 p-3 rounded">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <span className="text-xs text-gray-500">Category:</span>
              <div className="font-medium">{round.category}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Round:</span>
              <div className="font-medium">{round.round}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Date:</span>
              <div className="font-medium">{formatDate(round.date)}</div>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500">Results Available: </span>
            <span className="text-sm">{round.results?.length || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const ResultCard = ({ result }: { result: FullResult }) => {
  const [showRanking, setShowRanking] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{result.event}</h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          {result.dcat}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <span className="text-xs text-gray-500">Status:</span>
          <div className="font-medium">{result.status}</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Updated:</span>
          <div className="text-sm">{formatDate(result.status_as_of)}</div>
        </div>
      </div>
      
      <div className="border-t mt-3 pt-3">
        <button 
          onClick={() => setShowRanking(!showRanking)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4"
        >
          {showRanking ? 'Hide Ranking' : `Show Ranking (${result.ranking?.length || 0})`}
        </button>
        
        <button 
          onClick={() => setShowRounds(!showRounds)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {showRounds ? 'Hide Rounds' : `Show Rounds (${result.category_rounds?.length || 0})`}
        </button>
        
        {showRanking && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold mb-2">Ranking (as of {formatDate(result.ranking_as_of)})</h4>
            <RankingTable ranking={result.ranking} />
          </div>
        )}
        
        {showRounds && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold mb-2">Category Rounds</h4>
            <CategoryRoundsList categoryRounds={result.category_rounds} />
          </div>
        )}
      </div>
    </div>
  );
};

const TestFullResults = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // State for API data and UI
  const [results, setResults] = useState<FullResult[]>([]);
  const [eventResults, setEventResults] = useState<FullResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<number | ''>('');
  const [eventName, setEventName] = useState('');
  const [searchType, setSearchType] = useState<'event' | 'id' | null>(null);

  // Fetch all results
  const fetchAllResults = async () => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setEventResults([]);
    setSearchType(null);
    
    try {
      const data = await resultsApi.fetchAllResults();
      setResults(data.results || []);
    } catch (error) {
      setError(`Failed to fetch results: ${error instanceof Error ? error.message : String(error)}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a single result by ID
  const fetchResultById = async () => {
    if (!resultId) {
      setError('Please enter a result ID');
      return;
    }
    
    // Reset state
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchType('id');
    
    try {
      const data = await resultsApi.fetchResultById(String(resultId));
      setEventResults(data.results || []);
    } catch (error) {
      setError(`Failed to fetch result: ${error instanceof Error ? error.message : String(error)}`);
      setEventResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch results by event name
  const fetchResultsByEvent = async () => {
    if (!eventName) {
      setError('Please enter an event name');
      return;
    }
    
    // Reset state
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchType('event');
    
    try {
      const data = await resultsApi.fetchResultsByEvent(eventName);
      setEventResults(data.results || []);
    } catch (error) {
      setError(`Failed to fetch results by event: ${error instanceof Error ? error.message : String(error)}`);
      setEventResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // If auth is loading, show loading state
  if (loading) {
    return <div className="container mx-auto p-4">Checking authentication...</div>;
  }
  
  // If not authenticated, redirect or show message
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
        <p className="mb-4">You need to be logged in to access this page.</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Full Results API</h1>
      
      {/* API Action Buttons */}
      <div className="mb-6 space-y-4">
        <button 
          onClick={fetchAllResults}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Fetch All Results
        </button>
        
        <div className="flex items-center">
          <input
            type="number"
            value={resultId}
            onChange={(e) => setResultId(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Result ID"
            className="border rounded p-2 mr-2"
          />
          <button 
            onClick={fetchResultById}
            disabled={isLoading || !resultId}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Fetch By ID
          </button>
        </div>
        
        <div className="flex items-center">
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event Name"
            className="border rounded p-2 mr-2"
          />
          <button 
            onClick={fetchResultsByEvent}
            disabled={isLoading || !eventName}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Fetch By Event
          </button>
        </div>
      </div>
      
      {/* Loading and Error States */}
      {isLoading && <div className="mb-4">Loading...</div>}
      {error && <div className="mb-4 text-red-500">{error}</div>}
      
      {/* Display Results by Event or ID */}
      {eventResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Results for {searchType === 'id' ? `ID: ${resultId}` : `Event: ${eventName}`} ({eventResults.length})
          </h2>
          <div className="space-y-4">
            {eventResults.map(result => (
              <ResultCard key={result._id} result={result} />
            ))}
          </div>
        </div>
      )}
      
      {/* Display All Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Results ({results.length})</h2>
          <div className="space-y-4">
            {results.map(result => (
              <ResultCard key={result._id} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestFullResults; 