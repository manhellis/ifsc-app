import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RankingEntry {
  place: number;
  athlete_id: string;
  name: string;
  country: string;
  score: number | null;
}

interface CategoryRound {
  category: string;
  round: string;
  date: string;
  results: unknown[];
}

interface FullResult {
  _id: string;
  event: string;
  dcat: string;
  status: string;
  status_as_of: string;
  ranking_as_of: string;
  category_rounds: CategoryRound[];
  ranking: RankingEntry[];
}

const TestFullResults = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // State for API data and UI
  const [results, setResults] = useState<FullResult[]>([]);
  const [singleResult, setSingleResult] = useState<FullResult | null>(null);
  const [eventResults, setEventResults] = useState<FullResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState('');
  const [eventName, setEventName] = useState('');

  // Fetch all results
  const fetchAllResults = async () => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setSingleResult(null);
    setEventResults([]);
    
    try {
      const response = await fetch('/api/results', {
        credentials: 'include' // Important for sending auth cookies
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
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
    
    try {
      const response = await fetch(`/api/results/${resultId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSingleResult(data.result || null);
    } catch (error) {
      setError(`Failed to fetch result: ${error instanceof Error ? error.message : String(error)}`);
      setSingleResult(null);
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
    
    try {
      const response = await fetch(`/api/results/event/${encodeURIComponent(eventName)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
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
            type="text"
            value={resultId}
            onChange={(e) => setResultId(e.target.value)}
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
      
      {/* Display Single Result */}
      {singleResult && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Single Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
            {JSON.stringify(singleResult, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Display Results by Event */}
      {eventResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Results for Event: {eventName} ({eventResults.length})</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
            {JSON.stringify(eventResults, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Display All Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Results ({results.length})</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestFullResults; 