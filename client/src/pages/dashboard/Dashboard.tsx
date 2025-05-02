import { useAuth } from "../../contexts/AuthContext";
import React, { useState, useEffect } from 'react';
import { Event } from '../../../../shared/types/events';
import { eventsApi } from '../../api';
import EventCard from '../../components/EventCard';

const Dashboard = () => {
    const { user } = useAuth();

    const [events, setEvents] = useState<Event[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
    const [eventsError, setEventsError] = useState<string | null>(null);
    
    const [recentEvents, setRecentEvents] = useState<Event[]>([]);
    const [isLoadingRecentEvents, setIsLoadingRecentEvents] = useState<boolean>(false);
    const [recentEventsError, setRecentEventsError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        
        // Fetch upcoming events
        const fetchUpcomingEvents = async () => {
            setIsLoadingEvents(true);
            setEventsError(null);
            try {
                const data = await eventsApi.fetchUpcomingEvents();
                setEvents(data.events || []);
            } catch (err) {
                setEventsError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error('Failed to fetch upcoming events:', err);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        
        // Fetch recent events (current year up to today)
        const fetchRecentEvents = async () => {
            setIsLoadingRecentEvents(true);
            setRecentEventsError(null);
            try {
                const data = await eventsApi.fetchRecentEvents();
                setRecentEvents(data.events || []);
            } catch (err) {
                setRecentEventsError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error('Failed to fetch recent events:', err);
            } finally {
                setIsLoadingRecentEvents(false);
            }
        };
        
        fetchUpcomingEvents();
        fetchRecentEvents();
    }, [user]);

    return (
        <div className="flex flex-col h-full overflow-y-auto py-6">
            <h1 className="text-4xl sm:text-6xl text-left font-normal">
                Welcome, {user?.name || "Guest"}
            </h1>
            <h2 className="text-xl sm:text-2xl text-left mt-2 text-gray-800">
                Today is{" "}
                {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })}
            </h2>

            <h2 className="text-2xl sm:text-3xl mt-2 mb-1 sm:mt-8 sm:mb-4">Top Scores</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-1">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Coming Soon:</span> Top scores and leaderboard features will be available in the next update.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-6">
                <div className="w-full lg:w-1/2">
                    <h2 className="text-2xl sm:text-3xl mt-2 mb-1 sm:mt-8 sm:mb-4">Recent Events</h2>
                    <div className="mb-8 lg:mb-0">
                      {isLoadingRecentEvents && <div className="text-center">Loading recent events...</div>}
                      {recentEventsError && <div className="text-center text-red-500">Error: {recentEventsError}</div>}
                      {!isLoadingRecentEvents && !recentEventsError && recentEvents.length === 0 && (
                          <div className="text-center">No recent events found for this year</div>
                      )}
                      {!isLoadingRecentEvents && !recentEventsError && recentEvents.length > 0 && (
                        <div className="flex flex-col gap-4">
                          {recentEvents.map((event) => (
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
                
                <div className="w-full lg:w-1/2">
                    <h2 className="text-2xl sm:text-3xl mt-2 mb-1 sm:mt-8 sm:mb-4">Upcoming Events</h2>
                    <div>
                      {isLoadingEvents && <div className="text-center">Loading upcoming events...</div>}
                      {eventsError && <div className="text-center text-red-500">Error: {eventsError}</div>}
                      {!isLoadingEvents && !eventsError && events.length === 0 && (
                          <div className="text-center">No upcoming events found</div>
                      )}
                      {!isLoadingEvents && !eventsError && events.length > 0 && (
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
            </div>
        </div>
    );
};

export default Dashboard;
