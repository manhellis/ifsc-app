import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../../../shared/types/events';
import { eventsApi } from '../../api';
import EventCard from '../../components/EventCard';

// Constants for localStorage keys
const FILTER_STORAGE_KEY = 'events_filter_state';

// Interface for filter state
interface FilterState {
    startDate: string;
    endDate: string;
}

const Events: React.FC = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Initialize filter state from localStorage or defaults
    const [filterState, setFilterState] = useState<FilterState>(() => {
        const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
        return savedFilters ? JSON.parse(savedFilters) : { startDate: '', endDate: '' };
    });
    
    // Destructure filter values for easier access
    const { startDate, endDate } = filterState;

    // Update localStorage when filters change
    useEffect(() => {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterState));
    }, [filterState]);

    const fetchEvents = async () => {
        if (!user) return; // Don't fetch if not authenticated
        
        setIsLoading(true);
        setError(null);
        
        try {
            let data;
            
            // If date filters are provided, use queryEvents
            if (startDate || endDate) {
                const query: Record<string, unknown> = {};
                
                // Build query object based on provided date filters
                if (startDate && endDate) {
                    query.starts_at = { 
                        $gte: new Date(startDate).toISOString(),
                        $lte: new Date(endDate).toISOString()
                    };
                } else if (startDate) {
                    query.starts_at = { $gte: new Date(startDate).toISOString() };
                } else if (endDate) {
                    query.starts_at = { $lte: new Date(endDate).toISOString() };
                }
                
                data = await eventsApi.queryEvents(query);
            } else {
                // If no filters, fetch upcoming events
                data = await eventsApi.fetchUpcomingEvents();
            }
            
            setEvents(data.events || []);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchEvents();
    }, [user]); // Re-fetch when user changes

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEvents();
    };

    const clearFilters = () => {
        setFilterState({ startDate: '', endDate: '' });
        // Fetch events without filters
        fetchEvents();
    };

    const handleFilterChange = (field: keyof FilterState, value: string) => {
        setFilterState(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Checking authentication...</div>;
    }
    
    if (!user) {
        return <div className="flex justify-center items-center min-h-screen">Please log in to view events</div>;
    }

    return (
        <div className="flex flex-col h-full py-6">
            <h1 className="text-4xl sm:text-6xl text-left font-normal">
                Events
            </h1>
            
            {/* Date filter form */}
            <div className="mt-8 mb-8">
                <form onSubmit={handleFilterSubmit} className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Filter Events</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Clear Filters
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-pulse text-lg">Loading events...</div>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-auto max-w-lg my-4">
                        <p className="font-medium">Error: {error}</p>
                        <button 
                            className="mt-2 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded text-sm"
                            onClick={() => window.location.reload()}>
                            Try Again
                        </button>
                    </div>
                )}
                
                {!isLoading && !error && events.length === 0 && (
                    <div className="text-center text-gray-500 py-12">No events found</div>
                )}
                
                {!isLoading && !error && events.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {events.map((event) => (
                            <EventCard
                                key={event._id}
                                date={new Date(event.local_start_date).toLocaleDateString()}
                                event_id={event.id}
                                location={event.location}
                                name={event.name}
                                ends_at={event.local_end_date}
                                registration_url={event.registration_url}
                                public_information={event.public_information}
                                categories={event.dcats ? event.dcats.map(dcat => ({
                                    dcat_id: dcat.dcat_id,
                                    event_id: dcat.event_id,
                                    dcat_name: dcat.dcat_name,
                                    status: dcat.status
                                })) : []}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Events;