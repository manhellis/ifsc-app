import { Calendar, Home, Trophy, User, Users, Star, LogOut, Settings, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SideNav = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-gray-400 h-full p-4">
      <div className="flex items-center mb-6 relative">
        <div className="bg-white rounded-full w-10 h-10 mr-2"></div>
        <span className="font-semibold">{user?.name}</span>
        <div className="relative ml-auto">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="focus:outline-none p-1 rounded-full hover:bg-gray-300/50 transition-colors cursor-pointer"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
              <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {user?.accountType}
              </div>
            </div>
          )}
        </div>
      </div>
      <nav>
        <ul>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Home className="w-5 h-5 mr-2" />
              <span>Home</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/events" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard/events') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Calendar className="w-5 h-5 mr-2" />
              <span>Events</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/my-picks" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard/my-picks') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Star className="w-5 h-5 mr-2" />
              <span>My Picks</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/leaderboards" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard/leaderboards') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Trophy className="w-5 h-5 mr-2" />
              <span>Leaderboards</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/profile" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard/profile') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <User className="w-5 h-5 mr-2" />
              <span>Profile</span>
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/leagues" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard/leagues') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              <span>Leagues</span>
            </Link>
          </li>
        {user?.accountType === 'admin' && (
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/settings" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                isActive('/dashboard/settings') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Settings className="w-5 h-5 mr-2" />
              <span>Settings</span>
            </Link>
          </li>
        )}
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
        <Link 
          to="/dashboard/create-league" 
          className={`flex items-center w-full p-2 rounded-lg transition-colors hover:bg-gray-300/50`}
        >
          <Plus className="w-5 h-5 mr-2" />
          <span>Create a League</span>
        </Link>
      </div>
    </div>
  );
};

export default SideNav;
