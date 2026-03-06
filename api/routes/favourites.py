from flask import Blueprint, jsonify, request
from app import db
from models.favourite import Favourite

favourites_bp = Blueprint("favourites", __name__)


@favourites_bp.route("/", methods=["GET"])
def get_favourites():
    """GET /api/favourites/ — list all favourited players."""
    favs = Favourite.query.all()
    return jsonify([f.to_dict() for f in favs])


@favourites_bp.route("/", methods=["POST"])
def add_favourite():
    """
    POST /api/favourites/
    Body: { "nba_id": 2544, "name": "LeBron James", "team": "LAL", "position": "SF" }
    """
    data = request.get_json()
    if not data or "nba_id" not in data:
        return jsonify({"error": "nba_id is required"}), 400

    existing = Favourite.query.filter_by(nba_id=data["nba_id"]).first()
    if existing:
        return jsonify(existing.to_dict()), 200

    fav = Favourite(
        nba_id=data["nba_id"],
        name=data.get("name", ""),
        team=data.get("team", ""),
        position=data.get("position", ""),
    )
    db.session.add(fav)
    db.session.commit()
    return jsonify(fav.to_dict()), 201


@favourites_bp.route("/<int:nba_id>", methods=["DELETE"])
def remove_favourite(nba_id):
    """DELETE /api/favourites/<nba_id> — remove a player from favourites."""
    fav = Favourite.query.filter_by(nba_id=nba_id).first()
    if not fav:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(fav)
    db.session.commit()
    return jsonify({"deleted": nba_id}), 200
