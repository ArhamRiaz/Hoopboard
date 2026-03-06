from flask import Blueprint, jsonify
from nba_helpers import get_today_games, get_standings

games_bp = Blueprint("games", __name__)


@games_bp.route("/today")
def today():
    """GET /api/games/today — all games for today."""
    return jsonify(get_today_games())


@games_bp.route("/standings")
def standings():
    """GET /api/games/standings — current East/West standings."""
    return jsonify(get_standings())
