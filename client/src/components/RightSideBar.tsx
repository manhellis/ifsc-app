import { Input } from "@headlessui/react";
import { Search } from "lucide-react";

const RightSideBar = () => {
    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full max-w-sm mb-12">
                <Input
                    type="text"
                    placeholder="Search"
                    className="w-full px-4 py-2 border-b-2 border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-gray-400"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            </div>
            <div className="flex flex-col gap-2 bg-gray-300 mb-4">
                <span className="text-lg ">My Points</span>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500">Points</span>
                        <span className="text-sm text-gray-500">Points</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 ">
                <span className="text-lg ">Calendar</span>
                <div className="h-60 w-full bg-gray-400"></div>
            </div>
            <div className="flex flex-col gap-2 ">
                <span className="text-lg ">Upcoming Events</span>
                <div className="flex flex-row gap-2 bg-gray-300 p-2">
                    <div className="flex flex-col gap-2 w-1/2">
                        <span className="text-xl">Seoul 2025</span>
                        <span className="">BOULDER Mens</span>
                        <span className="bg-teal-200 rounded-lg px-2 py-0.5">
                            Prediction Saved
                        </span>
                    </div>
                    <div className="flex flex-col gap-2 w-1/2">
                        <span className="border-b-2 border-gray-500">Your Picks</span>
                        <span className="">🥇 Adam Ondra</span>
                        <span className="">🥈 Tomoa Narasaki</span>
                        <span className="">🥉 Sorato Anraku</span>

                    </div>
                </div>
                    
            </div>
        </div>
    );
};

export default RightSideBar;
