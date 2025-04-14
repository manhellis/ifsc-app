import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../../../shared/types/events';
import { eventsApi } from '../api';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await eventsApi.fetchEventById(id as string);
      setEvent(data.event || null);
    } catch (error) {
      setError(`Failed to fetch event: ${error instanceof Error ? error.message : String(error)}`);
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      <h1 className="text-2xl font-bold mb-4">Event Details</h1>
      
      {isLoading && <div className="mb-4">Loading...</div>}
      {error && <div className="mb-4 text-red-500">{error}</div>}
      
      {event ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">{event.name}</h2>
          <div className="text-lg text-gray-600 mb-4">{event.location}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-md font-semibold mb-2">Event Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Starts:</div>
                <div className="text-sm">{formatDate(event.starts_at)}</div>
                
                <div className="text-sm text-gray-500">Ends:</div>
                <div className="text-sm">{formatDate(event.ends_at)}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-semibold mb-2">Links</h3>
              <div className="flex flex-col space-y-2">
                {event.registration_url && (
                  <a 
                    href={event.registration_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Registration Link
                  </a>
                )}
                
                {event.public_information?.infosheet_url && (
                  <a 
                    href={event.public_information.infosheet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Information Sheet
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        !isLoading && !error && <div className="text-gray-500">Event not found</div>
      )}
    </div>
  );
};

export default EventDetail; 