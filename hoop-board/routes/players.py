from flask import Blueprint, jsonify, request
from nba_helpers import (
    search_players,
    get_player_info,
    get_player_season_averages,
    get_player_today_stats,
)

players_bp = Blueprint("players", __name__)


@players_bp.route("/search")
def search():
    """
    GET /api/players/search?q=lebron
    Returns up to 20 matching players.
    """
    q = request.args.get("q", "").strip()
    if not q or len(q) < 2:
        return jsonify([])
    return jsonify(search_players(q))


@players_bp.route("/<int:nba_id>")
def player_detail(nba_id):
    """
    GET /api/players/<nba_id>
    Returns bio + season averages for a player.
    """
    info = get_player_info(nba_id)
    if not info:
        return jsonify({"error": "Player not found"}), 404

    averages = get_player_season_averages(nba_id)
    return jsonify({**info, "averages": averages})


@players_bp.route("/<int:nba_id>/stats/today")
def today_stats(nba_id):
    """
    GET /api/players/<nba_id>/stats/today
    Returns today's game stats or {"played": false} if no game.
    """
    stats = get_player_today_stats(nba_id)
    if stats is None:
        return jsonify({"played": False})
    return jsonify({"played": True, **stats})
