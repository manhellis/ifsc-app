import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../../../shared/types/events';
import { eventsApi } from '../../api';

const Events: React.FC = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

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
        setStartDate('');
        setEndDate('');
        // Fetch events without filters
        fetchEvents();
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Checking authentication...</div>;
    }
    
    if (!user) {
        return <div className="flex justify-center items-center min-h-screen">Please log in to view events</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">Events</h1>
            
            {/* Date filter form */}
            <div className="mb-8 max-w-2xl mx-auto">
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
                                onChange={(e) => setStartDate(e.target.value)}
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
                                onChange={(e) => setEndDate(e.target.value)}
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
            
            {events.length > 0 && (
                <div className="flex flex-col gap-6 overflow-y-auto max-h-screen">
                    {events.map((event) => (
                        <div key={event._id} className="w-full">
                            <h2 className="text-xl font-semibold mb-2 text-left">{event.name}</h2>
                            <div className="bg-white shadow-md rounded-2xl p-5 border border-gray-200">
                                <p className="mb-2"><span className="font-medium">Location:</span> {event.location}</p>
                                <p className="mb-2"><span className="font-medium">Starts:</span> {new Date(event.starts_at).toLocaleDateString()}</p>
                                <p className="mb-4"><span className="font-medium">Ends:</span> {new Date(event.ends_at).toLocaleDateString()}</p>
                                
                                {/* Disciplines and Categories Section */}
                                {event.dcats && event.dcats.length > 0 && (
                                    <div className="mt-4 mb-4">
                                        <h3 className="font-medium text-gray-700 mb-2">Disciplines & Categories:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {event.dcats.map((dcat, index) => (
                                                <span 
                                                    key={index} 
                                                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200"
                                                >
                                                    {dcat.dcat_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {event.registration_url && (
                                        <a 
                                            href={event.registration_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors">
                                            Registration
                                        </a>
                                    )}
                                    {event.public_information?.infosheet_url && (
                                        <a 
                                            href={event.public_information.infosheet_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition-colors">
                                            Info Sheet
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Events;