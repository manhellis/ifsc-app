import { useAuth } from "../../contexts/AuthContext";
import  placeholderImg from "../../assets/event_card_image.jpg";
interface ScoreCardProps {
    name: string;
    points: number;
    location: string;
    pointsGained: number;
}
interface EventCardProps {
    date: string;
    location: string;
    categories: string[];
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

const EventCard: React.FC<EventCardProps> = ({
    date,
    location,
    categories,
}) => {
    return (
        // On mobile: image on top, then text
        // On desktop (md+): image on the left (50%) and text on the right (50%)
        <div className="flex flex-col md:flex-row w-full rounded-xl overflow-hidden bg-white shadow">
            {/* Image Section */}
            <div
                className="w-full h-[200px] md:h-auto md:w-1/2 bg-cover bg-center"
                style={{ backgroundImage: `url(${placeholderImg})` }}
            />

            {/* Text Section */}
            <div className="w-full md:w-1/2 bg-white/80 backdrop-blur-sm p-4 md:p-8 flex flex-col justify-center">
                <h2 className="text-3xl md:text-5xl font-normal mb-2 md:mb-4">{location}</h2>
                <p className="text-lg md:text-2xl mb-4 md:mb-6">{date.replace(/-/g, " ")}</p>
                <div className="space-y-1 md:space-y-2">
                    {categories.map((category, index) => (
                        <div key={index} className="text-base md:text-xl">
                            {category}
                        </div>
                    ))}
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

    const upcomingEvents = [
        {
            name: "World Cup 2025",
            date: "2025-04-20-23",
            location: "Seoul",
            pointsGained: 341,
            categories: [
                "BOULDER Men",
                "BOULDER Women",
                "LEAD Women",
                "LEAD Men",
            ],
        },
        {
            name: "National Championship 2025",
            date: "2025-05-15-18",
            location: "Tokyo",
            pointsGained: 289,
            categories: [
                "SPEED Men",
                "SPEED Women",
                "BOULDER Men",
                "BOULDER Women",
            ],
        },
        {
            name: "Continental Cup 2025",
            date: "2025-06-10-12",
            location: "Paris",
            pointsGained: 312,
            categories: ["LEAD Men", "LEAD Women", "SPEED Men", "SPEED Women"],
        },
        {
            name: "Regional Open 2025",
            date: "2025-07-05-07",
            location: "New York",
            pointsGained: 275,
            categories: [
                "BOULDER Men",
                "BOULDER Women",
                "LEAD Men",
                "LEAD Women",
            ],
        },
        {
            name: "City Climbing Challenge 2025",
            date: "2025-08-20-22",
            location: "London",
            pointsGained: 298,
            categories: [
                "SPEED Men",
                "SPEED Women",
                "BOULDER Men",
                "BOULDER Women",
            ],
        },
    ];

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
                <div className="flex flex-col gap-4">
                    {upcomingEvents.map((event, index) => (
                        <EventCard
                            key={index}
                            date={event.date}
                            location={event.location}
                            categories={event.categories}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
