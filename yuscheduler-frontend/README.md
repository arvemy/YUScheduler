# YU Scheduler Frontend

React-based frontend for the YU Scheduler application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🛠️ Development

### Environment Variables

Create a `.env` file in this directory:

```env
REACT_APP_API_BASE=http://localhost:5000
```

### Available Scripts

- `npm start` - Runs the app in development mode at [http://localhost:3000](http://localhost:3000)
- `npm test` - Launches the test runner in interactive watch mode
- `npm run build` - Builds the app for production to the `build` folder
- `npm run eject` - **Note: this is a one-way operation!**

### Project Structure

```
src/
├── components/         # React components
│   ├── CourseSelector.js
│   ├── ScheduleResults.js
│   ├── WelcomeTutorial.js
│   └── Footer.js
├── App.js             # Main app component
├── App.test.js        # App tests
├── index.js           # Entry point
└── index.css          # Global styles
```

## 📦 Dependencies

- **React 19** - UI framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **html2canvas** - Schedule export to image
- **jsPDF** - Schedule export to PDF

## 🎨 Features

- Responsive design for all devices
- Real-time schedule generation
- Interactive time blocking
- PDF/Image export functionality
- Clean Material Design interface

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details.

---

_Made with ❤️ for students._
