# YU Scheduler API Documentation

Base URL: `https://yuscheduler.com/` (or your deployment)

## Endpoints

### Health Check

- **GET** `/health`
- **Response:** `{ "status": "ok" }`

### Get Terms

- **GET** `/api/terms`
- **Response:**
  ```json
  ["2024-2025 Spring", "2023-2024 Spring", ...]
  ```

### Get Courses

- **GET** `/api/courses?term=2024-2025%20Spring`
- **Query Params:**
  - `term` (optional): Academic term name
- **Response:**
  ```json
  {
    "CSE": ["CSE 101", "CSE 102"],
    "MATH": ["MATH 101", ...],
    ...
  }
  ```

### Get Sections

- **GET** `/api/sections?term=2024-2025%20Spring`
- **Query Params:**
  - `term` (optional): Academic term name
- **Response:**
  ```json
  {
    "CSE 101": ["A", "B"],
    ...
  }
  ```

### Generate Schedule

- **POST** `/api/generate_schedule`
- **Body:**
  ```json
  {
    "courses": [
      { "course": "CSE 101", "section": "A" },
      { "course": "MATH 101" }
    ],
    "blocked_hours": [{ "day": "Monday", "slot": "08:40-09:30" }],
    "term": "2024-2025 Spring"
  }
  ```
- **Response:**
  ```json
  {
    "warnings": ["Course 'CSE 101' was excluded: ..."],
    "schedules": [
      {
        "sections": [
          {
            "course": "CSE 101",
            "section": "A",
            "sessions": [
              { "Day": "Monday", "Start Time": "08:40", "End Time": "09:30", ... }
            ]
          }
        ]
      }
    ],
    "time_slots": ["08:40-09:30", ...],
    "days_of_week": ["Monday", ...]
  }
  ```

## Error Responses

- All endpoints may return `{ "error": "..." }` with appropriate HTTP status codes.

---

For more details, see the backend source code or contact the maintainer.
