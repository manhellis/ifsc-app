import React from "react";
import { Link } from "react-router-dom";
const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative h-[80vh] overflow-hidden">
                {/* Semi-transparent overlay */}
                <div className="absolute inset-0  bg-opacity-30 backdrop-filter  z-10"></div>

                {/* Centered question mark */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <img src="/question.svg" className="w-32 h-32 mb-36" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-between items-center py-12 z-20">
                    <div className="text-center text-white px-4 max-w-3xl rounded-lg">
                        <h1 className="text-5xl font-bold my-8">
                            Fantasy Sports, Finally for Climbing.
                        </h1>
                    </div>
                    <div className="text-center text-white px-4 max-w-3xl rounded-lg translate-y-10">
                        <h2 className="text-2xl mb-8 text-white drop-shadow-lg [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                            Pick the podium before each IFSC event and see how
                            you stack up against your friends
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center mb-8">
                        <Link
                            to="/dashboard"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/how-it-works"
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
                        >
                            How It Works
                        </Link>
                    </div>
                </div>
                <img
                    src="/tokyo_podium-2.webp"
                    alt="Tokyo Podium"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <div className="h-16 w-16 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Create Predictions
                        </h3>
                        <p className="text-gray-600">
                            Select the top three finishers for each upcoming
                            event and earn points if you're right.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <div className="h-16 w-16 bg-green-100 rounded-lg mb-4 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Join Leagues
                        </h3>
                        <p className="text-gray-600">
                            Compete against friends or the global climbing
                            community in public or private leagues.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <div className="h-16 w-16 bg-yellow-100 rounded-lg mb-4 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-yellow-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Track Leaderboards
                        </h3>
                        <p className="text-gray-600">
                            Follow live rankings, watch your score climb, and
                            claim your spot at the top.
                        </p>
                    </div>
                </div>
            </div>

            {/* Points System */}
            <div className="bg-gray-100 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-10">
                        Points System
                    </h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
                        <div className="flex-1 max-w-xs">
                            <div className="bg-yellow-500 text-white p-6 rounded-t-lg text-center">
                                <div className="text-4xl font-bold">2nd</div>
                                <div className="text-xl mt-2">+15 Points</div>
                            </div>
                        </div>
                        <div className="flex-1 max-w-xs -mt-4 md:mt-0 md:-mb-8">
                            <div className="bg-blue-600 text-white p-8 rounded-t-lg text-center">
                                <div className="text-5xl font-bold">1st</div>
                                <div className="text-2xl mt-2">+20 Points</div>
                            </div>
                        </div>
                        <div className="flex-1 max-w-xs">
                            <div className="bg-orange-500 text-white p-6 rounded-t-lg text-center">
                                <div className="text-4xl font-bold">3rd</div>
                                <div className="text-xl mt-2">+10 Points</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center max-w-2xl mx-auto">
                        {/* <p className="mb-2">
                            <strong>Correct Athlete, Wrong Place:</strong> +1
                            Point
                        </p> */}
                        <p className="mb-4">
                            Scoring rules may evolve as we roll out more game
                            modes—stay tuned for head-to-head matchups, streak
                            bonuses, and more!
                        </p>
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            More scoring types coming soon!
                        </span>
                    </div>
                </div>
            </div>
            {/* Upcoming Events Preview */}
            {/* <div className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-10">
                    Upcoming Events
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="h-40 bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-500">
                                    Event Image
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1">
                                IFSC World Cup - Boulder
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                                June 10-12, 2023 • Tokyo, Japan
                            </p>
                            <Link
                                to="/predictions/event-1"
                                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Make Your Prediction
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="h-40 bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-500">
                                    Event Image
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1">
                                IFSC World Cup - Lead
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                                June 24-26, 2023 • Chamonix, France
                            </p>
                            <Link
                                to="/predictions/event-2"
                                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Make Your Prediction
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="h-40 bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-500">
                                    Event Image
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1">
                                IFSC World Cup - Speed
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                                July 8-10, 2023 • Salt Lake City, USA
                            </p>
                            <Link
                                to="/predictions/event-3"
                                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Make Your Prediction
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="h-40 bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-500">
                                    Event Image
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1">
                                IFSC World Championship
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                                August 1-5, 2023 • Bern, Switzerland
                            </p>
                            <Link
                                to="/predictions/event-4"
                                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Make Your Prediction
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-gray-600 italic">
                        Don't see your region? Create a private league and
                        invite friends!
                    </p>
                </div>
            </div> */}
        </div>
    );
};

export default Home;
