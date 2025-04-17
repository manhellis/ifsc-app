import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leagueApi } from "../../api";

interface League {
  _id: string;
  name: string;
  type: "public" | "private";
  adminIds: string[];
  memberIds: string[];
  inviteCode?: string;
}

interface Ranking {
  userId: string;
  userName: string;
  avatarUrl?: string;
  eventResults: { eventName: string; points: number }[];
  totalPoints: number;
}

const LeaguePage: React.FC = () => {
  // Extract the league slug from route params
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // TODO: replace with your auth/user context hook
  const currentUserId = "CURRENT_USER_ID";

  const [league, setLeague] = useState<League | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function fetchData() {
      try {
        // Fetch league by slug
        if (slug) {
          const { league } = await leagueApi.getLeagueBySlug(slug);
          setLeague(league);
          setIsPrivate(league.type === "private");
          setIsAdmin(league.adminIds.includes(currentUserId));

          // Fetch leaderboard using league._id
          const board = await leagueApi.getLeagueLeaderboard(league._id);
          setRankings(board);
        }
      } catch (err) {
        console.error("Failed to load league:", err);
      }
    }
    fetchData();
  }, [slug, currentUserId]);

  const handleTogglePrivacy = async () => {
    if (!league) return;
    const newType = isPrivate ? "public" : "private";
    try {
      await leagueApi.toggleLeaguePrivacy(league._id, newType);
      setIsPrivate(!isPrivate);
    } catch (err) {
      console.error("Failed to toggle privacy:", err);
    }
  };

  const handleInvite = async () => {
    if (!league) return;
    const invitedUserId = prompt("Enter user ID to invite:");
    if (!invitedUserId) return;
    try {
      const response = await leagueApi.createLeagueInvitation(league._id, invitedUserId);
      alert(`Invitation created: ${response.invitationId}`);
    } catch (err) {
      console.error("Failed to invite user:", err);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!league) return;
    if (window.confirm("Remove this member from the league?")) {
      try {
        await leagueApi.removeMember(league._id, userId);
        setRankings((prev) => prev.filter((r) => r.userId !== userId));
      } catch (err) {
        console.error("Failed to remove member:", err);
      }
    }
  };

  const handleLeave = async () => {
    if (!league) return;
    if (window.confirm("Leave this league?")) {
      try {
        await leagueApi.leaveLeague(league._id);
        navigate("/dashboard"); // redirect back to dashboard or leagues list
      } catch (err) {
        console.error("Failed to leave league:", err);
      }
    }
  };

  if (!league) {
    return <div>No League Found</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{league.name}</h1>
      <div style={{ display: "flex", gap: 20 }}>
        {/* Rankings Panel */}
        <div
          style={{
            flex: 1,
            border: "2px solid #3b82f6",
            background: "#f3f4f6",
            padding: 16,
            borderRadius: 4,
          }}
        >
          <h2>Rankings</h2>
          {rankings.map((r) => (
            <div
              key={r.userId}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 12,
                background: r.userId === currentUserId ? "#fff" : "transparent",
                padding: r.userId === currentUserId ? 8 : 0,
                borderRadius: 4,
              }}
            >
              <img
                src={r.avatarUrl || "/placeholder.png"}
                alt={r.userName}
                style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 8 }}
              />
              <strong style={{ marginRight: 16 }}>{r.userName}</strong>
              {r.eventResults.map((e) => (
                <span key={e.eventName} style={{ marginRight: 12 }}>
                  {e.eventName} {e.points}pts
                </span>
              ))}
              <span style={{ marginLeft: "auto" }}>{r.totalPoints}pts</span>
            </div>
          ))}

          {isAdmin && (
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={handleTogglePrivacy}
            >
              <span style={{ marginRight: 8 }}>⚙️ Administrator View</span>
              <label style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                <input type="checkbox" checked={isPrivate} readOnly style={{ marginRight: 4 }} />
                Private
              </label>
            </div>
          )}
        </div>

        {/* Roster Panel */}
        <div
          style={{
            width: 240,
            background: "#e5e7eb",
            padding: 16,
            borderRadius: 4,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h2>Roster</h2>
            {isAdmin && <button onClick={handleInvite}>＋</button>}
          </div>
          {[...new Set([...rankings.map((r) => r.userId)])].map((uid) => {
            const r = rankings.find((x) => x.userId === uid)!;
            return (
              <div
                key={uid}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#fff",
                  borderRadius: 4,
                  padding: 8,
                  marginBottom: 8,
                }}
              >
                <img
                  src={r.avatarUrl || "/placeholder.png"}
                  alt={r.userName}
                  style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8 }}
                />
                <span style={{ flex: 1 }}>{r.userName}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(uid)}
                    style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                )}
                {uid === currentUserId && (
                  <button
                    onClick={handleLeave}
                    style={{ color: "#333", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Leave
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;