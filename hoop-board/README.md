# Hoopboard — Flask Backend

## Project Structure
```
hoopboard/
├── run.py               # Entry point
├── app.py               # App factory, DB init, blueprint registration
├── nba_helpers.py       # All nba_api calls (search, scores, stats, standings)
├── requirements.txt
├── models/
│   └── favourite.py     # SQLAlchemy model for saved players
└── routes/
    ├── games.py         # GET /api/games/today, /api/games/standings
    ├── players.py       # GET /api/players/search, /api/players/<id>
    ├── favourites.py    # GET/POST/DELETE /api/favourites/
    └── dashboard.py     # GET /api/dashboard/  (aggregated)
```

## Setup

### 1. Create and activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the server
```bash
python run.py
```
Server starts at **http://localhost:5000**

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games/today` | All games today (scores, status, live quarter) |
| GET | `/api/games/standings` | East + West conference standings |
| GET | `/api/players/search?q=` | Search players by name |
| GET | `/api/players/<nba_id>` | Player bio + season averages |
| GET | `/api/players/<nba_id>/stats/today` | Today's game stats (or `{played: false}`) |
| GET | `/api/favourites/` | List all favourited players |
| POST | `/api/favourites/` | Add a player to favourites |
| DELETE | `/api/favourites/<nba_id>` | Remove a player from favourites |
| GET | `/api/dashboard/` | All dashboard data in one request |

### POST /api/favourites/ — Request Body
```json
{
  "nba_id": 2544,
  "name": "LeBron James",
  "team": "LAL",
  "position": "SF"
}
```

---

## Notes
- Database is SQLite (`hoopboard.db`), auto-created on first run. No setup needed.
- `nba_api` calls are rate-limited by the NBA. The dashboard endpoint batches requests for all favourited players — keep favourites list reasonable (< 15 players) to avoid timeouts.
- CORS is configured for `http://localhost:5173` (Vite default). Change in `app.py` if needed.
- Season is hardcoded to `2024-25` in `nba_helpers.py`. Update for new seasons.
