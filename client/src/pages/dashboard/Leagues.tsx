// client/src/pages/dashboard/Leagues.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { leagueApi, League } from "../../api";

const Leagues: React.FC = () => {
  const [publicLeagues, setPublicLeagues] = useState<League[]>([]);
  const [inviteSlug, setInviteSlug] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeagues() {
      try {
        const { leagues } = await leagueApi.queryLeagues({ type: "public" });
        setPublicLeagues(leagues);
      } catch (err) {
        console.error("Error fetching leagues:", err);
      }
    }
    fetchLeagues();
  }, []);

  const handleJoinPublic = async (leagueId: string) => {
    try {
      await leagueApi.requestToJoin(leagueId);
      alert("Join request sent!");
    } catch (err) {
      console.error("Error requesting to join:", err);
    }
  };

  const handleJoinPrivate = async () => {
    try {
      const { league } = await leagueApi.getLeagueBySlug(inviteSlug);
      await leagueApi.joinPrivateLeague(league._id, inviteCode);
      alert("You have joined the league!");
      navigate(`/league/${inviteSlug}`);
    } catch (err) {
      console.error("Error joining private league:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Join Public Leagues</h1>
      {publicLeagues.length === 0 ? (
        <p>No public leagues available.</p>
      ) : (
        <ul>
          {publicLeagues.map((l) => (
            <li key={l._id} style={{ marginBottom: 8 }}>
              <strong>{l.name}</strong>{" "}
              <button onClick={() => handleJoinPublic(l._id)}>
                Request to Join
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Join via Invite Code</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          placeholder="League Slug"
          value={inviteSlug}
          onChange={(e) => setInviteSlug(e.target.value)}
        />
        <input
          type="text"
          placeholder="Invite Code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />
        <button onClick={handleJoinPrivate}>Join</button>
      </div>
    </div>
  );
};

export default Leagues;
