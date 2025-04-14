import { Calendar, Home, Trophy, User, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
const SideNav = () => {
  return (
    <div className="bg-gray-400 h-full p-4">
      <div className="flex items-center mb-6">
        <div className="bg-gray-400 rounded-full w-10 h-10 mr-2"></div>
        <span className="font-semibold">Manh Ellis</span>
        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      <nav>
        <ul>
          <li className="flex items-center mb-4">
            <Link to="/dashboard" className="flex items-center">
              <Home className="w-5 h-5 mr-2" />
              <span>Home</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link to="/dashboard/events" className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Upcoming Events</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link to="/dashboard/my-picks" className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              <span>My Picks</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link to="/dashboard/leaderboards" className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              <span>Leaderboards</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link to="/dashboard/profile" className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <span>Profile</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link to="/dashboard/league" className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>League</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-6">
        <h2 className="font-bold mb-4">My Leagues</h2>
        <ul>
          <li className="mb-4">Plastic Weekly</li>
          <li className="mb-4">Comp Team</li>
        </ul>
      </div>
      <div className="mt-6">
        <span>Create a League</span>
      </div>
    </div>
  );
};

export default SideNav;
