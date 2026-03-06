from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///hoopboard.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    db.init_app(app)

    from routes.games import games_bp
    from routes.players import players_bp
    from routes.favourites import favourites_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(games_bp, url_prefix="/api/games")
    app.register_blueprint(players_bp, url_prefix="/api/players")
    app.register_blueprint(favourites_bp, url_prefix="/api/favourites")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    with app.app_context():
        db.create_all()

    return app
