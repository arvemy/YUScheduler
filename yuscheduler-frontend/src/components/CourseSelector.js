import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Stack,
  Chip,
  Typography,
  TextField,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  ListItemText,
  InputAdornment,
  Grid,
  Autocomplete,
  Select,
  Divider,
  Alert,
  Tabs,
  Tab,
  ListItemIcon
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import RefreshIcon from '@mui/icons-material/Refresh';
import apiService from "../services/api";
import { useError } from "../contexts/ErrorContext";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import the Timetable component from ScheduleResults
import { Timetable, uniqueWarnings } from './ScheduleResults';

// Style constants
const chipStyle = {
  borderRadius: 2,
  boxShadow: 1,
  fontWeight: 600,
  letterSpacing: 0.5,
  transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
  bgcolor: 'background.paper',
};

const primaryChipStyle = {
  ...chipStyle,
  fontWeight: 500,
  fontSize: 15,
  letterSpacing: 0.3,
};

const groupChipStyle = {
  ...chipStyle,
  cursor: 'pointer',
  width: '100%',
  fontSize: 16,
  '&:hover': {
    bgcolor: 'primary.light',
    color: 'primary.contrastText',
    boxShadow: 4,
    transform: 'translateY(-2px) scale(1.04)',
  },
  '&:active': {
    boxShadow: 2,
    transform: 'scale(0.98)',
  },
};

const submitButtonStyle = {
  borderRadius: 3,
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: 1,
  boxShadow: 3,
  py: 1.5,
  transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
  bgcolor: 'primary.main',
  '&:hover': {
    bgcolor: 'primary.dark',
    boxShadow: 6,
    transform: 'translateY(-2px) scale(1.03)',
  },
  '&:active': {
    boxShadow: 2,
    transform: 'scale(0.98)',
  },
  '&.Mui-disabled': {
    bgcolor: 'grey.300',
    color: 'grey.600',
    boxShadow: 0,
    opacity: 0.7,
  },
};

