import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:5000/api";
const NBA_HEADSHOT = (nbaId) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

// ESPN uses different slugs for some teams
const ESPN_SLUG = {
  GSW: "gs",
  NYK: "ny",
  NOP: "no",
  SAS: "sa",
  UTA: "utah",
  NJN: "bkn",
  NOH: "no",
};

const STANDINGS_SLUG = {
  hawks: "atl",
  celtics: "bos",
  nets: "bkn",
  hornets: "cha",
  bulls: "chi",
  cavaliers: "cle",
  mavericks: "dal",
  nuggets: "den",
  pistons: "det",
  warriors: "gs",
  rockets: "hou",
  pacers: "ind",
  clippers: "lac",
  lakers: "lal",
  grizzlies: "mem",
  heat: "mia",
  bucks: "mil",
  timberwolves: "min",
  pelicans: "no",
  knicks: "ny",
  thunder: "okc",
  magic: "orl",
  sixers: "phi",
  suns: "phx",
  blazers: "por",
  kings: "sac",
  spurs: "sa",
  raptors: "tor",
  jazz: "utah",
  wizards: "wsh",
};

const TEAM_LOGO = (abbrev) => {
  if (!abbrev) return "";
  const lower = abbrev.toLowerCase();
  // If it's a full name slug (standings), look it up directly
  if (STANDINGS_SLUG[lower])
    return `https://a.espncdn.com/i/teamlogos/nba/500/${STANDINGS_SLUG[lower]}.png`;
  // Otherwise treat it as an abbreviation (scoreboard)
  const upper = abbrev.toUpperCase();
  const slug = ESPN_SLUG[upper] ?? lower;
  return `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png`;
};

