import React, { useState, useEffect, Suspense, lazy } from "react";
import { CssBaseline, Box, Container, Typography, Paper, Divider, IconButton, Link, MenuItem, Select, Skeleton, CircularProgress } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Footer from "./components/Footer";
import { ErrorProvider } from "./contexts/ErrorContext";
import ErrorDisplay from "./components/ErrorDisplay";
import apiService from "./services/api";

// Lazy load large components
const CourseSelector = lazy(() => import("./components/CourseSelector"));
const WelcomeTutorial = lazy(() => import("./components/WelcomeTutorial"));

function AppContent() {
  const [currentTerm, setCurrentTerm] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [terms, setTerms] = useState([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termsError, setTermsError] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [blockedHours, setBlockedHours] = useState([]);

  // Load terms on mount
  useEffect(() => {
    setTermsLoading(true);
    apiService.getTerms()
      .then(data => {
        setTerms(data);
        if (data.length > 0 && !currentTerm) {
          setCurrentTerm(data[0]);
        }
        setTermsLoading(false);
      })
      .catch(() => {
        setTermsError(true);
        setTermsLoading(false);
      });
  }, [currentTerm]);

  // Tutorial state
  useEffect(() => {
    const hide = localStorage.getItem('yuSchedulerHideTutorial');
    if (!hide) setTutorialOpen(true);
  }, []);

  // Term change handler
  const handleChangeTerm = (event) => {
    setCurrentTerm(event.target.value);
  };

  // Schedule handler
  const handleSchedule = (data, courses) => {
    setScheduleData(data);
    setSelectedCourses(courses);
    setHasGenerated(true);
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          bgcolor: "#f5f6fa",
          minHeight: "100vh",
          py: { xs: 1, sm: 2, md: 4 }
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 } }}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 1.5, sm: 2, md: 4 },
              mb: { xs: 2, md: 4 },
              position: 'relative'
            }}
          >
            {/* Help Button */}
            <IconButton
              onClick={() => setTutorialOpen(true)}
              aria-label="Show tutorial"
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                right: { xs: 8, sm: 16 },
                color: 'primary.main',
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#bbdefb',
                  transform: 'scale(1.05)',
                },
                zIndex: 1
              }}
              size="small"
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
            {/* Header */}
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
                  href="https://github.com/arvemy/YUScheduler"
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
                  href="https://linkedin.com/in/2123ardakorkmaz"
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

              {/* Term Dropdown */}
              {termsLoading ? (
                <Skeleton variant="rectangular" width={220} height={40} sx={{ borderRadius: 2, mt: 1 }} />
              ) : termsError ? (
                <Typography color="error" sx={{ mt: 1 }}>
                  Failed to load terms
                </Typography>
              ) : (
                <Select
                  value={currentTerm || ''}
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
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                    border: '2px solid rgba(25, 118, 210, 0.2)',
                    '&:hover': {
                      border: '2px solid rgba(25, 118, 210, 0.5)',
                    },
                    '&.Mui-focused': {
                      border: '2px solid #1976d2',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                    },
                    '& .MuiSelect-select': {
                      fontWeight: 800,
                      color: '#1976d2',
                      textAlign: 'center',
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                        '& .MuiMenuItem-root': {
                          fontWeight: 600,
                          fontSize: 15,
                          my: 0.5,
                        }
                      }
                    }
                  }}
                >
                  {terms.map((term) => (
                    <MenuItem key={term} value={term}>{term}</MenuItem>
                  ))}
                </Select>
              )}
            </Box>

            {/* Divider */}
            <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

            {/* Main content */}
            <Box>
              <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
                <CourseSelector
                  onSchedule={handleSchedule}
                  term={currentTerm}
                  blockedHours={blockedHours}
                  setBlockedHours={setBlockedHours}
                  scheduleData={scheduleData}
                  selectedCourses={selectedCourses}
                  hasGenerated={hasGenerated}
                  resetSchedule={() => setHasGenerated(false)}
                />
              </Suspense>
            </Box>
          </Paper>

          <Footer />
        </Container>
      </Box>

      {/* Tutorial dialog */}
      <Suspense fallback={null}>
        <WelcomeTutorial
          open={tutorialOpen}
          setOpen={setTutorialOpen}
        />
      </Suspense>

      {/* Error display component */}
      <ErrorDisplay />
    </>
  );
}

function App() {
  return (
    <ErrorProvider>
      <AppContent />
    </ErrorProvider>
  );
}

export default App;