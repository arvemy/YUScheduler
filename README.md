# YU Scheduler 📚

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-000000.svg)](https://flask.palletsprojects.com/)
[![Material UI](https://img.shields.io/badge/Material_UI-7.1-0081CB.svg)](https://mui.com/)

A modern, Yaşar University course scheduler application that helps students plan their academic timetables efficiently.


## 💡 Project Overview

YUScheduler solves a real-world problem for Yaşar University students by automating the complex task of creating conflict-free class schedules while accommodating personal time constraints.

### Key Features

- 🧠 **Intelligent Schedule Generation** - Automatically creates all possible conflict-free timetables from selected courses
- ⏰ **Time Blocking System** - Users can block off hours when they're unavailable for classes
- 🔍 **Smart Course Search** - Fast, intuitive course selection with department filtering
- 📱 **Responsive Design** - Fully optimized experience across desktop and mobile devices
- 📊 **Visual Schedule Display** - Clear, user-friendly visualization of generated schedules
- 📤 **Export Functionality** - Download schedules as PDF or image files
- ⚡ **Performance Optimization** - Fast algorithm for schedule generation with caching

## 🛠️ Technologies

### Frontend
- **React 19.1** with React Hooks for state management
- **Material UI 7.1** for modern, responsive UI components
- **Axios** with retry logic for robust API interactions
- **Context API** for global state management
- **Error Handling System** with custom error display components
- **Lazy Loading** for optimized performance

### Backend
- **Flask** REST API with comprehensive error handling
- **Custom Algorithm** for generating conflict-free schedules
- **Rate Limiting** to protect against abuse
- **CORS Support** for cross-origin requests
- **Talisman** for improved security headers
- **Production-Ready** with gunicorn server

### DevOps
- **Render** for backend deployment
- **GitHub** for version control
- **Environment Variable** configuration for different environments

## 🖼️ Architecture

The application follows a modern client-server architecture:

```
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│  React Frontend │ ◄──► │   Flask API     │
│  (Material UI)  │      │                 │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
        ▲                        ▲
        │                        │
        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│  User Interface │      │   Course Data   │
│   Components    │      │     (JSON)      │
└─────────────────┘      └─────────────────┘
```

## 🔍 Technical Highlights

- **Algorithmic Challenge**: Implemented an efficient algorithm to generate valid schedules given multiple constraints
- **Error Handling**: Comprehensive error handling with specific feedback for constraint conflicts
- **Performance**: Optimized data processing with caching for frequently accessed course data
- **Clean Architecture**: Separation of concerns between UI components and business logic
- **API Design**: RESTful API with detailed status codes and error messages

## 📝 What I Learned

- Building robust full-stack applications with React and Flask
- Implementing complex algorithms for constraint satisfaction problems
- Creating intuitive user interfaces for complex data entry and visualization
- Developing comprehensive error handling systems
- Deploying and configuring applications for production

## 🚀 Quick Setup

If you'd like to run the project locally:

1. Clone the repository
2. Set up the backend:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```
3. Set up the frontend:
   ```bash
   cd yuscheduler-frontend
   npm install
   npm start
   ```

See [API.md](API.md) for detailed API documentation.

## 📧 Contact

**Arda Korkmaz**
- GitHub: [@arvemy](https://github.com/arvemy)
- LinkedIn: [Arda Korkmaz](https://linkedin.com/in/2123ardakorkmaz)

---

<p align="center">Made with ❤️ by Arda Korkmaz</p>
