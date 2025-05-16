# YU Scheduler

**YU Scheduler** is a web application for students to plan and generate course schedules easily.

## Features

- Search and select courses from the university catalog
- Block out unavailable hours
- Generate all possible schedules
- Download schedules as PDF or image
- Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
   The app will run at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

The optimized build will be in the `build/` folder.

## Usage

- Select your courses using the search bar or course groups.
- Optionally, block out time slots you are unavailable.
- Click "Generate Schedule" to see all valid timetables.
- Download your preferred schedule as PDF or image.

## Backend API

This app requires the YU Scheduler backend (Flask) running at `http://localhost:5000` by default.

## License

MIT License. See [../LICENSE](../LICENSE).

---

_Made with ❤️ for students._
