import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Event } from '../../../shared/types/events';
import { eventsApi } from '../api';

const EventCard = ({ event }: { event: Event }) => {
  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold">{event.name}</h3>
      <div className="text-sm text-gray-600 mb-2">{event.location}</div>
      <div className="flex justify-between mb-2">
        <div>
          <span className="text-xs text-gray-500">Starts:</span>
          <div>{formatDate(event.starts_at)}</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Ends:</span>
          <div>{formatDate(event.ends_at)}</div>
        </div>
      </div>
      {event.registration_url && (
        <a 
          href={event.registration_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm"
        >
          Registration Link
        </a>
      )}
      {event.public_information?.infosheet_url && (
        <a 
          href={event.public_information.infosheet_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-blue-500 hover:underline text-sm mt-1"
        >
          Info Sheet
        </a>
      )}
    </div>
  );
};

const TestEvents = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // State for API data and UI
  const [events, setEvents] = useState<Event[]>([]);
  const [singleEvent, setSingleEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState('');

  // Fetch all events
  const fetchAllEvents = async () => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setSingleEvent(null);
    
    try {
      const data = await eventsApi.fetchAllEvents();
      setEvents(data.events || []);
    } catch (error) {
      setError(`Failed to fetch events: ${error instanceof Error ? error.message : String(error)}`);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a single event by ID
  const fetchEventById = async () => {
    if (!eventId) {
      setError('Please enter an event ID');
      return;
    }
    
    // Reset state
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await eventsApi.fetchEventById(eventId);
      setSingleEvent(data.event || null);
    } catch (error) {
      setError(`Failed to fetch event: ${error instanceof Error ? error.message : String(error)}`);
      setSingleEvent(null);
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
      <h1 className="text-2xl font-bold mb-4">Test Events API</h1>
      
      {/* API Action Buttons */}
      <div className="mb-6 flex space-x-4">
        <button 
          onClick={fetchAllEvents}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Fetch All Events
        </button>
        
        <div className="flex items-center">
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Event ID"
            className="border rounded p-2 mr-2"
          />
          <button 
            onClick={fetchEventById}
            disabled={isLoading || !eventId}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Fetch By ID
          </button>
        </div>
      </div>
      
      {/* Loading and Error States */}
      {isLoading && <div className="mb-4">Loading...</div>}
      {error && <div className="mb-4 text-red-500">{error}</div>}
      
      {/* Display Single Event */}
      {singleEvent && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Single Event</h2>
          <EventCard event={singleEvent} />
          <div className="mt-2">
            <button 
              onClick={() => setSingleEvent(null)} 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      {/* Display All Events */}
      {events.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Events ({events.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEvents; 