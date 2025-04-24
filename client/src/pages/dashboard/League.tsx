import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leagueApi } from "../../api";

// Define League interface matching expected API response structure
interface League {
  _id: string;
  name: string;
  type: "public" | "private";
  adminIds?: string[]; // Made optional based on linter error
  memberIds?: string[]; // Make optional based on linter error
  inviteCode?: string;
}

// Define LeagueMember interface
interface LeagueMember {
  _id: string;
  userName: string;
  avatarUrl?: string;
}

// Define Ranking interface
interface Ranking {
  userId: string;
  userName: string;
  avatarUrl?: string;
  eventResults: { eventName: string; points: number }[];
  totalPoints: number;
}

// Define PendingRequest interface
interface PendingRequest {
  _id: string; // Request ID
  userId: string;
  userName: string;
  avatarUrl?: string;
  createdAt: string;
}

const LeaguePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // TODO: replace with your auth/user context hook
  const currentUserId = "CURRENT_USER_ID"; // Replace with actual user ID from context

  const [league, setLeague] = useState<League | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [pendingLeagueIds, setPendingLeagueIds] = useState<string[]>([]); // State for IDs of leagues with pending requests for the user
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!slug) {
        setError("League slug is missing.");
        setIsLoading(false);
        return;
    };

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Explicitly check slug type before API call
        if (typeof slug === 'string') {
          const { league: fetchedLeague } = await leagueApi.getLeagueBySlug(slug);
          setLeague(fetchedLeague);

          const isAdminUser = !!fetchedLeague.adminIds?.includes(currentUserId);
          setIsAdmin(isAdminUser);

          // Fetch leaderboard using league._id
          const board = await leagueApi.getLeagueLeaderboard(fetchedLeague._id);
          setRankings(board);

          // Fetch league members
          try {
            // This is a placeholder - you should implement or use the actual API endpoint
            // that returns league members with details like username and avatar
            const membersResponse = await fetch(`/api/leagues/${fetchedLeague._id}/members`);
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              setMembers(membersData.members);
            }
          } catch (err) {
            console.error("Failed to load league members:", err);
          }

          // Fetch pending requests if the user is an admin
          if (isAdminUser) {
            try {
              // Assume there's an API endpoint to get pending requests for a specific league
              const pendingResponse = await fetch(`/api/leagues/${fetchedLeague._id}/pending-requests`);
              if (pendingResponse.ok) {
                const pendingData = await pendingResponse.json();
                setPendingRequests(pendingData.requests);
              }

              // Also fetch the leagues with pending requests for the sidebar indicator
              const pendingInfo = await leagueApi.getMyPendingRequests();
              // Ensure response structure is as expected before setting state
              if (pendingInfo && Array.isArray(pendingInfo.pendingLeagueIds)) {
                  setPendingLeagueIds(pendingInfo.pendingLeagueIds);
              } else {
                  console.warn("Unexpected response structure from getMyPendingRequests:", pendingInfo);
                  setPendingLeagueIds([]);
              }
            } catch (err) {
              console.error("Failed to load pending requests info:", err);
              setPendingLeagueIds([]); // Clear on error
            }
          }
        } else {
            // This case should technically not be reachable due to the earlier !slug check
            setError("Invalid league slug provided.");
            setIsLoading(false);
            return; // Exit fetchData early
        }
      } catch (err) {
        console.error("Failed to load league data:", err);
        setError("Failed to load league data. It might not exist or you may not have access.");
        setLeague(null); // Clear league data on error
        setRankings([]);
        setMembers([]);
        setPendingRequests([]);
        setPendingLeagueIds([]); // Clear pending IDs on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [slug, currentUserId]); // Add currentUserId dependency

  const handleTogglePrivacy = async () => {
    if (!league || !isAdmin) return;
    const newType = league.type === "private" ? "public" : "private";
    try {
      await leagueApi.toggleLeaguePrivacy(league._id, newType);
      setLeague((prevLeague) => prevLeague ? { ...prevLeague, type: newType } : null);
    } catch (err) {
      console.error("Failed to toggle privacy:", err);
    }
  };

  const handleInvite = async () => {
     if (!league || !isAdmin) return;
    const invitedUserId = prompt("Enter user ID to invite:"); // Consider a better UI than prompt
    if (!invitedUserId) return;
    try {
      // Assuming createLeagueInvitation returns useful info
      await leagueApi.createLeagueInvitation(league._id, invitedUserId);
      // Use response data if available, otherwise a generic message
      // toast.success(response?.invitationId ? `Invitation created: ${response.invitationId}` : "Invitation sent successfully."); // Removed toast
    } catch (err: unknown) { // Changed to unknown for type safety
      console.error("Failed to invite user:", err);
      let errorMessage = "Failed to send invitation.";
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorResponse = (err as { response: { data?: { message?: string } } }).response;
        if (errorResponse?.data?.message) {
          errorMessage = errorResponse.data.message;
        }
      }
      console.error("Invite Error:", errorMessage);
    }
  };

  const handleRemove = async (userIdToRemove: string) => {
    if (!league || !isAdmin || userIdToRemove === currentUserId) return; // Admins cannot remove themselves this way
    if (window.confirm(`Remove ${rankings.find(r => r.userId === userIdToRemove)?.userName || 'this member'} from the league?`)) {
      try {
        await leagueApi.removeMember(league._id, userIdToRemove);
        // Refetch rankings or optimistically update state
        setRankings((prev) => prev.filter((r) => r.userId !== userIdToRemove));
        setMembers((prev) => prev.filter((m) => m._id !== userIdToRemove));
      } catch (err) {
        console.error("Failed to remove member:", err);
      }
    }
  };

  const handleLeave = async () => {
    if (!league || isAdmin) return; // Prevent admins from leaving via this button? Or add extra confirmation.
    if (window.confirm("Are you sure you want to leave this league?")) {
      try {
        await leagueApi.leaveLeague(league._id);
        navigate("/dashboard"); // Redirect after leaving
      } catch (err) {
        console.error("Failed to leave league:", err);
      }
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!league || !isAdmin) return;
    try {
      // This is a placeholder - you should implement or use the actual API endpoint
      await fetch(`/api/leagues/${league._id}/approve-request/${requestId}`, {
        method: 'POST',
      });
      // Optimistically update UI
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      console.error("Failed to approve request:", err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!league || !isAdmin) return;
    try {
      // This is a placeholder - you should implement or use the actual API endpoint
      await fetch(`/api/leagues/${league._id}/reject-request/${requestId}`, {
        method: 'POST',
      });
      // Optimistically update UI
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  if (isLoading) {
    return <div className="p-5 text-center">Loading League...</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-600">{error}</div>;
  }

  if (!league) {
    return <div className="p-5 text-center">League not found.</div>;
  }

  const isPrivate = league.type === "private";
  // Combine rankings and members data for a complete roster
  const allMembers = members.length > 0 ? members : rankings.map(r => ({ 
    _id: r.userId, 
    userName: r.userName,
    avatarUrl: r.avatarUrl
  }));

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-6">{league.name} ({league.type})</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content: Rankings and Pending Requests */}
        <div className="flex-grow flex flex-col gap-6">
          {/* Rankings Panel */}
          <div className="border-2 border-blue-500 bg-gray-50 p-4 rounded-md shadow">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">Rankings</h2>
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => navigate(`/dashboard/leaderboards/${league._id}`)}
                   className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                 >
                   View Full Leaderboard
                 </button>
                 {isAdmin && (
                    <label className="flex items-center cursor-pointer" onClick={handleTogglePrivacy}>
                        <input type="checkbox" checked={isPrivate} readOnly className="mr-2 h-4 w-4 accent-blue-600"/>
                        <span>Private League</span>
                         <span title="Administrator Control" className="ml-2 text-gray-500">⚙️</span>
                    </label>
                 )}
               </div>
            </div>
            {rankings.length > 0 ? (
              rankings.map((r) => (
                <div
                  key={r.userId}
                  className={`flex items-center mb-3 p-3 rounded-md ${r.userId === currentUserId ? "bg-blue-100 shadow-sm" : "bg-white"}`}
                >
                  <img
                    src={r.avatarUrl || "/placeholder.png"} // Use a default avatar
                    alt={r.userName}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <strong className="mr-4 min-w-[100px] truncate">{r.userName}</strong>
                  <div className="flex-wrap hidden sm:flex">
                    {r.eventResults.map((e) => (
                      <span key={e.eventName} className="text-sm text-gray-600 mr-3 whitespace-nowrap">
                        {e.eventName}: {e.points}pts
                      </span>
                    ))}
                  </div>
                  <span className="ml-auto font-semibold text-blue-700 whitespace-nowrap">{r.totalPoints} pts</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No rankings available yet.</p>
            )}
          </div>

          {/* Pending Requests Info Panel (Admin Only) */}
          {isAdmin && (
            <div className="border border-gray-300 bg-gray-50 p-4 rounded-md shadow">
              <h2 className="text-xl font-semibold mb-2">Pending Join Requests</h2>
              {pendingRequests.length > 0 ? (
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                      <div className="flex items-center">
                        <img
                          src={req.avatarUrl || "/placeholder.png"}
                          alt={req.userName}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div>
                          <p className="font-medium">{req.userName}</p>
                          <p className="text-xs text-gray-600">
                            Requested: {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(req._id)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingLeagueIds.includes(league._id) ? (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-md mb-2 shadow-sm">
                  <p className="font-medium">There are pending join requests for this league.</p>
                  <p className="text-sm">Loading request details...</p>
                </div>
              ) : (
                <p className="text-gray-500">No pending requests.</p>
              )}
            </div>
          )}
        </div>

        {/* Roster Panel */}
        <div className="w-full lg:w-64 bg-gray-100 p-4 rounded-md shadow flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Roster ({allMembers.length})</h2>
            {isAdmin && (
              <button
                onClick={handleInvite}
                title="Invite User"
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150"
              >
                ＋ Invite
              </button>
            )}
          </div>
          {allMembers.length > 0 ? (
            allMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center bg-white rounded-md p-2 mb-2 shadow-sm"
              >
                <img
                  src={member.avatarUrl || "/placeholder.png"}
                  alt={member.userName}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="flex-1 truncate text-sm">{member.userName}</span>
                {isAdmin && member._id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(member._id)}
                    title="Remove Member"
                    className="ml-2 text-red-500 hover:text-red-700 text-xs bg-transparent border-none cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                {member._id === currentUserId && !isAdmin && (
                  <button
                    onClick={handleLeave}
                    title="Leave League"
                    className="ml-2 text-gray-600 hover:text-gray-800 text-xs bg-transparent border-none cursor-pointer"
                  >
                    Leave
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No members yet.</p>
          )}
          {/* Add Leave button for current user if not admin at the bottom of roster */}
          {league.memberIds?.includes(currentUserId) && !isAdmin && (
            <button
              onClick={handleLeave}
              className="mt-4 w-full px-3 py-1 bg-gray-300 text-gray-800 text-sm rounded hover:bg-gray-400 transition duration-150"
            >
              Leave League
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;