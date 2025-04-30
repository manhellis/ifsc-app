import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leagueApi, League } from "../../api/leagues";
import { standingsApi, LeaderboardEntry } from "../../api/standings";
import { usersApi } from "../../api/users";
import { predictionsApi } from "../../api/predictions";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

// Badge component for event results from Leaderboards.tsx
const EventPointsBadge = ({ points, eventName }: { points: number; eventName?: string }) => {
  // Color based on points
  const getColor = (pts: number) => {
    if (pts >= 100) return 'bg-green-100 text-green-800';
    if (pts >= 50) return 'bg-blue-100 text-blue-800';
    if (pts >= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor(points)}`}
      title={eventName || `${points} points`}
    >
      {points} pts
    </span>
  );
};

// Extend the League interface from API to include the fields we need
interface ExtendedLeague extends League {
  pendingRequestIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
}

// Define LeagueMember interface
interface LeagueMember {
  _id: string;
  userName: string;
  avatarUrl?: string;
}

// Define PendingRequest interface
interface PendingRequest {
  _id: string; // Request ID
  userId: string;
  userName: string;
  avatarUrl?: string;
  createdAt: string;
}

// No longer needed as we're using PublicUserInfo from the API
// interface User {
//   _id: string;
//   userName: string;
//   avatarUrl?: string;
// }

const LeaguePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // Use the auth context to get the current user ID
  const { user } = useAuth();
  const currentUserId = user?.userId || "";

  const [league, setLeague] = useState<ExtendedLeague | null>(null);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New state for predictions
  const [predictions, setPredictions] = useState<Array<{
    _id?: string;
    eventId: string;
    categoryName: string;
    categoryId: string;
    userId: string;
    data: {
      first: string;
      second: string;
      third: string;
    };
    athletes?: {
      first: {
        id: string;
        firstname: string;
        lastname: string;
      };
      second: {
        id: string;
        firstname: string;
        lastname: string;
      };
      third: {
        id: string;
        firstname: string;
        lastname: string;
      };
    };
    locked: boolean;
    totalPoints?: number;
    createdAt?: string;
    eventName?: string;
  }>>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  // Add past predictions state
  const [pastPredictions, setPastPredictions] = useState<Array<{
    _id?: string;
    eventId: string;
    categoryName: string;
    categoryId: string;
    userId: string;
    data: {
      first: string;
      second: string;
      third: string;
    };
    athletes?: {
      first: {
        id: string;
        firstname: string;
        lastname: string;
      };
      second: {
        id: string;
        firstname: string;
        lastname: string;
      };
      third: {
        id: string;
        firstname: string;
        lastname: string;
      };
    };
    locked: boolean;
    totalPoints?: number;
    scoreDetails?: {
      podium?: {
        calculatedAt: string;
        pointsByPlace: {
          first: number;
          second: number;
          third: number;
        };
        total: number;
      }
    };
    event_finished: boolean;
    createdAt?: string;
    eventName?: string;
    userName?: string;
  }>>([]);
  const [pastPredictionsLoading, setPastPredictionsLoading] = useState(false);
  // Add new state variables for slug update and regenerate invite
  const [showSlugUpdate, setShowSlugUpdate] = useState(false);
  const [newSlugName, setNewSlugName] = useState("");
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false);
  const [isRegeneratingInvite, setIsRegeneratingInvite] = useState(false);

  // Modal state variables
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState<() => void>(() => {});
  const [modalActionLabel, setModalActionLabel] = useState("Confirm");

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
          // Cast the fetched league to our extended interface that includes pendingRequestIds
          const extendedLeague = fetchedLeague as ExtendedLeague;
          setLeague(extendedLeague);

          console.log("League data:", extendedLeague);
          console.log("Current user ID:", currentUserId);
          console.log("Admin IDs:", extendedLeague.adminIds);

          const isAdminUser = !!extendedLeague.adminIds?.includes(currentUserId);
          setIsAdmin(isAdminUser);
          
          console.log("Is admin:", isAdminUser);
          console.log("Pending request IDs:", extendedLeague.pendingRequestIds);

          // Fetch leaderboard using standingsApi like in Leaderboards.tsx
          try {
            const leaderboardData = await standingsApi.getLeagueLeaderboard(extendedLeague._id, {
              limit: 10 // Show top 10 on the league page
            });
            setRankings(leaderboardData.rankings);
          } catch (err) {
            console.error("Failed to load leaderboard:", err);
            setRankings([]);
          }

          // Fetch league members - using memberIds from the league response
          try {
            if (extendedLeague.memberIds && extendedLeague.memberIds.length > 0) {
              // Fetch user details for each member ID
              // Use the usersApi to fetch all members in a single batch request
              const memberDetails = await usersApi.getUsersByIds(extendedLeague.memberIds);
              const members = memberDetails.map(user => ({
                _id: user.id,
                userName: user.name,
                avatarUrl: user.picture || undefined
              }));
              setMembers(members);
            } else {
              setMembers([]);
            }
          } catch (err) {
            console.error("Failed to load league members:", err);
            setMembers([]);
          }

          // Fetch pending requests if the user is an admin
          if (isAdminUser && extendedLeague.pendingRequestIds && extendedLeague.pendingRequestIds.length > 0) {
            try {
              console.log("Fetching pending request details for IDs:", extendedLeague.pendingRequestIds);
              // Use usersApi to fetch user details for all pending requests at once
              const pendingUserDetails = await usersApi.getUsersByIds(extendedLeague.pendingRequestIds);
              console.log("Pending user details:", pendingUserDetails);
              
              const pendingRequests = pendingUserDetails.map(user => ({
                _id: user.id, // Using userId as request ID for now
                userId: user.id,
                userName: user.name,
                avatarUrl: user.picture || undefined,
                createdAt: new Date().toISOString() // Placeholder, should come from the join request data
              }));
              console.log("Processed pending requests:", pendingRequests);
              setPendingRequests(pendingRequests);
            } catch (err) {
              console.error("Failed to load pending requests info:", err);
              setPendingRequests([]);
            }
          } else {
            console.log("Not fetching pending requests:", { 
              isAdmin: isAdminUser, 
              hasPendingRequestIds: !!extendedLeague.pendingRequestIds,
              pendingRequestIdsLength: extendedLeague.pendingRequestIds?.length || 0
            });
            setPendingRequests([]);
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
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [slug, currentUserId]); // Add currentUserId dependency

  // Helper function to get username by userId from members array
  const getUserNameById = (userId: string): string => {
    const member = members.find(m => m._id === userId);
    return member?.userName || "Unknown user";
  };

  // New useEffect to fetch predictions when league data is loaded
  useEffect(() => {
    if (league && league._id) {
      fetchLeaguePredictions(league._id);
      fetchPastPredictions(league._id);
    }
  }, [league]);

  // Function to fetch predictions for this league
  const fetchLeaguePredictions = async (leagueId: string) => {
    try {
      setPredictionsLoading(true);
      // Query predictions for this league, only get recent/upcoming ones
      const response = await predictionsApi.queryPredictionsWithEvents(
        { leagueId, event_finished: false },
        10, // Limit to 10 most recent predictions
        0,
        "createdAt" // Sort by creation date
      );
      console.log("League predictions:", response.predictions);
      setPredictions(response.predictions);
    } catch (err) {
      console.error("Failed to load predictions:", err);
      toast.error("Failed to load predictions");
    } finally {
      setPredictionsLoading(false);
    }
  };

  // Function to fetch past predictions for this league
  const fetchPastPredictions = async (leagueId: string) => {
    try {
      setPastPredictionsLoading(true);
      // Query predictions for this league, only get finished ones
      const response = await predictionsApi.queryPredictionsWithEvents(
        { leagueId, event_finished: true },
        10, // Limit to 10 most recent past predictions
        0,
        "updatedAt" // Sort by update date to get the most recently completed
      );
      console.log("Past league predictions:", response.predictions);
      setPastPredictions(response.predictions);
    } catch (err) {
      console.error("Failed to load past predictions:", err);
      toast.error("Failed to load past predictions");
    } finally {
      setPastPredictionsLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!league || !isAdmin) return;
    const newType = league.type === "private" ? "public" : "private";
    try {
      await leagueApi.toggleLeaguePrivacy(league._id, newType);
      setLeague((prevLeague) => prevLeague ? { ...prevLeague, type: newType } : null);
      toast.success(`League is now ${newType}`);
    } catch (err) {
      console.error("Failed to toggle privacy:", err);
      toast.error("Failed to toggle privacy");
    }
  };

  const handleInvite = async () => {
     if (!league || !isAdmin) return;
    const invitedUserId = prompt("Enter user ID to invite:"); // Consider a better UI than prompt
    if (!invitedUserId) return;
    try {
      // Assuming createLeagueInvitation returns useful info
      await leagueApi.createLeagueInvitation(league._id, invitedUserId);
      toast.success("Invitation sent successfully");
      // Use response data if available, otherwise a generic message
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
      toast.error(errorMessage);
    }
  };

  // Display confirmation modal instead of window.confirm
  const showConfirmationModal = (
    title: string, 
    message: string, 
    action: () => void, 
    actionLabel: string = "Confirm"
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalActionLabel(actionLabel);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleConfirmModal = () => {
    modalAction();
    setShowModal(false);
  };

  const handleApproveRequest = async (requestId: string, userName: string) => {
    if (!league || !isAdmin) return;
    
    showConfirmationModal(
      "Approve Join Request",
      `Are you sure you want to approve ${userName}'s join request?`,
      async () => {
        try {
          await leagueApi.approveJoinRequest(league._id, requestId);
          
          toast.success("Join request approved successfully");
          console.log("Approved request:", requestId);
          
          // Optimistically update UI
          setPendingRequests(prev => prev.filter(req => req._id !== requestId));
          
          // Also update the league's pendingRequestIds
          setLeague(prev => {
            if (!prev) return null;
            return {
              ...prev,
              pendingRequestIds: prev.pendingRequestIds?.filter(id => id !== requestId),
              // Assuming the user is now a member
              memberIds: [...(prev.memberIds || []), requestId]
            };
          });
          
          // Fetch the updated member list
          try {
            if (league.memberIds) {
              // Include the newly approved member in the memberIds
              const updatedMemberIds = [...(league.memberIds || []), requestId];
              const memberDetails = await usersApi.getUsersByIds(updatedMemberIds);
              const members = memberDetails.map(user => ({
                _id: user.id,
                userName: user.name,
                avatarUrl: user.picture || undefined
              }));
              setMembers(members);
            }
          } catch (err) {
            console.error("Failed to refresh members list:", err);
            toast.error("Failed to refresh members list");
          }
        } catch (err) {
          console.error("Failed to approve request:", err);
          toast.error("Failed to approve request");
        }
      },
      "Approve"
    );
  };

  const handleRejectRequest = async (requestId: string, userName: string) => {
    if (!league || !isAdmin) return;
    
    showConfirmationModal(
      "Reject Join Request",
      `Are you sure you want to reject ${userName}'s join request?`,
      async () => {
        try {
          await leagueApi.rejectJoinRequest(league._id, requestId);
          
          toast.success("Join request rejected");
          console.log("Rejected request:", requestId);
          
          // Optimistically update UI
          setPendingRequests(prev => prev.filter(req => req._id !== requestId));
          
          // Also update the league's pendingRequestIds
          setLeague(prev => {
            if (!prev) return null;
            return {
              ...prev,
              pendingRequestIds: prev.pendingRequestIds?.filter(id => id !== requestId)
            };
          });
        } catch (err) {
          console.error("Failed to reject request:", err);
          toast.error("Failed to reject request");
        }
      },
      "Reject"
    );
  };

  const handleRemove = async (userIdToRemove: string, userName: string) => {
    if (!league || !isAdmin || userIdToRemove === currentUserId) return; // Admins cannot remove themselves this way
    
    showConfirmationModal(
      "Remove Member",
      `Are you sure you want to remove ${userName} from the league?`,
      async () => {
        try {
          await leagueApi.removeMember(league._id, userIdToRemove);
          toast.success("Member removed successfully");
          // Refetch rankings or optimistically update state
          setRankings((prev) => prev.filter((r) => r.userId !== userIdToRemove));
          setMembers((prev) => prev.filter((m) => m._id !== userIdToRemove));
          // Also update the league's memberIds
          setLeague(prev => {
            if (!prev) return null;
            return {
              ...prev,
              memberIds: prev.memberIds?.filter(id => id !== userIdToRemove)
            };
          });
        } catch (err) {
          console.error("Failed to remove member:", err);
          toast.error("Failed to remove member");
        }
      },
      "Remove"
    );
  };

  const handleLeave = async () => {
    if (!league || isAdmin) return; // Prevent admins from leaving via this button? Or add extra confirmation.
    
    showConfirmationModal(
      "Leave League",
      "Are you sure you want to leave this league?",
      async () => {
        try {
          await leagueApi.leaveLeague(league._id);
          toast.success("You have left the league");
          navigate("/dashboard"); // Redirect after leaving
        } catch (err) {
          console.error("Failed to leave league:", err);
          toast.error("Failed to leave league");
        }
      },
      "Leave"
    );
  };

  // Handler for regenerating invite code
  const handleRegenerateInviteCode = async () => {
    if (!league || !isAdmin) return;
    
    showConfirmationModal(
      "Regenerate Invite Code",
      "Are you sure you want to regenerate the invite code? The old code will no longer work.",
      async () => {
        try {
          setIsRegeneratingInvite(true);
          const result = await leagueApi.regenerateInviteCode(league._id);
          
          if (result.success && result.inviteCode) {
            setLeague(prev => prev ? { ...prev, inviteCode: result.inviteCode } : null);
            toast.success("Invite code regenerated successfully");
          } else {
            toast.error(result.error || "Failed to regenerate invite code");
          }
        } catch (err) {
          console.error("Failed to regenerate invite code:", err);
          toast.error("Failed to regenerate invite code");
        } finally {
          setIsRegeneratingInvite(false);
        }
      },
      "Regenerate"
    );
  };

  // Handler for updating slug
  const handleUpdateSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!league || !isAdmin || !newSlugName.trim()) return;
    
    try {
      setIsUpdatingSlug(true);
      const result = await leagueApi.updateLeagueSlug(league._id, newSlugName);
      
      if (result.success && result.slug) {
        setLeague(prev => prev ? { ...prev, slug: result.slug } : null);
        toast.success("League slug updated successfully");
        // Update the URL without reloading the page
        window.history.replaceState(null, '', `/dashboard/leagues/${result.slug}`);
        setShowSlugUpdate(false);
        setNewSlugName("");
      } else {
        toast.error(result.error || "Failed to update league slug");
      }
    } catch (err) {
      console.error("Failed to update league slug:", err);
      toast.error("Failed to update league slug");
    } finally {
      setIsUpdatingSlug(false);
    }
  };

  // Load state in a safe way for rendering
  const isPrivate = league?.type === "private";

  // Map all members (for roster display)
  const allMembers: LeagueMember[] = useMemo(() => {
    return members;
  }, [members]);

  // Check if there are pending requests
  const hasPendingRequests = league ? 
    (league.pendingRequestIds && 
     Array.isArray(league.pendingRequestIds) && 
     league.pendingRequestIds.length > 0) : 
    false;

  // Debug logs for rendering
  console.log("Rendering with state:", {
    isAdmin,
    hasPendingRequests,
    pendingRequestsLength: pendingRequests.length,
    pendingRequests
  });

  if (isLoading) {
    return <div className="p-5 text-center">Loading League...</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-600">{error}</div>;
  }

  if (!league) {
    return <div className="p-5 text-center">League not found.</div>;
  }

  return (
    <div className="p-5 h-[calc(100vh-64px)] overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6">{league?.name} ({league?.type})</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content: Rankings and Pending Requests */}
        <div className="flex-grow flex flex-col gap-6">
          {/* Rankings Panel */}
          <div className="border-2 border-blue-500 bg-gray-50 p-4 rounded-md shadow h-auto flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">Rankings</h2>
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => navigate(`/dashboard/leaderboards/${league?._id}`)}
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
              <div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recent Events
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankings.map((entry) => (
                      <tr key={entry.userId} className={`hover:bg-gray-50 ${entry.userId === currentUserId ? "bg-blue-50" : ""}`}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.rank}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.avatarUrl ? (
                              <img 
                                className="h-8 w-8 rounded-full" 
                                src={entry.avatarUrl} 
                                alt={`${entry.userName} avatar`} 
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  {entry.userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{entry.userName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="px-2 inline-flex text-md leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {entry.totalPoints}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-2">
                            {entry.eventResults.slice(-3).map((result, idx) => (
                              <EventPointsBadge 
                                key={idx} 
                                points={result.points} 
                                eventName={result.categoryName || `Event: ${result.eventId}`}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No rankings available yet.</p>
            )}
          </div>

          {/* New Current Predictions Panel */}
          <div className="border border-purple-500 bg-gray-50 p-4 rounded-md shadow h-auto flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current Predictions</h2>
              <button
                onClick={() => league && fetchLeaguePredictions(league._id)}
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
              >
                Refresh
              </button>
            </div>
            
            {predictionsLoading ? (
              <div className="text-center py-4">Loading predictions...</div>
            ) : predictions.length > 0 ? (
              <div className="space-y-3">
                {predictions.map((prediction) => (
                  <div key={prediction._id} className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="font-medium">{prediction.eventName || prediction.categoryName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          by {getUserNameById(prediction.userId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(prediction.createdAt || "").toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${prediction.locked ? "bg-gray-200" : "bg-green-100"}`}>
                          {prediction.locked ? "Locked" : "Open"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <span className="text-xs text-gray-600 block">🥇 First</span>
                        {prediction.athletes?.first ? (
                          <span className="font-medium">{prediction.athletes.first.firstname} {prediction.athletes.first.lastname}</span>
                        ) : (
                          <span className="font-medium">{prediction.data.first}</span>
                        )}
                      </div>
                      <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200">
                        <span className="text-xs text-gray-600 block">🥈 Second</span>
                        {prediction.athletes?.second ? (
                          <span className="font-medium">{prediction.athletes.second.firstname} {prediction.athletes.second.lastname}</span>
                        ) : (
                          <span className="font-medium">{prediction.data.second}</span>
                        )}
                      </div>
                      <div className="flex-1 bg-amber-50 p-2 rounded border border-amber-200">
                        <span className="text-xs text-gray-600 block">🥉 Third</span>
                        {prediction.athletes?.third ? (
                          <span className="font-medium">{prediction.athletes.third.firstname} {prediction.athletes.third.lastname}</span>
                        ) : (
                          <span className="font-medium">{prediction.data.third}</span>
                        )}
                      </div>
                    </div>
                    
                    {prediction.totalPoints !== undefined && (
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {prediction.totalPoints} pts
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No current predictions in this league.</p>
            )}
          </div>

          {/* Past Predictions Panel */}
          <div className="border border-gray-300 bg-gray-50 p-4 rounded-md shadow h-auto flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Past Predictions</h2>
              <button
                onClick={() => league && fetchPastPredictions(league._id)}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Refresh
              </button>
            </div>
            {pastPredictionsLoading ? (
              <div className="text-center py-4">Loading past predictions...</div>
            ) : pastPredictions.length > 0 ? (
              <div className="space-y-3">
                {pastPredictions.map((prediction) => (
                  <div key={prediction._id} className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="font-medium">{prediction.eventName || prediction.categoryName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          by {getUserNameById(prediction.userId)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(prediction.createdAt || "").toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <span className="text-xs text-gray-600 block">🥇 First</span>
                        {prediction.athletes?.first ? (
                          <span className="font-medium">{prediction.athletes.first.firstname} {prediction.athletes.first.lastname}</span>
                        ) : (
                          <span className="font-medium">{prediction.data.first}</span>
                        )}
                        {prediction.scoreDetails?.podium && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                            +{prediction.scoreDetails.podium.pointsByPlace.first}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200">
                        <span className="text-xs text-gray-600 block">🥈 Second</span>
                        {prediction.athletes?.second ? (
                          <span className="font-medium">{prediction.athletes.second.firstname} {prediction.athletes.second.lastname}</span>
                        ) : (
                          <span className="font-medium">{prediction.data.second}</span>
                        )}
                        {prediction.scoreDetails?.podium && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                            +{prediction.scoreDetails.podium.pointsByPlace.second}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 bg-amber-50 p-2 rounded border border-amber-200">
                        <span className="text-xs text-gray-600 block">🥉 Third</span>
                        {prediction.athletes?.third ? (
                          <span className="font-medium">{prediction.athletes.third.firstname} {prediction.athletes.third.lastname}</span>
                        ) : (
                          <span className="font-medium">{prediction.data.third}</span>
                        )}
                        {prediction.scoreDetails?.podium && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                            +{prediction.scoreDetails.podium.pointsByPlace.third}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {prediction.totalPoints !== undefined && (
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Total: {prediction.totalPoints} pts
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No past predictions.</p>
            )}
          </div>

          {/* Pending Requests Info Panel (Admin Only) */}
          {isAdmin && (
            <div className="border border-gray-300 bg-gray-50 p-4 rounded-md shadow h-auto flex flex-col">
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
                          onClick={() => handleApproveRequest(req.userId, req.userName)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.userId, req.userName)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasPendingRequests ? (
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
        <div className="w-full lg:w-64 bg-gray-100 p-4 rounded-md shadow flex-shrink-0 h-auto flex flex-col h-fit">
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
          
          {/* Admin info section */}
          {isAdmin && league && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Admin Information</h3>
              <div className="text-xs mb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">League Slug:</span>
                  <div className="flex items-center">
                    <span className="text-gray-700">{league.slug}</span>
                    <button 
                      onClick={() => setShowSlugUpdate(!showSlugUpdate)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      title="Edit Slug"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                
                {showSlugUpdate && (
                  <form onSubmit={handleUpdateSlug} className="mt-2 space-y-2">
                    <label className="block text-xs font-medium text-gray-700">New Name (for Slug)</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={newSlugName}
                        onChange={(e) => setNewSlugName(e.target.value)}
                        className="text-xs flex-1 border border-gray-300 rounded-l-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter name for new slug"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingSlug}
                        className={`text-xs px-2 py-1 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 ${isUpdatingSlug ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdatingSlug ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                    <p className="text-xxs text-gray-500 italic">This will generate a new URL-friendly identifier for your league.</p>
                  </form>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  <span className="font-medium">Invite Code:</span>
                  <div className="flex items-center">
                    <span className="text-gray-700">{league.inviteCode || league._id}</span>
                    <button 
                      onClick={handleRegenerateInviteCode}
                      disabled={isRegeneratingInvite}
                      className={`ml-2 text-blue-600 hover:text-blue-800 ${isRegeneratingInvite ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Regenerate Invite Code"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 italic">Share these with users you want to invite to your league.</p>
            </div>
          )}
          
          <div className="flex-1">
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
                      onClick={() => handleRemove(member._id, member.userName)}
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
          </div>
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

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2">{modalTitle}</h2>
            <p className="mb-4">{modalMessage}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModal}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                {modalActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaguePage;