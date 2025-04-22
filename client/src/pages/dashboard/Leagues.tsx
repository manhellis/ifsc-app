// client/src/pages/dashboard/Leagues.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { leagueApi, League } from "../../api";

// Define the Modal component props interface
interface ModalProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

// Simple Modal Component
const Modal: React.FC<ModalProps> = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                  'bg-blue-100 border-blue-400 text-blue-700';
  const title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info';
  const titleColor = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50 p-4">
      <div className={`bg-white rounded-lg p-6 max-w-md w-full shadow-xl border ${bgColor}`}>
        <h2 className={`text-xl font-bold ${titleColor} mb-2`}>{title}</h2>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Component for a league card
const LeagueCardSkeleton: React.FC = () => (
  <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center animate-pulse">
    <div className="flex-1">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
    </div>
    <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
  </div>
);

// Skeleton Loading Component for the Leagues section
const LeaguesSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, index) => (
      <LeagueCardSkeleton key={index} />
    ))}
  </div>
);

const Leagues: React.FC = () => {
  const [publicLeagues, setPublicLeagues] = useState<League[]>([]);
  const [pendingRequestLeagueIds, setPendingRequestLeagueIds] = useState<Set<string>>(new Set());
  const [inviteSlug, setInviteSlug] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');

  const navigate = useNavigate();

  // Function to show the modal
  const showModal = (message: string, type: 'success' | 'error' | 'info') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoadingLeagues(true);
        setIsLoadingPending(true);
        setError(null);

        const { leagues } = await leagueApi.getPublicLeagues();
        if (!isMounted) return;
        setPublicLeagues(leagues);

        try {
          const { pendingLeagueIds } = await leagueApi.getMyPendingRequests();
          if (!isMounted) return;
          setPendingRequestLeagueIds(new Set(pendingLeagueIds));
        } catch (pendingErr) {
          console.error("Error fetching pending requests:", pendingErr);
          if (isMounted) setError("Could not load your pending request status.");
        } finally {
          if (isMounted) setIsLoadingPending(false);
        }

      } catch (err) {
        console.error("Error fetching leagues:", err);
        if (isMounted) setError("Failed to load leagues. Please try again later.");
      } finally {
        if (isMounted) setIsLoadingLeagues(false);
      }
    }

    fetchData();

    return () => { isMounted = false; };
  }, []);

  const handleJoinPublic = useCallback(async (leagueId: string) => {
    try {
      await leagueApi.requestToJoin(leagueId);
      showModal("Join request sent!", 'success');
      setPendingRequestLeagueIds(prev => new Set(prev).add(leagueId));
    } catch (err) {
      console.error("Error requesting to join:", err);
      const message = err instanceof Error ? err.message : "Failed to send join request.";
      showModal(`Error: ${message}`, 'error');
    }
  }, []);

  const handleCancelRequest = useCallback(async (leagueId: string) => {
    if (window.confirm("Are you sure you want to cancel your join request for this league?")) {
      try {
        const result = await leagueApi.cancelJoinRequest(leagueId);
        if (result.success) {
          showModal("Join request cancelled.", 'success');
          setPendingRequestLeagueIds(prev => {
            const next = new Set(prev);
            next.delete(leagueId);
            return next;
          });
        } else {
          showModal(`Failed to cancel request: ${result.message || 'Unknown reason'}`, 'error');
        }
      } catch (err) {
        console.error("Error cancelling request:", err);
        const message = err instanceof Error ? err.message : "Failed to cancel request.";
        showModal(`Error: ${message}`, 'error');
      }
    }
  }, []);

  const handleJoinPrivate = useCallback(async () => {
    if (!inviteSlug || !inviteCode) {
      showModal("Please enter both league slug and invite code", 'error');
      return;
    }
    try {
      const trimmedSlug = inviteSlug.trim();
      const trimmedCode = inviteCode.trim();

      const { league } = await leagueApi.getLeagueBySlug(trimmedSlug);
      if (!league) {
        showModal(`League with slug "${trimmedSlug}" not found.`, 'error');
        return;
      }
      if (!league._id) {
        console.error("Fetched league missing _id:", league);
        showModal("An error occurred fetching league details.", 'error');
        return;
      }
      await leagueApi.joinPrivateLeague(league._id, trimmedCode);
      showModal("You have joined the league!", 'success');
      navigate(`/league/${league.slug || trimmedSlug}`);
    } catch (err) {
      console.error("Error joining private league:", err);
      const message = err instanceof Error ? err.message : "Failed to join league.";
      showModal(`Failed to join league: ${message}. Please check your invite code and try again.`, 'error');
    }
  }, [inviteSlug, inviteCode, navigate]);

  // Add a navigation handler for clicking on a league
  const handleLeagueClick = useCallback((league: League) => {
    const slug = league.slug || league._id;
    navigate(`/dashboard/league/${slug}`);
  }, [navigate]);

  const isLoading = isLoadingLeagues || isLoadingPending;

  return (
    <div className="flex flex-col h-full py-6">
      <h1 className="text-4xl sm:text-6xl text-left font-normal mb-6">
        Leagues
      </h1>
      
      {/* Render Modal Conditionally */}
      {modalVisible && (
        <Modal
          message={modalMessage}
          type={modalType}
          onClose={handleCloseModal}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Public Leagues Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Join Public Leagues</h2>

          {isLoading && (
            <div className="space-y-3">
              <LeaguesSkeleton />
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && publicLeagues.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No public leagues available.
            </div>
          )}

          {!isLoading && !error && publicLeagues.length > 0 && (
            <div className="space-y-3">
              {publicLeagues.map((league) => {
                const hasPendingRequest = pendingRequestLeagueIds.has(league._id);
                const isAdminOrOwner = league.isCurrentUserAdminOrOwner === true;

                return (
                  <div
                    key={league._id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="flex-1 cursor-pointer hover:text-blue-600"
                      onClick={() => handleLeagueClick(league)}
                    >
                      <h3 className="font-medium text-lg">{league.name}</h3>
                    </div>
                    {isAdminOrOwner ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Admin / Owner
                      </span>
                    ) : hasPendingRequest ? (
                      <button
                        onClick={() => handleCancelRequest(league._id)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
                        title="Cancel your join request"
                      >
                        Cancel Request
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinPublic(league._id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Private League Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Join via Invite Code</h2>
          
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded mb-1 w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded mb-1 w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Have an invite code? Enter the league slug and the invite code to join a private league.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="leagueSlug" className="block text-sm font-medium text-gray-700 mb-1">
                    League Slug
                  </label>
                  <input
                    id="leagueSlug"
                    type="text"
                    placeholder="Enter league slug"
                    value={inviteSlug}
                    onChange={(e) => setInviteSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Invite Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleJoinPrivate}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Join League
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leagues;
