"""
nba_helpers.py
Thin wrappers around nba_api with simple in-process caching.
All functions return plain Python dicts/lists so routes stay clean.
"""

import datetime
from functools import lru_cache

SEASON = "2025-26"

from nba_api.stats.endpoints import (
    scoreboardv2,
    playergamelog,
    commonplayerinfo,
    leaguestandingsv3,
)
from nba_api.stats.static import players as static_players


# ── Player search ────────────────────────────────────────────────────────────

def search_players(query: str) -> list[dict]:
    """Return players whose name contains `query` (case-insensitive)."""
    query = query.strip().lower()
    results = []
    for p in static_players.get_players():
        if query in p["full_name"].lower():
            results.append({
                "nba_id":    p["id"],
                "name":      p["full_name"],
                "is_active": p["is_active"],
            })
    # Active players first, then alphabetical
    results.sort(key=lambda p: (not p["is_active"], p["name"]))
    return results[:20]


def get_player_info(nba_id: int) -> dict | None:
    """Return basic bio for a single player."""
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=nba_id)
        row = info.common_player_info.get_dict()["data"][0]
        headers = info.common_player_info.get_dict()["headers"]
        d = dict(zip(headers, row))
        return {
            "nba_id":   nba_id,
            "name":     d.get("DISPLAY_FIRST_LAST", ""),
            "team":     d.get("TEAM_ABBREVIATION", ""),
            "position": d.get("POSITION", ""),
            "jersey":   d.get("JERSEY", ""),
        }
    except Exception:
        return None


# ── Today's scoreboard ───────────────────────────────────────────────────────

def get_today_games() -> list[dict]:
    """Return all games scheduled for today."""
    try:
        sb = scoreboardv2.ScoreboardV2()
        games_raw   = sb.game_header.get_dict()
        linescore   = sb.line_score.get_dict()

        game_headers = [dict(zip(games_raw["headers"], row)) for row in games_raw["data"]]
        line_rows    = [dict(zip(linescore["headers"], row)) for row in linescore["data"]]

        # Build a map of GAME_ID -> [away_line, home_line]
        line_map: dict[str, list] = {}
        for row in line_rows:
            gid = row["GAME_ID"]
            line_map.setdefault(gid, []).append(row)

        games = []
        for g in game_headers:
            gid   = g["GAME_ID"]
            lines = line_map.get(gid, [{}, {}])
            away  = lines[0] if len(lines) > 0 else {}
            home  = lines[1] if len(lines) > 1 else {}

            status_code = g.get("GAME_STATUS_ID", 1)
            if status_code == 1:
                status = g.get("GAME_STATUS_TEXT", "").strip()
                quarter = None
            elif status_code == 2:
                status = "Live"
                quarter = f"Q{g.get('PERIOD', '?')} {g.get('GAME_CLOCK', '').replace('PT', '').replace('S', '').replace('M', ':')}"
            else:
                status = "Final"
                quarter = None

            games.append({
                "game_id":     gid,
                "status":      status,
                "quarter":     quarter,
                "away_team":   away.get("TEAM_ABBREVIATION", ""),
                "away_city":   away.get("TEAM_CITY_NAME", ""),
                "away_name":   away.get("TEAM_NAME", ""),
                "away_score":  away.get("PTS", 0),
                "home_team":   home.get("TEAM_ABBREVIATION", ""),
                "home_city":   home.get("TEAM_CITY_NAME", ""),
                "home_name":   home.get("TEAM_NAME", ""),
                "home_score":  home.get("PTS", 0),
            })
        return games
    except Exception as e:
        print(f"[nba_helpers] get_today_games error: {e}")
        return []


# ── Player today's stats ─────────────────────────────────────────────────────

def get_player_today_stats(nba_id: int) -> dict | None:
    """
    Return a player's stats from today's game, or None if they didn't play.
    Uses the most recent entry in their game log; checks the date matches today.
    """
    today = datetime.date.today().strftime("%m/%d/%Y")
    try:
        log = playergamelog.PlayerGameLog(
            player_id=nba_id,
            season=SEASON,
            season_type_all_star="Regular Season",
        )
        rows    = log.player_game_log.get_dict()
        headers = rows["headers"]
        data    = rows["data"]

        if not data:
            return None

        latest = dict(zip(headers, data[0]))

        # GAME_DATE format: "MAR 05, 2026" — normalise and compare
        game_date_str = latest.get("GAME_DATE", "")
        game_date = datetime.datetime.strptime(game_date_str, "%b %d, %Y").date()
        if game_date != datetime.date.today():
            return None

        return {
            "pts": latest.get("PTS", 0),
            "reb": latest.get("REB", 0),
            "ast": latest.get("AST", 0),
            "stl": latest.get("STL", 0),
            "blk": latest.get("BLK", 0),
            "min": latest.get("MIN", "0"),
            "fgm": latest.get("FGM", 0),
            "fga": latest.get("FGA", 0),
            "tpm": latest.get("FG3M", 0),
            "matchup": latest.get("MATCHUP", ""),
        }
    except Exception as e:
        print(f"[nba_helpers] get_player_today_stats({nba_id}) error: {e}")
        return None


# ── Season averages ──────────────────────────────────────────────────────────

def get_player_season_averages(nba_id: int) -> dict | None:
    """Return season averages for a player from their game log."""
    try:
        log = playergamelog.PlayerGameLog(
            player_id=nba_id,
            season=SEASON,
            season_type_all_star="Regular Season",
        )
        rows    = log.player_game_log.get_dict()
        headers = rows["headers"]
        data    = rows["data"]

        if not data:
            return None

        def avg(key):
            vals = [dict(zip(headers, r)).get(key, 0) or 0 for r in data]
            return round(sum(vals) / len(vals), 1) if vals else 0.0

        return {
            "games": len(data),
            "pts":   avg("PTS"),
            "reb":   avg("REB"),
            "ast":   avg("AST"),
            "stl":   avg("STL"),
            "blk":   avg("BLK"),
        }
    except Exception as e:
        print(f"[nba_helpers] get_player_season_averages({nba_id}) error: {e}")
        return None


# ── Standings ────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _standings_cache_key():
    """Returns today's date string — used to bust the lru_cache daily."""
    return datetime.date.today().isoformat()

def get_standings() -> dict:
    """Return East and West standings as lists."""
    try:
        standings = leaguestandingsv3.LeagueStandingsV3(season=SEASON)
        rows    = standings.standings.get_dict()
        headers = rows["headers"]
        data    = rows["data"]

        east, west = [], []
        for row in data:
            d = dict(zip(headers, row))
            entry = {
                "team":     d.get("TeamAbbreviation", ""),
                "city":     d.get("TeamCity", ""),
                "name":     d.get("TeamName", ""),
                "wins":     d.get("WINS", 0),
                "losses":   d.get("LOSSES", 0),
                "pct":      f".{int(float(d.get('WinPCT', 0)) * 1000):03d}",
                "conf_rank": d.get("ConferenceRecord", ""),
            }
            if d.get("Conference") == "East":
                east.append(entry)
            else:
                west.append(entry)

        east.sort(key=lambda x: -x["wins"])
        west.sort(key=lambda x: -x["wins"])
        return {"east": east, "west": west}
    except Exception as e:
        print(f"[nba_helpers] get_standings error: {e}")
        return {"east": [], "west": []}