const api = {
  get: (path) => fetch(`${API}${path}`).then((r) => r.json()),
  post: (path, body) =>
    fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  delete: (path) =>
    fetch(`${API}${path}`, { method: "DELETE" }).then((r) => r.json()),
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600&display=swap');`;

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080C14; }
  .app { font-family: 'Barlow', sans-serif; background: #080C14; min-height: 100vh; color: #E8EAF0; }
  .condensed { font-family: 'Barlow Condensed', sans-serif; }

  .bg-court {
    background-color: #080C14;
    background-image:
      repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 60px),
      repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 60px);
  }

  .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; backdrop-filter: blur(10px); transition: border-color 0.2s;
  }
  .card:hover { border-color: rgba(251,146,60,0.3); }

  .card-glow {
    background: linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(255,255,255,0.03) 100%);
    border: 1px solid rgba(251,146,60,0.2); border-radius: 12px;
  }

  .nav-tab {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 8px 20px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    color: #6B7280; border: 1px solid transparent; background: transparent;
  }
  .nav-tab:hover { color: #E8EAF0; }
  .nav-tab.active { color: #FB923C; border-color: rgba(251,146,60,0.3); background: rgba(251,146,60,0.08); }

  .live-dot {
    width: 7px; height: 7px; background: #22C55E;
    border-radius: 50%; animation: pulse 1.5s infinite; display: inline-block;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(34,197,94,0); }
  }

  .fav-btn { background: none; border: none; cursor: pointer; transition: transform 0.15s; }
  .fav-btn:hover { transform: scale(1.2); }

  .score-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 14px 16px; transition: border-color 0.2s;
  }
  .score-card:hover { border-color: rgba(251,146,60,0.25); }
  .score-card.live { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.04); }

  .search-input {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 10px 16px; color: #E8EAF0;
    font-family: 'Barlow', sans-serif; font-size: 14px;
    outline: none; width: 100%; transition: border-color 0.2s;
  }
  .search-input:focus { border-color: rgba(251,146,60,0.5); }
  .search-input::placeholder { color: #4B5563; }

  .orange { color: #FB923C; }
  .green  { color: #22C55E; }
  .muted  { color: #6B7280; }
  .semi   { color: #9CA3AF; }

  .standings-row {
    display: grid; grid-template-columns: 18px 26px 1fr 28px 28px 44px;
    gap: 6px; align-items: center;
    padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px;
  }
  .standings-row:last-child { border-bottom: none; }

  .avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, #1E293B, #334155);
    border: 2px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 13px; color: #FB923C;
    flex-shrink: 0; overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }

  .section-label {
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 2.5px; text-transform: uppercase; color: #4B5563; margin-bottom: 12px;
  }

  .tag {
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px;
  }

  .fade-in { animation: fadeIn 0.4s ease forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .header-line {
    height: 3px; background: linear-gradient(90deg, #FB923C, #FBBF24, transparent); border-radius: 2px;
  }

  .skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .search-dropdown {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: #111827; border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px; overflow: hidden; z-index: 100;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  }
  .search-result {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; cursor: pointer; transition: background 0.15s;
  }
  .search-result:hover { background: rgba(251,146,60,0.08); }

  .error-banner {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 8px; padding: 12px 16px; color: #FCA5A5;
    font-size: 13px; margin-bottom: 16px;
  }

  .refresh-btn {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px; padding: 5px 12px; color: #9CA3AF;
    font-size: 12px; cursor: pointer; font-family: 'Barlow', sans-serif; transition: all 0.2s;
  }
  .refresh-btn:hover { background: rgba(255,255,255,0.09); color: #E8EAF0; }
`;

function Avatar({ nbaId, name, size = 38, dim = false }) {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("") ?? "?";
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        opacity: dim ? 0.5 : 1,
        border: size > 40 ? "2px solid rgba(251,146,60,0.25)" : undefined,
      }}
    >
      <img
        src={NBA_HEADSHOT(nbaId)}
        alt={name}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.parentNode.innerText = initials;
        }}
      />
    </div>
  );
}

function TeamLogo({ abbrev, size = 28 }) {
  const [err, setErr] = useState(false);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {err ? (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 4,
            background: "rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.32,
            fontWeight: 800,
            color: "#9CA3AF",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: 0.5,
          }}
        >
          {abbrev?.slice(0, 2)}
        </div>
      ) : (
        <img
          src={TEAM_LOGO(abbrev)}
          alt={abbrev}
          onError={() => setErr(true)}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            display: "block",
          }}
        />
      )}
    </div>
  );
}

function Skeleton({ width = "100%", height = 20, style = {} }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

function GameCard({ game }) {
  const isLive = game.status === "Live";
  const isFinal = game.status === "Final";
  const isUpcoming = !isLive && !isFinal;
  const awayWon = isFinal && game.away_score > game.home_score;
  const homeWon = isFinal && game.home_score > game.away_score;

  return (
    <div className={`score-card${isLive ? " live" : ""}`}>
      <div style={{ marginBottom: 10 }}>
        {isLive ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
            }}
          >
            <span className="live-dot" />
            <span
              className="green condensed"
              style={{ fontWeight: 700, letterSpacing: 1 }}
            >
              {game.quarter}
            </span>
          </span>
        ) : (
          <span
            className={`tag ${isFinal ? "muted" : "orange"}`}
            style={{
              background: isFinal
                ? "rgba(107,114,128,0.15)"
                : "rgba(251,146,60,0.12)",
            }}
          >
            {game.status}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          {
            code: game.away_team,
            name: game.away_name,
            score: game.away_score,
            won: awayWon,
          },
          {
            code: game.home_team,
            name: game.home_name,
            score: game.home_score,
            won: homeWon,
          },
        ].map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TeamLogo abbrev={t.code} size={26} />
              <span
                className="condensed"
                style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}
              >
                {t.code}
              </span>
              <span className="semi" style={{ fontSize: 12 }}>
                {t.name}
              </span>
            </div>
            {!isUpcoming && (
              <span
                className="condensed"
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: isFinal ? (t.won ? "#E8EAF0" : "#6B7280") : "#E8EAF0",
                }}
              >
                {t.score}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerStatCard({ player }) {
  const s = player.today;
  return (
    <div className="card-glow" style={{ padding: "14px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar nbaId={player.nba_id} name={player.name} size={48} />
          <div>
            <div
              className="condensed"
              style={{ fontWeight: 700, fontSize: 15 }}
            >
              {player.name}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {player.team} · {player.position}
            </div>
          </div>
        </div>
        <span
          className="tag green condensed"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          Played
        </span>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        {[
          { label: "PTS", val: s.pts },
          { label: "REB", val: s.reb },
          { label: "AST", val: s.ast },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 8,
              padding: "8px 0",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="condensed orange"
              style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}
            >
              {stat.val}
            </div>
            <div
              className="muted condensed"
              style={{ fontSize: 10, letterSpacing: 1.5, marginTop: 3 }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      {s.min && (
        <div
          className="muted"
          style={{ fontSize: 11, marginTop: 8, textAlign: "right" }}
        >
          {s.min} min · {s.fgm}/{s.fga} FG · {s.tpm} 3PM
        </div>
      )}
    </div>
  );
}

function PlayerNotPlayingCard({ player }) {
  const avg = player.averages ?? {};
  return (
    <div
      className="card"
      style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Avatar nbaId={player.nba_id} name={player.name} size={36} dim />
      <div style={{ flex: 1 }}>
        <div
          className="condensed"
          style={{ fontWeight: 700, fontSize: 14, color: "#6B7280" }}
        >
          {player.name}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          {player.team} · No game today
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { l: "PPG", v: avg.pts },
          { l: "RPG", v: avg.reb },
          { l: "APG", v: avg.ast },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div
              className="condensed"
              style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF" }}
            >
              {s.v ?? "—"}
            </div>
            <div
              className="muted condensed"
              style={{ fontSize: 9, letterSpacing: 1 }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ data, loading, error }) {
  if (error)
    return (
      <div className="error-banner">
        ⚠️ Could not reach the Flask backend. Make sure it's running on port
        5000 with <code>python run.py</code>
      </div>
    );

  if (loading)
    return (
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[100, 100, 160, 160].map((h, i) => (
            <Skeleton key={i} height={h} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} height={30} />
          ))}
        </div>
      </div>
    );

  const {
    games = [],
    standings = { east: [], west: [] },
    players = [],
  } = data ?? {};
  const playedToday = players.filter((p) => p.played_today);
  const notPlayed = players.filter((p) => !p.played_today);

  return (
    <div
      className="fade-in"
      style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Favourite players */}
        <div>
          <div className="section-label">My Players · Today</div>
          {players.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏀</div>
              <div
                className="condensed"
                style={{ fontSize: 16, fontWeight: 700, color: "#6B7280" }}
              >
                No favourites yet
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Head to the Players tab to add some
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {playedToday.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {playedToday.map((p) => (
                    <PlayerStatCard key={p.nba_id} player={p} />
                  ))}
                </div>
              )}
              {notPlayed.map((p) => (
                <PlayerNotPlayingCard key={p.nba_id} player={p} />
              ))}
            </div>
          )}
        </div>

        {/* Today's games */}
        <div>
          <div className="section-label">
            Today's Games ·{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}
          </div>
          {games.length === 0 ? (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <div className="muted" style={{ fontSize: 13 }}>
                No games scheduled today
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {games.map((g) => (
                <GameCard key={g.game_id} game={g} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Standings sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {["east", "west"].map((conf) => (
          <div key={conf} className="card" style={{ padding: "16px 18px" }}>
            <div className="section-label">
              {conf === "east" ? "Eastern" : "Western"} Conference
            </div>
            <div
              className="standings-row muted"
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                paddingBottom: 8,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span>#</span>
              <span></span>
              <span>Team</span>
              <span>W</span>
              <span>L</span>
              <span>PCT</span>
            </div>

            {standings[conf]?.map((t, i) => (
              <div key={t.team} className="standings-row">
                <span
                  className="muted"
                  style={{ fontWeight: 600, fontSize: 12 }}
                >
                  {i + 1}
                </span>

                <TeamLogo abbrev={t.team} size={22} />
                <span
                  className="condensed"
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.city} {t.name}
                </span>
                <span style={{ fontWeight: 600, textAlign: "center" }}>
                  {t.wins}
                </span>
                <span className="muted" style={{ textAlign: "center" }}>
                  {t.losses}
                </span>
                <span
                  className="orange"
                  style={{ fontWeight: 600, textAlign: "center" }}
                >
                  {t.pct}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FavRow({ player, onRemove }) {
  const [avgs, setAvgs] = useState(null);

  useEffect(() => {
    api
      .get(`/players/${player.nba_id}`)
      .then((d) => setAvgs(d.averages))
      .catch(() => {});
  }, [player.nba_id]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 80px 80px 80px 40px",
        gap: 8,
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        alignItems: "center",
        background: "rgba(251,146,60,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar nbaId={player.nba_id} name={player.name} size={40} />
        <div>
          <div className="condensed" style={{ fontWeight: 700, fontSize: 14 }}>
            {player.name}
          </div>
          <div className="muted" style={{ fontSize: 11 }}>
            {player.position}
          </div>
        </div>
      </div>
      <div
        className="condensed orange"
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <TeamLogo abbrev={player.team} size={20} />
        {player.team}
      </div>
      {avgs
        ? [avgs.pts, avgs.reb, avgs.ast].map((v, i) => (
            <div
              key={i}
              className="condensed"
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 15,
                color: "#E8EAF0",
              }}
            >
              {v}
            </div>
          ))
        : [...Array(3)].map((_, i) => (
            <Skeleton
              key={i}
              height={18}
              style={{ margin: "0 auto", width: 36 }}
            />
          ))}
      <div style={{ textAlign: "center" }}>
        <button className="fav-btn" onClick={onRemove} title="Remove favourite">
          <span style={{ fontSize: 18, color: "#FB923C" }}>★</span>
        </button>
      </div>
    </div>
  );
}

function Players({ favouriteIds, onToggleFav }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [favPlayers, setFavPlayers] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setLoadingFavs(true);
    api
      .get("/favourites/")
      .then(setFavPlayers)
      .catch(() => setFavPlayers([]))
      .finally(() => setLoadingFavs(false));
  }, [favouriteIds]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDrop(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get(
          `/players/search?q=${encodeURIComponent(query)}`,
        );
        setResults(data);
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isFav = (nbaId) => favouriteIds.includes(nbaId);

  return (
    <div className="fade-in">
      <div ref={wrapperRef} style={{ position: "relative", marginBottom: 20 }}>
        <input
          className="search-input"
          placeholder="Search any NBA player to add to favourites..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDrop(true)}
        />
        {searching && (
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            Searching...
          </div>
        )}
        {showDrop && results.length > 0 && (
          <div className="search-dropdown">
            {results.map((p) => (
              <div
                key={p.nba_id}
                className="search-result"
                onClick={() => {
                  onToggleFav(p);
                  setShowDrop(false);
                  setQuery("");
                }}
              >
                <Avatar nbaId={p.nba_id} name={p.name} size={34} />
                <div style={{ flex: 1 }}>
                  <div
                    className="condensed"
                    style={{ fontWeight: 700, fontSize: 14 }}
                  >
                    {p.name}
                  </div>
                  {!p.is_active && (
                    <div className="muted" style={{ fontSize: 11 }}>
                      Retired
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 18,
                    color: isFav(p.nba_id) ? "#FB923C" : "#374151",
                  }}
                >
                  {isFav(p.nba_id) ? "★" : "☆"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-label">Your Favourites</div>
      {loadingFavs ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={52} />
          ))}
        </div>
      ) : favPlayers.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <div
            className="condensed"
            style={{ fontSize: 15, fontWeight: 700, color: "#6B7280" }}
          >
            Search for players above to build your list
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "8px 4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 80px 80px 40px",
              gap: 8,
              padding: "6px 14px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {["Player", "Team", "PPG", "RPG", "APG", ""].map((h, i) => (
              <div
                key={i}
                className="muted condensed"
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  textAlign: i > 0 ? "center" : "left",
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {favPlayers.map((p) => (
            <FavRow key={p.nba_id} player={p} onRemove={() => onToggleFav(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState([]);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    setDashError(false);
    try {
      const data = await api.get("/dashboard/");
      setDashData(data);
      setFavouriteIds(data.players.map((p) => p.nba_id));
    } catch {
      setDashError(true);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleToggleFav = useCallback(
    async (player) => {
      const isFav = favouriteIds.includes(player.nba_id);
      try {
        if (isFav) {
          await api.delete(`/favourites/${player.nba_id}`);
          setFavouriteIds((prev) => prev.filter((id) => id !== player.nba_id));
        } else {
          await api.post("/favourites/", {
            nba_id: player.nba_id,
            name: player.name,
            team: player.team ?? "",
            position: player.position ?? "",
          });
          setFavouriteIds((prev) => [...prev, player.nba_id]);
        }
        loadDashboard();
      } catch (e) {
        console.error("Failed to update favourite:", e);
      }
    },
    [favouriteIds, loadDashboard],
  );

  return (
    <>
      <style>
        {FONTS}
        {styles}
      </style>
      <div className="app bg-court" style={{ minHeight: "100vh" }}>
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(8,12,20,0.9)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div className="header-line" />
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22 }}>🏀</span>
              <div>
                <div
                  className="condensed orange"
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    lineHeight: 1,
                  }}
                >
                  HOOPBOARD
                </div>
                <div
                  className="muted"
                  style={{
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Your NBA Dashboard
                </div>
              </div>
            </div>

            <nav style={{ display: "flex", gap: 6 }}>
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "players", label: "Players" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`nav-tab${tab === t.id ? " active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === "players" && favouriteIds.length > 0 && (
                    <span
                      style={{
                        marginLeft: 7,
                        background: "#FB923C",
                        color: "#000",
                        fontSize: 10,
                        fontWeight: 800,
                        borderRadius: "50%",
                        width: 17,
                        height: 17,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {favouriteIds.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!dashLoading && !dashError && (
                <>
                  <span className="live-dot" />
                  <span className="muted" style={{ fontSize: 12 }}>
                    Live
                  </span>
                </>
              )}
              <button className="refresh-btn" onClick={loadDashboard}>
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
          {tab === "dashboard" && (
            <Dashboard
              data={dashData}
              loading={dashLoading}
              error={dashError}
            />
          )}
          {tab === "players" && (
            <Players
              favouriteIds={favouriteIds}
              onToggleFav={handleToggleFav}
            />
          )}
        </div>
      </div>
    </>
  );
}
