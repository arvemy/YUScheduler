# YU Scheduler API Documentation

This document outlines the REST API architecture for the YU Scheduler application. The API is designed with simplicity, performance, and scalability in mind, following RESTful principles.

## API Overview

The YU Scheduler API powers the course scheduling system with these key characteristics:
- **RESTful Design** - Resource-oriented endpoints using standard HTTP methods
- **JSON Responses** - Consistent data format for all responses
- **Error Handling** - Comprehensive error codes and descriptive messages
- **Rate Limiting** - Protection against abuse while ensuring availability
- **Caching** - Performance optimization for frequently accessed data

## Technical Implementation

- **Framework**: Flask (Python 3.8+)
- **Response Format**: JSON
- **Authentication**: None (public API with rate limiting)
- **Security**: CORS protection, Talisman for security headers
- **Performance**: LRU caching for course data
- **Error Handling**: Custom error handlers for all HTTP status codes

## Rate Limiting

To ensure service availability and prevent abuse, the API implements the following limits:

| Endpoint | Rate Limit |
|----------|------------|
| Default | 100 requests/hour/IP |
| Schedule Generation | 30 requests/hour/IP |
| Sections | 200 requests/hour/IP |
| Terms/Courses | 300 requests/hour/IP |

## Endpoints

### Health Check

```http
GET /health
```

**Response** (200 OK)
```json
{
  "status": "ok"
}
```

### Get Available Terms

Retrieves all available academic terms.

```http
GET /api/terms
```

**Response** (200 OK)
```json
[
  "2024-2025 Spring",
  "2023-2024 Spring",
  "2022-2023 Spring"
]
```

### Get Courses by Term

Retrieves all courses grouped by department for a specific term.

```http
GET /api/courses?term={term}
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | string | No | Academic term (e.g., "2024-2025 Spring"). If omitted, uses the latest term. |

**Response** (200 OK)
```json
{
  "COMP": [
    "COMP 1202",
    "COMP 2215",
    "COMP 3304"
  ],
  "MATH": [
    "MATH 1131",
    "MATH 1132"
  ]
}
```

### Get Course Sections

Retrieves available sections for each course in a term.

```http
GET /api/sections?term={term}
```

**Response** (200 OK)
```json
{
  "COMP 1202": ["1", "2"],
  "MATH 1131": ["1", "2"]
}
```

### Generate Schedule

The most complex endpoint - generates all possible conflict-free schedules based on selected courses and constraints.

```http
POST /api/generate_schedule
```

**Request Body**
```json
{
  "courses": [
    {
      "course": "COMP 1202",
      "section": "1"
    },
    {
      "course": "MATH 1131",
      "section": null
    }
  ],
  "blocked_hours": [
    {
      "day": "Monday",
      "slot": "08:40-09:30"
    }
  ],
  "term": "2024-2025 Spring"
}
```

**Response** (200 OK)
```json
{
  "warnings": [
    "PHYS 1001: No section data is available for this term. Please check if the course is offered or try another term."
  ],
  "schedules": [
    {
      "sections": [
        {
          "course": "COMP 1202",
          "section": "1",
          "sessions": [
            {
              "Section": "1",
              "Day": "Tuesday",
              "Start Time": "10:40",
              "End Time": "12:30",
              "Classroom": "Y007"
            }
          ]
        },
        {
          "course": "MATH 1131",
          "section": "2",
          "sessions": [
            {
              "Section": "2",
              "Day": "Tuesday",
              "Start Time": "08:40",
              "End Time": "11:30",
              "Classroom": "T(-1 B10)"
            }
          ]
        }
      ]
    }
  ],
  "time_slots": [
    "08:40-09:30",
    "09:40-10:30"
  ],
  "days_of_week": [
    "Monday",
    "Tuesday"
  ]
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Error Status Codes**
- `400 Bad Request`: Invalid request parameters or body
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: Invalid HTTP method for endpoint
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

## Technical Highlights

### 1. Schedule Generation Algorithm

The core scheduling algorithm implements these steps:
1. Validate and process user input (courses and blocked hours)
2. Identify eligible course sections based on time constraints
3. Generate all possible combinations using Python's `itertools.product`
4. Filter combinations for time conflicts
5. Organize results for optimal frontend consumption

### 2. Conflict Detection

The API includes sophisticated conflict detection:
- Course-to-course time conflicts
- Course-to-blocked hour conflicts
- Detailed warning messages with specific conflict information

### 3. Performance Optimizations

- LRU caching for course data with `@lru_cache` decorator
- Efficient data structures for quick time slot comparisons
- Early filtering of ineligible sections

### 4. Robust Error Handling

- Global error handlers for all error types
- Detailed error messages with context
- Consistent error response format

## API Design Decisions

1. **RESTful Architecture**: Resources (terms, courses, sections, schedules) are accessed through meaningful URLs
2. **Default Values**: Latest term is used when term parameter is omitted
3. **Verbose Responses**: Includes warnings, metadata, and helpful context in responses
4. **Consistent Format**: Standardized JSON structure for all responses
5. **Comprehensive Documentation**: Clear examples and parameter descriptions

This API demonstrates best practices in backend development, algorithm implementation, and error handling for web services.

---

<p align="center">Made with ❤️ by Arda Korkmaz</p>
