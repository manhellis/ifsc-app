import { Calendar, Home, Trophy, User, Users, Star, LogOut, Settings, Plus ,PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { leagueApi, League } from "../api/leagues";

const SideNav = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sideNavRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // Set collapsed state based on screen size by default
      setIsCollapsed(isMobileView);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchUserLeagues = async () => {
      if (!user) return; // Only fetch if user is logged in
      
      setIsLoading(true);
      try {
        const { leagues } = await leagueApi.getMyLeagues();
        setUserLeagues(leagues);
      } catch (error) {
        console.error("Failed to fetch user leagues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLeagues();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // If mobile and sidebar is EXPANDED (not collapsed), render as a full-screen overlay
  if (isMobile && !isCollapsed) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-gray-400 w-full h-full p-4 max-w-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <img src="/logo.svg" className="w-10 h-10 mr-2" />
              <div className="flex flex-col items-start">
                <h1 className="text-xl font-bold">CompBeta</h1>
                <h2 className="text-lg">.Rocks</h2>
              </div>
            </div>
            <button onClick={toggleSidebar} className="focus:outline-none">
              <PanelLeftClose className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="mb-6">
            <ul>
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <Home className="w-5 h-5" />
                  <span className="ml-2">Home</span>
                </Link>
              </li>
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard/events" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard/events') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="ml-2">Events</span>
                </Link>
              </li>
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard/my-picks" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard/my-picks') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <Star className="w-5 h-5" />
                  <span className="ml-2">My Picks</span>
                </Link>
              </li>
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard/leaderboards" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard/leaderboards') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <Trophy className="w-5 h-5" />
                  <span className="ml-2">Leaderboards</span>
                </Link>
              </li>
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard/profile" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard/profile') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <User className="w-5 h-5" />
                  <span className="ml-2">Profile</span>
                </Link>
              </li>
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard/leagues" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard/leagues') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <Users className="w-5 h-5" />
                  <span className="ml-2">Leagues</span>
                </Link>
              </li>
            {user?.accountType === 'admin' && (
              <li className="flex items-center mb-4">
                <Link 
                  to="/dashboard/settings" 
                  className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                    isActive('/dashboard/settings') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
                  }`}
                  onClick={() => setIsCollapsed(true)}
                >
                  <Settings className="w-5 h-5" />
                  <span className="ml-2">Settings</span>
                </Link>
              </li>
            )}
            </ul>
          </nav>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 rounded-lg text-sm hover:bg-gray-300/50 mb-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={sideNavRef}
      className={`bg-gray-400 h-full p-4 transition-all duration-300 ${
        isCollapsed && !isMobile ? 'w-16' : isMobile ? 'w-16' : 'min-w-[14rem] w-auto'
      }`}
    >
      <div className={`flex ${isCollapsed || isMobile ? 'flex-col' : 'flex-row'} items-center ${isCollapsed || isMobile ? 'gap-4' : 'justify-between'} mb-6`}>
        {(isCollapsed || isMobile) && (
          <button 
            onClick={toggleSidebar} 
            className="focus:outline-none p-1 rounded-full hover:bg-gray-300/50 transition-colors cursor-pointer"
          >
            {isMobile && isCollapsed ? 
              <PanelLeftOpen className="w-5 h-5" /> : 
              (!isMobile && isCollapsed) ? 
                <PanelLeftOpen className="w-5 h-5" /> : 
                <PanelLeftClose className="w-5 h-5" />
            }
          </button>
        )}
        
        {!isCollapsed && !isMobile && (
          <>
            <img src="/logo.svg" className="w-10 h-10" />
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-bold">CompBeta</h1>
              <h2 className="text-lg">.Rocks</h2>
            </div>
          </>
        )}
        {(isCollapsed || isMobile) && <img src="/logo.svg" className="w-10 h-10 mx-auto" />}
        
        {!isCollapsed && !isMobile && (
          <button 
            onClick={toggleSidebar} 
            className="focus:outline-none p-1 rounded-full hover:bg-gray-300/50 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {!isCollapsed && !isMobile && (
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
                  <LogOut className="w-4 h-4" />
                  <span className="ml-2">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {(isCollapsed || isMobile) && (
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white rounded-full w-10 h-10 mb-2"></div>
        </div>
      )}
      
      <nav>
        <ul>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Home className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">Home</span>}
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/events" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard/events') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">Events</span>}
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/my-picks" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard/my-picks') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Star className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">My Picks</span>}
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/leaderboards" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard/leaderboards') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Trophy className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">Leaderboards</span>}
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/profile" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard/profile') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <User className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">Profile</span>}
            </Link>
          </li>
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/leagues" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard/leagues') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Users className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">Leagues</span>}
            </Link>
          </li>
        {user?.accountType === 'admin' && (
          <li className="flex items-center mb-4">
            <Link 
              to="/dashboard/settings" 
              className={`flex items-center ${isCollapsed || isMobile ? 'justify-center' : 'w-full'} p-2 rounded-lg transition-colors ${
                isActive('/dashboard/settings') ? 'bg-gray-300 text-gray-800' : 'hover:bg-gray-300/50'
              }`}
            >
              <Settings className="w-5 h-5" />
              {!isCollapsed && !isMobile && <span className="ml-2">Settings</span>}
            </Link>
          </li>
        )}
        </ul>
      </nav>
      
      {!isCollapsed && !isMobile && (
        <>
          <div className="mt-6">
            <h2 className="font-bold mb-4">My Leagues</h2>
            {isLoading ? (
              <div className="text-sm text-gray-600">Loading leagues...</div>
            ) : userLeagues.length > 0 ? (
              <ul>
                {userLeagues.map(league => (
                  <li key={league._id} className="mb-4">
                    <Link 
                      to={`/dashboard/league/${league.slug || league._id}`}
                      className="hover:underline block "
                      title={league.name}
                    >
                      {league.name}
                      {league.isAdmin && <span className="ml-1 text-xs text-gray-600">(Admin)</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">You are not in any leagues yet</div>
            )}
          </div>
          {/* <div className="mt-6">
          coming soon :D
            <Link 
              to="/dashboard/create-league" 
              className={`flex items-center w-full p-2 rounded-lg transition-colors hover:bg-gray-300/50`}
            >
              <Plus className="w-5 h-5" />
              <span className="ml-2">Create a League</span>
            </Link>
          </div> */}
        </>
      )}
      
      {(isCollapsed || isMobile) && (
        <div className="mt-6 flex flex-col items-center">
          <Link 
            to="/dashboard/leagues"
            className="p-2 rounded-lg hover:bg-gray-300/50 mb-4"
            title="My Leagues"
          >
            <Users className="w-5 h-5" />
          </Link>
          {/* <Link 
            to="/dashboard/create-league"
            className="p-2 rounded-lg hover:bg-gray-300/50"
            title="Create a League"
          >
            <Plus className="w-5 h-5" />
          </Link> */}
        </div>
      )}
    </div>
  );
};

export default SideNav;
