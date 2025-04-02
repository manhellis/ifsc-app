import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IFSCDocument } from '@shared/types';

const Events: React.FC = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState<IFSCDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return; // Don't fetch if not authenticated
            
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await fetch('/api/ifsc-data', {
                    method: 'GET',
                    credentials: 'include', // Necessary for sending cookies with the request
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching events: ${response.status}`);
                }
                
                const data = await response.json();
                setEvents(data.documents || []);
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchEvents();
    }, [user]); // Re-fetch when user changes

    if (loading) {
        return <div>Checking authentication...</div>;
    }
    
    if (!user) {
        return <div>Please log in to view events</div>;
    }

    return (
        <div className="events-container">
            <h1>Events</h1>
            
            {isLoading && <div>Loading events...</div>}
            
            {error && (
                <div className="error-message">
                    <p>Error: {error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
            )}
            
            {!isLoading && !error && events.length === 0 && (
                <div>No events found</div>
            )}
            
            {events.length > 0 && (
                <div className="events-list">
                    {events.map((event) => (
                        <div key={event._id} className="event-card">
                            <h2>{event.title}</h2>
                            <p>Created: {new Date(event.createdAt).toLocaleDateString()}</p>
                            {event.tags.length > 0 && (
                                <div className="event-tags">
                                    {event.tags.map((tag, index) => (
                                        <span key={index} className="tag">{tag}</span>
                                    ))}
                                </div>
                            )}
                            <div className="event-content">
                                {typeof event.content === 'object' 
                                    ? <pre>{JSON.stringify(event.content, null, 2)}</pre>
                                    : <p>{String(event.content)}</p>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Events;