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
  Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import apiService from "../services/api";
import { useError } from "../contexts/ErrorContext";

// Import the Timetable component from ScheduleResults
import { Timetable } from './ScheduleResults';

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

function CourseSelector({ onSchedule, blockedHours, term, setBlockedHours }) {
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

  // Default time slots and days
  const defaultTimeSlots = useMemo(() => [
    "08:40-09:30", "09:40-10:30", "10:40-11:30", "11:40-12:30",
    "13:40-14:30", "14:40-15:30", "15:40-16:30", "16:40-17:30",
    "17:40-18:30"
  ], []);

  const defaultDaysOfWeek = useMemo(() => [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
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

          {/* Time Blocking Section */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Block Hours (Click on cells to block/unblock time)
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Timetable
                timeSlots={defaultTimeSlots}
                daysOfWeek={defaultDaysOfWeek}
                blockedHours={blockedHours}
                setBlockedHours={setBlockedHours}
                schedule={{ sections: [] }} // Empty schedule for blocking only
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

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

          {/* Generate Button */}
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
        </Stack>
      </Box>
    </Paper>
  );
}

export default CourseSelector; 