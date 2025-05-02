import React, { useState } from 'react';
import { eventsApi, predictionsApi } from '../../api';
import { Event } from '../../../../shared/types/events';

interface LockResponse {
  success: boolean;
  message?: string;
  error?: string;
  modifiedCount?: number;
  matchedCount?: number;
}

export const AdminEventLockPanel = () => {
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockResponse, setLockResponse] = useState<LockResponse | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isEventListLoading, setIsEventListLoading] = useState(false);

  // Fetch upcoming events for easier selection
  const handleFetchEvents = async () => {
    setIsEventListLoading(true);
    setError('');
    
    try {
      const response = await eventsApi.fetchUpcomingEvents();
      setUpcomingEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsEventListLoading(false);
    }
  };

  // Handle event selection
  const handleEventSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setEventId(selectedId);
    
    // Find event name for display
    const selected = upcomingEvents.find(event => event._id === selectedId || event.id.toString() === selectedId);
    if (selected) {
      setEventName(selected.name);
    }
  };

  // Lock all predictions for an event
  const handleLockEvent = async () => {
    if (!eventId) {
      setError('Event ID is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setLockResponse(null);

    try {
      const response = await predictionsApi.lockPredictionsByEvent(eventId);
      setLockResponse(response);
      
      if (response.success) {
        setSuccess(`Successfully locked ${response.modifiedCount} predictions for event ${eventName || eventId}`);
      } else {
        setError(response.error || 'Failed to lock predictions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock all predictions for an event
  const handleUnlockEvent = async () => {
    if (!eventId) {
      setError('Event ID is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setLockResponse(null);

    try {
      const response = await predictionsApi.unlockPredictionsByEvent(eventId);
      setLockResponse(response);
      
      if (response.success) {
        setSuccess(`Successfully unlocked ${response.modifiedCount} predictions for event ${eventName || eventId}`);
      } else {
        setError(response.error || 'Failed to unlock predictions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6 mt-4">
      <h2 className="text-xl font-semibold mb-4">Event Prediction Lock Management</h2>
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{success}</div>}

      <div className="border rounded p-4 mb-6">
        <h3 className="font-medium mb-3">Select Event</h3>
        <div className="space-y-3">
          {upcomingEvents.length === 0 && (
            <button
              onClick={handleFetchEvents}
              disabled={isEventListLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isEventListLoading ? 'Loading...' : 'Fetch Upcoming Events'}
            </button>
          )}

          {upcomingEvents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select an Event</label>
              <select
                value={eventId}
                onChange={handleEventSelect}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">-- Select an event --</option>
                {upcomingEvents.map(event => (
                  <option key={event._id || event.id} value={event._id || event.id}>
                    {event.name} ({new Date(event.starts_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Or Enter Event ID</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter event ID manually"
            />
          </div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h3 className="font-medium mb-3">Lock/Unlock Event Predictions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Locking predictions prevents users from modifying them after a competition begins.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={handleLockEvent}
            disabled={isLoading || !eventId}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Lock All Predictions'}
          </button>
          <button
            onClick={handleUnlockEvent}
            disabled={isLoading || !eventId}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Unlock All Predictions'}
          </button>
        </div>
      </div>

      {lockResponse && (
        <div className="mt-4 bg-gray-50 p-3 rounded">
          <h4 className="font-medium">Response:</h4>
          <div className="text-sm mt-2">
            <div className="mb-1"><span className="font-medium">Status:</span> {lockResponse.success ? 'Success' : 'Failed'}</div>
            {lockResponse.modifiedCount !== undefined && (
              <div className="mb-1"><span className="font-medium">Predictions Modified:</span> {lockResponse.modifiedCount}</div>
            )}
            {lockResponse.matchedCount !== undefined && (
              <div className="mb-1"><span className="font-medium">Predictions Matched:</span> {lockResponse.matchedCount}</div>
            )}
            {lockResponse.message && (
              <div className="mb-1"><span className="font-medium">Message:</span> {lockResponse.message}</div>
            )}
            {lockResponse.error && (
              <div className="mb-1 text-red-600"><span className="font-medium">Error:</span> {lockResponse.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventLockPanel; 