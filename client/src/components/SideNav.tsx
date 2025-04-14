
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
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-10 0a1 1 0 001 1h6a1 1 0 001-1m-7-1h6"></path></svg>
            <span>Home</span>
          </li>
          <li className="mb-4">Upcoming Events</li>
          <li className="mb-4">My Picks</li>
          <li className="mb-4">Leaderboards</li>
          <li className="mb-4">Profile</li>
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
