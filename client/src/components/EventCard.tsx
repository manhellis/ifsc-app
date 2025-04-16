import React from 'react';
import { useNavigate } from 'react-router-dom';
import placeholderImg from "../assets/event_card_image.jpg";

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
            return 'text-purple-600 hover:text-purple-700';
        case 'registration_pending':
            return 'text-yellow-600 hover:text-yellow-700';
        case 'active':
            return 'text-blue-600 hover:text-blue-700';
        case 'finished':
            return 'text-green-600 hover:text-green-700';
        default:
            return 'text-gray-600 hover:text-gray-700';
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

    return (
        <div 
            className="flex flex-col md:flex-row w-full rounded-xl overflow-hidden bg-white shadow cursor-hover:shadow-lg transition-shadow duration-200 group"
            onClick={() => navigate(`/dashboard/events/${event_id}`)}
        >
            <div
                className="w-full h-[200px] md:h-auto md:w-1/2 bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: `url(${placeholderImg})` }}
            >
                <div className="w-full h-full bg-cover bg-center transition-transform duration-300 ease-in-out group-hover:scale-110"
                     style={{ backgroundImage: `url(${placeholderImg})` }}></div>
            </div>

            <div className="w-full md:w-1/2 bg-white/80 backdrop-blur-sm p-4 md:p-8 flex flex-col justify-center">
                {name && <h2 className="text-2xl md:text-3xl font-normal mb-2">{name}</h2>}
                <h3 className="text-3xl md:text-5xl font-normal mb-2 md:mb-4">{location}</h3>
                <p className="text-lg md:text-2xl mb-4 md:mb-6">{date.replace(/-/g, " ")}</p>
                {ends_at && (
                    <p className="text-lg md:text-2xl mb-4 md:mb-6">Ends: {new Date(ends_at).toLocaleDateString()}</p>
                )}
                <div className="space-y-1 md:space-y-2">
                    {categories.map((category, index) => (
                        <div key={index} className="text-base md:text-xl">
                            <a
                                href={category.status === 'registration_active' || category.status === 'registration_pending' 
                                    ? `/dashboard/upcoming/${event_id}/${category.dcat_id}`
                                    : `/dashboard/results/${event_id}/${category.dcat_id}`}
                                className={`${getStatusColor(category.status)} transition-colors duration-200`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                {category.dcat_name}
                            </a>
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
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
                </div>
            </div>
        </div>
    );
};

export default EventCard; 