function CourseSelector({ onSchedule, blockedHours, term, setBlockedHours, scheduleData, selectedCourses, hasGenerated, resetSchedule }) {
  const [courses, setCourses] = useState({});
  const [selected, setSelected] = useState([]);
  const [sectionChoices, setSectionChoices] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState(null);
  const { showError } = useError();

  // Schedule display state
  const [tab, setTab] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const scheduleRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  // Reset tab when scheduleData changes
  useEffect(() => {
    setTab(0);
  }, [scheduleData]);

  // Set selected courses when passed as prop
  useEffect(() => {
    if (selectedCourses && selectedCourses.length > 0) {
      setSelected(selectedCourses);
    }
  }, [selectedCourses]);

  // Default time slots and days
  const defaultTimeSlots = useMemo(() => [
    "08:40-09:30", "09:40-10:30", "10:40-11:30", "11:40-12:30",
    "12:40-13:30", "13:40-14:30", "14:40-15:30", "15:40-16:30",
    "16:40-17:30", "17:40-18:30", "18:40-19:30", "19:40-20:30",
    "20:40-21:30", "21:40-22:30"
  ], []);

  const defaultDaysOfWeek = useMemo(() => [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ], []);

  useEffect(() => {
    if (!term) return;

    // Reset state when term changes
    setLoading(true);
    setError(null);

    // Load courses for the selected term
    const loadCourses = async () => {
      try {
        const coursesData = await apiService.getCourses(term);
        setCourses(coursesData);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError('Failed to load courses. Please try again later.');
        showError(`Failed to load courses: ${err.message || 'Unknown error'}`);
      }
    };

    // Load sections for the selected term
    const loadSections = async () => {
      try {
        const sectionsData = await apiService.getSections(term);
        setSectionData(sectionsData);
      } catch (err) {
        showError(`Failed to load course sections: ${err.message || 'Unknown error'}`);
        setSectionData({});
      }
    };

    // Run both requests
    loadCourses();
    loadSections();
  }, [term, showError]);

  // Helper to get all sections for a course
  const getSectionsForCourse = (course) => {
    return sectionData[course] || [];
  };

  const allCourses = useMemo(() => Object.values(courses).flat(), [courses]);

  const handleSelect = (event, value) => {
    setSelected(value);
    setSectionChoices((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((c) => {
        if (!value.includes(c)) delete updated[c];
      });
      return updated;
    });
  };

  const handleSectionChange = (course, section) => {
    setSectionChoices((prev) => ({ ...prev, [course]: section === 'any' ? null : section }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selected.length) {
      showError("Please select at least one course");
      return;
    }

    setSubmitting(true);

    const courseSectionArray = selected.map((course) => ({
      course,
      section: sectionChoices[course] || null,
    }));

    try {
      const data = await apiService.generateSchedule({
        courses: courseSectionArray,
        blocked_hours: blockedHours,
        term: term,
      });

      onSchedule(data, selected);
    } catch (err) {
      showError(`Failed to generate schedule: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCourse = (course) => {
    setSelected((prev) =>
      prev.includes(course)
        ? prev.filter((c) => c !== course)
        : [...prev, course]
    );
  };

  const handleGroupClick = (event, prefix) => {
    setAnchorEl(event.currentTarget);
    setActiveGroup(prefix);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveGroup(null);
  };

  // Menu for download options
  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuDownloadClose = () => {
    setMenuAnchorEl(null);
  };

  // Download schedule functionality
  const handleDownload = async (type) => {
    if (!scheduleRef.current) return;

    // --- Begin robust fix: expand all containers and table ---
    let originalScrollWidth = null, originalScrollOverflow = null;
    let originalParentWidth = null, originalParentOverflow = null;
    let originalTableWidth = null, originalTableMaxWidth = null;
    let table = null;
    if (scrollRef.current) {
      const scrollBox = scrollRef.current;
      table = scrollBox.querySelector('table');
      if (table) {
        // Save original styles
        originalScrollWidth = scrollBox.style.width;
        originalScrollOverflow = scrollBox.style.overflowX;
        originalParentWidth = scheduleRef.current.style.width;
        originalParentOverflow = scheduleRef.current.style.overflow;
        originalTableWidth = table.style.width;
        originalTableMaxWidth = table.style.maxWidth;
        // Set to natural widths
        const tableNaturalWidth = table.scrollWidth + 'px';
        scrollBox.style.width = tableNaturalWidth;
        scrollBox.style.overflowX = 'visible';
        scheduleRef.current.style.width = tableNaturalWidth;
        scheduleRef.current.style.overflow = 'visible';
        table.style.width = tableNaturalWidth;
        table.style.maxWidth = 'none';
        // Scroll to leftmost
        scrollBox.scrollLeft = 0;
      }
    }
    // --- End robust fix ---

    try {
      const canvas = await html2canvas(scheduleRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      if (type === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 297; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`schedule-${tab + 1}.pdf`);
      } else if (type === 'image') {
        const link = document.createElement('a');
        link.download = `schedule-${tab + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Error generating download:', error);
    } finally {
      // --- Restore all styles ---
      if (scrollRef.current && table) {
        scrollRef.current.style.width = originalScrollWidth ?? '';
        scrollRef.current.style.overflowX = originalScrollOverflow ?? '';
        scheduleRef.current.style.width = originalParentWidth ?? '';
        scheduleRef.current.style.overflow = originalParentOverflow ?? '';
        table.style.width = originalTableWidth ?? '';
        table.style.maxWidth = originalTableMaxWidth ?? '';
      }
    }
    handleMenuDownloadClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <CircularProgress aria-label="Loading courses" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: 'column', alignItems: "center", minHeight: 200, color: 'error.main' }} aria-live="polite">
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="outlined" onClick={() => window.location.reload()} aria-label="Reload page">Reload</Button>
      </Box>
    );
  }

  // Extract data from scheduleData
  const schedules = scheduleData?.schedules || [];
  const warnings = scheduleData?.warnings || [];
  const timeSlots = scheduleData?.time_slots || defaultTimeSlots;
  const daysOfWeek = scheduleData?.days_of_week || defaultDaysOfWeek;

  // Determine whether to show results or just the time blocking table
  const showScheduleResults = hasGenerated && scheduleData;
  const displayDaysOfWeek = daysOfWeek;
  const showTable = timeSlots.length > 0 && daysOfWeek.length > 0;

  return (
    <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 4, boxShadow: 6, background: 'linear-gradient(135deg, #f5f6fa 0%, #e3e9f7 100%)', mb: { xs: 2, md: 4 } }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* Search Section (Autocomplete with controlled open) */}
          <Autocomplete
            multiple
            options={allCourses}
            value={selected}
            onChange={handleSelect}
            filterSelectedOptions
            inputValue={searchInput}
            onInputChange={(_, value) => setSearchInput(value)}
            open={searchInput.trim().length > 0}
            aria-label="Search and select courses"
            filterOptions={(options, { inputValue }) =>
              inputValue.trim() === ''
                ? []
                : options
                  .filter(option =>
                    option.toLowerCase().startsWith(inputValue.trim().toLowerCase())
                  )
                  .slice(0, 5)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search and select courses"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            sx={{
              mb: 2,
              '& .MuiAutocomplete-popupIndicator': { display: 'none' },
              width: '100%',
            }}
          />

          {/* Selected Courses */}
          {selected.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected Courses ({selected.length})
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, width: '100%' }}>
                {selected.map((course) => {
                  const sections = getSectionsForCourse(course);
                  return (
                    <Box key={course} sx={{ display: 'flex', alignItems: 'center', mb: 1, mr: 1 }}>
                      <Chip
                        label={course}
                        onDelete={() => toggleCourse(course)}
                        color="primary"
                        variant="outlined"
                        sx={{ ...primaryChipStyle, mb: 0, mr: sections.length > 1 ? 0.5 : 0 }}
                        aria-label={`Remove course ${course}`}
                      />
                      {sections.length > 1 && (
                        <Select
                          size="small"
                          value={sectionChoices[course] || 'any'}
                          onChange={(e) => handleSectionChange(course, e.target.value)}
                          aria-label={`Select section for ${course}`}
                          sx={{
                            minWidth: 60,
                            maxWidth: 90,
                            height: 32,
                            ml: 0,
                            borderRadius: 2,
                            fontWeight: 500,
                            fontSize: 13,
                            bgcolor: 'background.paper',
                            boxShadow: 1,
                            '.MuiSelect-select': {
                              py: 0.5,
                              px: 1,
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: { fontSize: 13, minWidth: 60 }
                            }
                          }}
                        >
                          <MenuItem value="any" sx={{ fontSize: 13, py: 0.5 }}>Any</MenuItem>
                          {sections.map((section) => (
                            <MenuItem key={section} value={section} sx={{ fontSize: 13, py: 0.5 }}>{section}</MenuItem>
                          ))}
                        </Select>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Course Groups */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Course Groups
            </Typography>
            <Grid container columns={12} spacing={1}>
              {Object.keys(courses).map((prefix) => (
                <Grid key={prefix} sx={{ gridColumn: { xs: 'span 4', sm: 'span 2' } }}>
                  <Chip
                    label={prefix}
                    onClick={(e) => handleGroupClick(e, prefix)}
                    color="primary"
                    variant="outlined"
                    sx={groupChipStyle}
                    aria-label={`Show courses in group ${prefix}`}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Course Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                maxHeight: 300,
                width: 250,
              },
            }}
          >
            {activeGroup && courses[activeGroup]?.map((course) => (
              <MenuItem
                key={course}
                onClick={() => {
                  toggleCourse(course);
                  handleMenuClose();
                }}
                selected={selected.includes(course)}
              >
                <ListItemText primary={course} />
              </MenuItem>
            ))}
          </Menu>

          {/* Warning Display */}
          {warnings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {uniqueWarnings(warnings).map((w, i) => (
                <Alert severity="warning" key={i} sx={{ mb: 2, borderRadius: 2, boxShadow: 2, fontSize: 16 }} aria-live="polite">
                  {w}
                </Alert>
              ))}
            </Box>
          )}

          {/* Generated Schedules Display */}
          {showScheduleResults && schedules.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }}>
                  {schedules.length} Valid Schedule{(schedules.length > 1 ? "s" : "")} Found
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetSchedule}
                    sx={{ mr: 1 }}
                  >
                    New Schedule
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleMenuClick}
                    sx={{
                      ...submitButtonStyle,
                      fontSize: 16,
                      letterSpacing: 0.5,
                      py: 1.2,
                    }}
                    aria-label="Download schedule options"
                  >
                    Download
                  </Button>
                </Box>
              </Box>

              {/* Schedule Tabs */}
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Generated schedule tabs"
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  boxShadow: 2,
                  background: 'rgba(255,255,255,0.7)',
                  minHeight: 48,
                  '& .MuiTabs-indicator': {
                    height: 2,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                  },
                }}
              >
                {schedules.map((_, idx) => (
                  <Tab
                    label={`Schedule ${idx + 1}`}
                    key={idx}
                    sx={{
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 1,
                      mx: 0.5,
                      minHeight: 40,
                      px: 2,
                      py: 0.5,
                      transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
                      '&.Mui-selected': {
                        color: 'primary.main',
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                      },
                      '&:hover': {
                        bgcolor: 'primary.lighter',
                        color: 'primary.dark',
                      },
                    }}
                  />
                ))}
              </Tabs>

              {/* Download Menu */}
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuDownloadClose}
              >
                <MenuItem onClick={() => handleDownload('pdf')}>
                  <ListItemIcon>
                    <PictureAsPdfIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download as PDF</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDownload('image')}>
                  <ListItemIcon>
                    <ImageIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download as Image</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* Generated Schedule Display */}
          <Box ref={scheduleRef}>
            {showTable && (
              <Box>
                {showScheduleResults ? (
                  <Divider sx={{ my: 2 }} />
                ) : (
                  <Divider sx={{ my: 2 }} />
                )}
                <Timetable
                  schedule={showScheduleResults && schedules.length > 0 ? schedules[tab] : { sections: [] }}
                  timeSlots={timeSlots}
                  daysOfWeek={displayDaysOfWeek}
                  blockedHours={blockedHours}
                  setBlockedHours={setBlockedHours}
                  scrollRef={scrollRef}
                />
              </Box>
            )}
          </Box>

          {/* No Schedules Found Message */}
          {hasGenerated && schedules.length === 0 && warnings.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2, boxShadow: 1, fontSize: 16 }}>No valid schedules found.</Alert>
          )}

          {/* Generate Button - Only show if not already generated or if no schedules were found */}
          {(!hasGenerated || (hasGenerated && schedules.length === 0)) && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || selected.length === 0}
              size="large"
              fullWidth
              sx={{ ...submitButtonStyle, mt: 2 }}
              aria-label={submitting ? "Generating schedule" : "Generate schedule"}
            >
              {submitting ? "Generating Schedule..." : "Generate Schedule"}
            </Button>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

export default CourseSelector; 