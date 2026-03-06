from app import db

class Favourite(db.Model):
    __tablename__ = "favourites"

    id       = db.Column(db.Integer, primary_key=True)
    nba_id   = db.Column(db.Integer, unique=True, nullable=False)
    name     = db.Column(db.String(100), nullable=False)
    team     = db.Column(db.String(50))
    position = db.Column(db.String(10))

    def to_dict(self):
        return {
            "id":       self.id,
            "nba_id":   self.nba_id,
            "name":     self.name,
            "team":     self.team,
            "position": self.position,
        }
