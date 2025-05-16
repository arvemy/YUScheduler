import React, { useState, useEffect, Suspense, lazy } from "react";
import { CssBaseline, Box, Container, Typography, Paper, Divider, IconButton, Link, MenuItem, Select, Skeleton, CircularProgress, Fab, Zoom } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Footer from "./components/Footer";

// Lazy load large components
const CourseSelector = lazy(() => import("./components/CourseSelector"));
const ScheduleResults = lazy(() => import("./components/ScheduleResults"));
const WelcomeTutorial = lazy(() => import("./components/WelcomeTutorial"));

// Default values for timetable grid
const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_SLOTS = [
  "08:40-09:30",
  "09:40-10:30",
  "10:40-11:30",
  "11:40-12:30",
  "12:40-13:30",
  "13:40-14:30",
  "14:40-15:30",
  "15:40-16:30",
  "16:40-17:30",
  "17:40-18:30",
  "18:40-19:30",
  "19:40-20:30",
  "20:40-21:30",
  "21:40-22:30",
];

function App() {
  const [schedules, setSchedules] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_SLOTS);
  const [daysOfWeek, setDaysOfWeek] = useState(DEFAULT_DAYS);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [blockedHours, setBlockedHours] = useState([]); // Array of { day, slot }
  const [terms, setTerms] = useState([]);
  const [term, setTerm] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  useEffect(() => {
    fetch(`${API_BASE}/api/terms`)
      .then((res) => res.json())
      .then((data) => {
        setTerms(data);
        if (data.length > 0) setTerm(data[0]);
      });
  }, []);

  useEffect(() => {
    const hide = localStorage.getItem('yuSchedulerHideTutorial');
    if (!hide) setTutorialOpen(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSchedule = (result, selected) => {
    setSchedules(result.schedules || []);
    setWarnings(result.warnings || []);
    setTimeSlots(result.time_slots && result.time_slots.length > 0 ? result.time_slots : DEFAULT_SLOTS);
    setDaysOfWeek(result.days_of_week && result.days_of_week.length > 0 ? result.days_of_week : DEFAULT_DAYS);
    setSelectedCourses(selected || []);
    setHasGenerated(true);
  };

  const handleChangeTerm = (event) => {
    setTerm(event.target.value);
    setSchedules([]);
    setWarnings([]);
    setSelectedCourses([]);
    setHasGenerated(false);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}><CircularProgress /></Box>}>
        <WelcomeTutorial open={tutorialOpen} setOpen={setTutorialOpen} />
      </Suspense>
      <CssBaseline />
      <Box sx={{ bgcolor: "#f5f6fa", minHeight: "100vh", py: { xs: 1, sm: 2, md: 4 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 } }}>
          <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 2, md: 4 }, mb: { xs: 2, md: 4 }, position: 'relative' }}>
            {/* Question mark icon at top right */}
            <IconButton
              aria-label="Open tutorial"
              onClick={() => setTutorialOpen(true)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: 'primary.main',
                background: '#e3f2fd',
                fontSize: 26,
                borderRadius: 2,
                boxShadow: 1,
                zIndex: 10,
                '&:hover': {
                  background: '#bbdefb',
                  color: '#1976d2',
                },
              }}
              size="large"
            >
              <HelpOutlineIcon fontSize="inherit" />
            </IconButton>
            {/* Centered Name and Icons above Title */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mb: { xs: 1, sm: 2 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.2,
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: 16, sm: 18 },
                    letterSpacing: 1,
                    fontFamily: 'Montserrat, Roboto, Arial',
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Arda Korkmaz
                </Typography>
                <IconButton
                  component={Link}
                  href="https://github.com/ardakorkmaz"
                  target="_blank"
                  rel="noopener"
                  aria-label="GitHub"
                  sx={{
                    color: 'primary.main',
                    background: '#e3f2fd',
                    mx: 0.5,
                    fontSize: 22,
                    borderRadius: 2,
                    transition: 'background 0.2s, color 0.2s',
                    '&:hover': {
                      background: '#bbdefb',
                      color: '#1976d2',
                    },
                  }}
                  size="small"
                >
                  <GitHubIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  component={Link}
                  href="https://linkedin.com/in/ardakorkmaz"
                  target="_blank"
                  rel="noopener"
                  aria-label="LinkedIn"
                  sx={{
                    color: 'primary.main',
                    background: '#e3f2fd',
                    mx: 0.5,
                    fontSize: 22,
                    borderRadius: 2,
                    transition: 'background 0.2s, color 0.2s',
                    '&:hover': {
                      background: '#bbdefb',
                      color: '#1976d2',
                    },
                  }}
                  size="small"
                >
                  <LinkedInIcon fontSize="inherit" />
                </IconButton>
              </Box>
              <Typography
                variant="h3"
                align="center"
                gutterBottom
                fontWeight={900}
                sx={{
                  letterSpacing: 2,
                  fontFamily: 'Montserrat, Roboto, Arial',
                  background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                  textTransform: 'uppercase',
                  minWidth: 0,
                  textAlign: 'center',
                  fontSize: { xs: 24, sm: 32, md: 40 },
                }}
              >
              YU Scheduler
            </Typography>
              {/* Term Dropdown below title, centered */}
              <Select
                value={term}
                onChange={handleChangeTerm}
                size="small"
                displayEmpty
                sx={{
                  mt: 1,
                  minWidth: { xs: 140, sm: 180, md: 220 },
                  fontWeight: 700,
                  fontSize: { xs: 13, sm: 16 },
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  letterSpacing: 1,
                  background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
                  color: 'primary.dark',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: 2,
                  textTransform: 'uppercase',
                  fontFamily: 'Montserrat, Roboto, Arial',
                  whiteSpace: 'nowrap',
                  alignSelf: 'center',
                }}
              >
                {terms.map((t) => (
                  <MenuItem value={t} key={t}>{t}</MenuItem>
                ))}
              </Select>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Suspense fallback={<Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, my: 2 }} />}>
              {term ? (
                <CourseSelector onSchedule={handleSchedule} blockedHours={blockedHours} term={term} />
              ) : (
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, my: 2 }} />
              )}
            </Suspense>
          </Paper>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}><CircularProgress /></Box>}>
            <ScheduleResults
              schedules={schedules}
              warnings={warnings}
              timeSlots={timeSlots}
              daysOfWeek={daysOfWeek}
              selectedCourses={selectedCourses}
              hasGenerated={hasGenerated}
              blockedHours={blockedHours}
              setBlockedHours={setBlockedHours}
            />
          </Suspense>
        </Container>
        <Footer />
        <Zoom in={showBackToTop}>
          <Fab
            color="primary"
            aria-label="Back to top"
            onClick={handleBackToTop}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 1200,
              boxShadow: 6,
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Zoom>
      </Box>
    </>
  );
}

export default App;
