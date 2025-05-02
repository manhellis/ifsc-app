import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@headlessui/react';

interface EventCardProps {
    date: string;
    categories: {
        dcat_id: number;
        event_id: number;
        dcat_name: string;
        status: string;
    }[];
    location: string;
    event_id: number;
    name?: string;
    ends_at?: string;
    registration_url?: string;
    public_information?: {
        infosheet_url?: string;
    };
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'registration_active':
            return 'bg-purple-600 hover:bg-purple-700 text-white';
        case 'registration_pending':
            return 'bg-yellow-600 hover:bg-yellow-700 text-white';
        case 'active':
            return 'bg-blue-600 hover:bg-blue-700 text-white';
        case 'finished':
            return 'bg-green-600 hover:bg-green-700 text-white';
        default:
            return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
};

const EventCard: React.FC<EventCardProps> = ({
    date,
    location,
    categories,
    event_id,
    name,
    ends_at,
    registration_url,
    public_information,
}) => {
    const navigate = useNavigate();
    
    // Check if the event is currently happening
    const isEventLive = () => {
        const today = new Date();
        const startDate = new Date(date);
        const endDate = ends_at ? new Date(ends_at) : new Date(date);
        
        // Set times to beginning and end of day for accurate comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return today >= startDate && today <= endDate;
    };

    return (
        <div 
            className="w-full rounded-xl overflow-hidden bg-white shadow cursor-hover:shadow-lg transition-shadow duration-200 group relative"
            onClick={() => navigate(`/dashboard/events/${event_id}`)}
        >
            {isEventLive() && (
                <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 z-10">
                    <span className="w-2 h-2 mr-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    Live
                </span>
            )}
            <div className="bg-white/80 backdrop-blur-sm p-4 md:p-8 flex flex-col justify-center">
                {name && <h2 className="text-3xl md:text-5xl font-normal mb-2">{name}</h2>}
                <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl text-gray-600 font-normal mb-2 md:mb-4">{location}</h3>
                </div>
                <p className="text-lg md:text-2xl mb-4 md:mb-6">
                    {date.replace(/-/g, " ")}
                    {ends_at && ` - ${new Date(ends_at).toLocaleDateString()}`}
                </p>
                <div className="space-y-1 md:space-y-2">
                    {categories.map((category, index) => (
                        <div key={index} className="text-base md:text-xl">
                            <Button
                                as="a"
                                href={category.status === 'registration_active' || category.status === 'registration_pending' 
                                    ? `/dashboard/upcoming/${event_id}/${category.dcat_id}`
                                    : `/dashboard/results/${event_id}/${category.dcat_id}`}
                                className={`${getStatusColor(category.status)} py-1 px-3 rounded-md inline-block transition-colors duration-200 data-hover:opacity-90 data-active:opacity-100`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                {category.dcat_name}
                            </Button>
                        </div>
                    ))}
                </div>
                {/* <div className="flex flex-wrap gap-3 mt-4">
                    {registration_url && (
                        <a 
                            href={registration_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Registration
                        </a>
                    )}
                    {public_information?.infosheet_url && (
                        <a 
                            href={public_information.infosheet_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Info Sheet
                        </a>
                    )}
                </div> */}
            </div>
        </div>
    );
};

export default EventCard; 