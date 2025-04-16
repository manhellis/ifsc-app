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

            <h2 className="text-2xl sm:text-3xl mt-8 mb-1">Top Scores</h2>
            <div className="flex space-x-4 overflow-x-auto flex-nowrap">
                {topScores.map((score, index) => (
                    <ScoreCard
                        key={index}
                        name={score.name}
                        points={score.points}
                        location={score.location}
                        pointsGained={score.pointsGained}
                    />
                ))}
            </div>

            <h2 className="text-2xl sm:text-3xl mt-8 mb-4">Upcoming Events</h2>
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
                      date={new Date(event.starts_at).toLocaleDateString()}
                      event_id={event.id}
                      location={event.location}
                      name={event.name}
                      ends_at={event.ends_at}
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
