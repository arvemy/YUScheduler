import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Stack,
  Paper,
  Menu,
  MenuItem,
  ListItemText,
  InputAdornment,
  Grid,
  Autocomplete,
  Select,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const API_BASE = "http://localhost:5000";

function CourseSelector({ onSchedule, blockedHours, term }) {
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

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE}/api/courses?term=${encodeURIComponent(term)}`)
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError('Failed to load courses. Please try again later.');
      });
    // Fetch section data
    axios
      .get(`${API_BASE}/api/sections?term=${encodeURIComponent(term)}`)
      .then((res) => setSectionData(res.data))
      .catch(() => setSectionData({}));
  }, [term]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const courseSectionArray = selected.map((course) => ({
      course,
      section: sectionChoices[course] || null,
    }));
    axios
      .post(`${API_BASE}/api/generate_schedule`, {
        courses: courseSectionArray,
        blocked_hours: blockedHours,
        term: term,
      })
      .then((res) => {
        onSchedule(res.data, selected);
        setSubmitting(false);
      })
      .catch(() => setSubmitting(false));
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
                    sx={{ mb: 0, mr: sections.length > 1 ? 0.5 : 0, borderRadius: 2, fontWeight: 500, fontSize: 15, letterSpacing: 0.3, boxShadow: 1, bgcolor: 'background.paper', transition: 'all 0.25s cubic-bezier(.4,0,.2,1)' }}
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
                    sx={{
                      cursor: 'pointer',
                      width: '100%',
                      borderRadius: 2,
                      boxShadow: 1,
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: 0.5,
                      transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                      bgcolor: 'background.paper',
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
                      '& .MuiChip-label': {
                        transition: 'color 0.25s',
                      },
                    }}
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
            sx={{
              mt: 2,
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
            }}
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