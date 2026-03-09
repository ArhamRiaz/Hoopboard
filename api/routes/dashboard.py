import datetime
from flask import Blueprint, jsonify
from models.favourite import Favourite
from nba_helpers import (
    get_today_games,
    get_standings,
    get_player_today_stats,
    get_player_season_averages,
)

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/")
def dashboard():
    """
    GET /api/dashboard/
    Returns everything the dashboard page needs in one shot:
    - games (today's or yesterday's if today hasn't started)
    - display_date (which date the games are from)
    - is_today (False = showing yesterday's results)
    - standings
    - for each favourited player: bio + season averages + stats for the display date
    """
    scoreboard   = get_today_games()
    games        = scoreboard["games"]
    display_date = datetime.date.fromisoformat(scoreboard["display_date"])
    is_today     = scoreboard["is_today"]

    standings = get_standings()
    favs      = Favourite.query.all()

    players_data = []
    for fav in favs:
        today_stats = get_player_today_stats(fav.nba_id, target_date=display_date)
        averages    = get_player_season_averages(fav.nba_id)
        players_data.append({
            "nba_id":       fav.nba_id,
            "name":         fav.name,
            "team":         fav.team,
            "position":     fav.position,
            "averages":     averages,
            "today":        today_stats,
            "played_today": today_stats is not None,
        })

    return jsonify({
        "games":        games,
        "display_date": scoreboard["display_date"],
        "is_today":     is_today,
        "standings":    standings,
        "players":      players_data,
    })