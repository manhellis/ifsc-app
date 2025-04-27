import { useAuth } from "../../contexts/AuthContext";
import React, { useState, useEffect } from 'react';
import { Event } from '../../../../shared/types/events';
import { eventsApi } from '../../api';
import EventCard from '../../components/EventCard';

interface ScoreCardProps {
    name: string;
    points: number;
    location: string;
    pointsGained: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
    name,
    points,
    location,
    pointsGained,
}) => {
    return (
        <div className="bg-gray-100 p-2 sm:p-4 rounded-xl flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:items-center sm:space-x-2 min-w-[200px] md:min-w-[250px]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full hidden sm:block"></div>
            <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between text-base sm:text-lg font-normal space-y-1 lg:space-y-0">
                    <span>{name}</span>
                    <span>{points}pts</span>
                </div>
                <div className="flex items-center justify-between space-x-2 mt-1">
                    <span className="text-xs sm:text-sm break-words">
                        {location} +{pointsGained}
                    </span>
                    <span className="text-lg" role="img" aria-label="medal">
                        🥇
                    </span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();

    const topScores = [
        {
            name: "Alice Johnson",
            points: 950,
            location: "New York",
            pointsGained: 200,
        },
        {
            name: "Bob Brown",
            points: 870,
            location: "Los Angeles",
            pointsGained: 180,
        },
        {
            name: "Charlie Davis",
            points: 1020,
            location: "Chicago",
            pointsGained: 220,
        },
        {
            name: "Diana Evans",
            points: 1100,
            location: "Houston",
            pointsGained: 300,
        },
        {
            name: "Ethan Foster",
            points: 980,
            location: "Phoenix",
            pointsGained: 250,
        },
        {
            name: "Fiona Green",
            points: 1050,
            location: "Philadelphia",
            pointsGained: 270,
        },
    ];

    const [events, setEvents] = useState<Event[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
    const [eventsError, setEventsError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
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
        fetchUpcomingEvents();
    }, [user]);

    return (
        <div className="flex flex-col h-full py-6">
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
            {/* <div className="flex space-x-4 overflow-x-auto flex-nowrap">
                {topScores.map((score, index) => (
                    <ScoreCard
                        key={index}
                        name={score.name}
                        points={score.points}
                        location={score.location}
                        pointsGained={score.pointsGained}
                    />
                ))}
            </div> */}

            <h2 className="text-2xl sm:text-3xl mt-2 mb-1 sm:mt-8 sm:mb-4">Upcoming Events</h2>
            <div className="flex-1 overflow-y-auto pr-2">
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
    );
};

export default Dashboard;
