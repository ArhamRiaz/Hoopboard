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
    - today's games
    - standings
    - for each favourited player: bio + season averages + today's stats (if played)
    """
    games     = get_today_games()
    standings = get_standings()
    favs      = Favourite.query.all()

    players_data = []
    for fav in favs:
        today_stats = get_player_today_stats(fav.nba_id)
        averages    = get_player_season_averages(fav.nba_id)
        players_data.append({
            "nba_id":     fav.nba_id,
            "name":       fav.name,
            "team":       fav.team,
            "position":   fav.position,
            "averages":   averages,
            "today":      today_stats,   # None if didn't play / no game
            "played_today": today_stats is not None,
        })

    return jsonify({
        "games":     games,
        "standings": standings,
        "players":   players_data,
    })
