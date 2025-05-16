# YU Scheduler

A web application for Yaşar University students to plan and generate course schedules.

## Features

- Search and select courses from the university catalog
- Block out unavailable hours
- Generate all possible schedules
- Download schedules as PDF or image
- Modern, responsive UI (React + Material UI)
- Fast backend API (Flask)

## Project Structure

```
YUScheduler/
├── app.py                  # Flask backend
├── courses.json            # Course/session data
├── requirements.txt        # Backend dependencies
├── yuscheduler-frontend/   # React frontend
```

## Getting Started

### Backend (Flask)

1. Install Python 3.8+
2. Create a virtual environment (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend:
   ```bash
   python app.py
   ```
   The API will be available at [http://localhost:5000](http://localhost:5000).

### Frontend (React)

1. Go to the frontend directory:
   ```bash
   cd yuscheduler-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The app will run at [http://localhost:3000](http://localhost:3000).

## Deployment

- For production, use a WSGI server (e.g., gunicorn) for the backend and serve the frontend build with a static file server or reverse proxy.
- Update API URLs in the frontend if deploying to a different backend address.

## License

MIT License. See [LICENSE](LICENSE).

---

_Made with ❤️ for Yaşar University students._
