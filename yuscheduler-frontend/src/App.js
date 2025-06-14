import React, { useState, useEffect, Suspense, lazy } from "react";
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CssBaseline, Box, Container, Typography, Paper, Divider, IconButton, Link, MenuItem, Select, Skeleton, CircularProgress, Fab, Zoom, Alert, Snackbar } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import { store } from './store';
import { useGetTermsQuery } from './store/api';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentTerm } from './store/slices/scheduleSlice';
import { updatePreference } from './store/slices/preferencesSlice';
import ErrorBoundary from './components/ErrorBoundary';
import AccessibilityProvider from './components/AccessibilityProvider';
import useOffline from './hooks/useOffline';
import './i18n';

// Lazy load large components
const CourseSelector = lazy(() => import("./components/CourseSelector"));
const ScheduleResults = lazy(() => import("./components/ScheduleResults"));
const WelcomeTutorial = lazy(() => import("./components/WelcomeTutorial"));

// Create a query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { isOnline, wasOffline } = useOffline();
  
  // Redux state
  const currentTerm = useSelector((state) => state.schedule.currentTerm);
  const preferences = useSelector((state) => state.preferences);
  
  // Local state
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [offlineSnackbar, setOfflineSnackbar] = useState(false);

  // API queries
  const { data: terms = [], isLoading: termsLoading, error: termsError } = useGetTermsQuery();

  // Set initial term when terms are loaded
  useEffect(() => {
    if (terms.length > 0 && !currentTerm) {
      dispatch(setCurrentTerm(terms[0]));
    }
  }, [terms, currentTerm, dispatch]);

  // Tutorial state
  useEffect(() => {
    const hide = localStorage.getItem('yuSchedulerHideTutorial');
    if (!hide) setTutorialOpen(true);
  }, []);

  // Back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Offline handling
  useEffect(() => {
    if (!isOnline) {
      setOfflineSnackbar(true);
    } else if (wasOffline) {
      setOfflineSnackbar(false);
    }
  }, [isOnline, wasOffline]);

  // Language change handler
  const handleLanguageChange = (newLanguage) => {
    i18n.changeLanguage(newLanguage);
    dispatch(updatePreference({ key: 'language', value: newLanguage }));
  };

  // Term change handler
  const handleChangeTerm = (event) => {
    dispatch(setCurrentTerm(event.target.value));
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Service worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <>
      <CssBaseline />
      <Box 
        sx={{ 
          bgcolor: "#f5f6fa", 
          minHeight: "100vh", 
          py: { xs: 1, sm: 2, md: 4 } 
        }}
        id="main-content"
        tabIndex={-1}
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
            {/* Accessibility and language controls */}
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                gap: 1,
                zIndex: 10,
              }}
            >
              {/* Language selector */}
              <IconButton
                aria-label={t('settings.language')}
                onClick={() => handleLanguageChange(preferences.language === 'en' ? 'tr' : 'en')}
                sx={{
                  color: 'primary.main',
                  background: '#e3f2fd',
                  fontSize: 24,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:hover': {
                    background: '#bbdefb',
                    color: '#1976d2',
                  },
                }}
                size="large"
              >
                <LanguageIcon fontSize="inherit" />
              </IconButton>

              {/* Tutorial button */}
              <IconButton
                aria-label={t('accessibility.openTutorial')}
                onClick={() => setTutorialOpen(true)}
                sx={{
                  color: 'primary.main',
                  background: '#e3f2fd',
                  fontSize: 26,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:hover': {
                    background: '#bbdefb',
                    color: '#1976d2',
                  },
                }}
                size="large"
              >
                <HelpOutlineIcon fontSize="inherit" />
              </IconButton>
            </Box>

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
                {t('app.title')}
              </Typography>

              {/* Term Dropdown */}
              {termsLoading ? (
                <Skeleton variant="rectangular" width={220} height={40} sx={{ borderRadius: 2, mt: 1 }} />
              ) : termsError ? (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {t('errors.courseLoadError')}
                </Alert>
              ) : (
                <Select
                  value={currentTerm}
                  onChange={handleChangeTerm}
                  size="small"
                  displayEmpty
                  aria-label={t('schedule.termSelection')}
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
                  {terms.map((term) => (
                    <MenuItem value={term} key={term}>
                      {term}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Course Selector */}
            <ErrorBoundary>
              <Suspense fallback={<Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, my: 2 }} />}>
                {currentTerm ? (
                  <CourseSelector term={currentTerm} />
                ) : (
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, my: 2 }} />
                )}
              </Suspense>
            </ErrorBoundary>
          </Paper>

          {/* Schedule Results */}
          <ErrorBoundary>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}><CircularProgress /></Box>}>
              <ScheduleResults />
            }
            </Suspense>
          </ErrorBoundary>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: { xs: 4, sm: 8 },
            py: { xs: 1.5, sm: 2.5 },
            px: { xs: 1, sm: 3 },
            textAlign: 'center',
            color: 'primary.dark',
            background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
            borderRadius: 3,
            boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.08)',
            fontFamily: 'Montserrat, Roboto, Arial',
            maxWidth: { xs: 280, sm: 340 },
            mx: 'auto',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: 15, sm: 17 },
              letterSpacing: 1,
              color: 'primary.dark',
              fontFamily: 'Montserrat, Roboto, Arial',
            }}
          >
            {t('app.madeWith')}
          </Typography>
        </Box>

        {/* Back to top button */}
        <Zoom in={showBackToTop}>
          <Fab
            color="primary"
            aria-label={t('accessibility.backToTop')}
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

        {/* Offline notification */}
        <Snackbar
          open={offlineSnackbar}
          message={t('errors.offlineError')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          sx={{ mb: 8 }}
        />
      </Box>

      {/* Tutorial */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <WelcomeTutorial open={tutorialOpen} setOpen={setTutorialOpen} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Provider>
  );
}

export default App;