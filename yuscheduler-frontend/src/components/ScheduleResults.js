import React, { useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Stack,
  Chip,
  Divider,
  Button,
  Fade,
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import html2canvas from 'html2canvas';

// Color palette for courses
const COURSE_COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#45B7D1", // Sky Blue
  "#96CEB4", // Sage Green
  "#FFEEAD", // Cream
  "#D4A5A5", // Dusty Rose
  "#9B59B6", // Purple
  "#3498DB", // Blue
  "#E67E22", // Orange
  "#2ECC71", // Green
  "#F1C40F", // Yellow
  "#E74C3C", // Red
  "#1ABC9C", // Teal
  "#34495E", // Dark Blue
  "#95A5A6", // Gray
];

// Helper functions
function getCourseColor(course, courseColorMap, colorPalette) {
  if (!courseColorMap[course]) {
    const color = colorPalette[Object.keys(courseColorMap).length % colorPalette.length];
    courseColorMap[course] = color;
  }
  return courseColorMap[course];
}

// Export the uniqueWarnings function so it can be used in CourseSelector
export function uniqueWarnings(warnings) {
  return [...new Set(warnings)];
}

// Style constants
const chipStyle = {
  borderRadius: 2,
  fontWeight: 500,
  fontSize: 15,
  letterSpacing: 0.3,
  boxShadow: 1,
  bgcolor: 'background.paper',
  transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
};

const buttonStyle = {
  borderRadius: 3,
  fontWeight: 700,
  boxShadow: 3,
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
};

// Export the Timetable component so we can reuse it in CourseSelector
export const Timetable = React.memo(function Timetable({ schedule, timeSlots, daysOfWeek, blockedHours, setBlockedHours, scrollRef }) {
  // Memoize grid and courseColorMap
  const { grid, courseColorMap } = useMemo(() => {
    const grid = {};
    daysOfWeek.forEach((day) => {
      grid[day] = {};
      timeSlots.forEach((slot) => {
        grid[day][slot] = [];
      });
    });
    const courseColorMap = {};
    if (schedule && schedule.sections) {
      schedule.sections.forEach(({ course, section, sessions }) => {
        sessions.forEach((session) => {
          if (grid[session.Day]) {
            timeSlots.forEach((slot) => {
              const [slotStart, slotEnd] = slot.split("-");
              const [sessStart, sessEnd] = [
                session["Start Time"],
                session["End Time"],
              ];
              if (
                (sessStart <= slotEnd && sessStart >= slotStart) ||
                (sessEnd >= slotStart && sessEnd <= slotEnd) ||
                (sessStart <= slotStart && sessEnd >= slotEnd)
              ) {
                grid[session.Day][slot].push({ ...session, course, section });
              }
            });
          }
        });
      });
      // Build color map for legend
      schedule.sections.forEach(({ course }) => getCourseColor(course, courseColorMap, COURSE_COLORS));
    }
    return { grid, courseColorMap };
  }, [schedule, timeSlots, daysOfWeek]);

  // Use a Set of unique keys for blocked hours
  const blockedSet = new Set(blockedHours.map(b => `${b.day}|${b.slot}`));
  const makeKey = (day, slot) => `${day}|${slot}`;

  // Helper to check if a cell is blocked
  const isBlocked = (day, slot) => blockedSet.has(makeKey(day, slot));

  // Helper to check if all slots in a day are blocked
  const isDayBlocked = (day) => timeSlots.every(slot => isBlocked(day, slot));

  // Helper to check if all days for a slot are blocked
  const isSlotBlocked = (slot) => daysOfWeek.every(day => isBlocked(day, slot));

  // Toggle block on cell click
  const handleCellClick = (day, slot) => {
    const key = makeKey(day, slot);
    if (isBlocked(day, slot)) {
      setBlockedHours(blockedHours.filter(b => makeKey(b.day, b.slot) !== key));
    } else {
      setBlockedHours([...blockedHours, { day, slot }]);
    }
  };

  // Toggle block on day header click
  const handleDayHeaderClick = (day) => {
    if (isDayBlocked(day)) {
      // Unblock all slots for this day
      setBlockedHours(blockedHours.filter(b => b.day !== day));
    } else {
      // Block all slots for this day (add only missing ones)
      const newBlocks = timeSlots
        .filter(slot => !isBlocked(day, slot))
        .map(slot => ({ day, slot }));
      setBlockedHours([...blockedHours, ...newBlocks]);
    }
  };

  // Toggle block on slot header click (all days for that slot)
  const handleSlotHeaderClick = (slot) => {
    if (isSlotBlocked(slot)) {
      // Unblock all days for this slot
      setBlockedHours(blockedHours.filter(b => b.slot !== slot));
    } else {
      // Block all days for this slot (add only missing ones)
      const newBlocks = daysOfWeek
        .filter(day => !isBlocked(day, slot))
        .map(day => ({ day, slot }));
      setBlockedHours([...blockedHours, ...newBlocks]);
    }
  };

  return (
    <>
      {schedule && schedule.sections && (
        <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: "wrap" }}>
          {schedule.sections.map(({ course, section }) => (
            <Chip
              key={course + section}
              label={`${course} - ${section}`}
              sx={{
                bgcolor: getCourseColor(course, courseColorMap, COURSE_COLORS),
                color: "#222",
                fontWeight: 600,
                borderRadius: 4,
                fontSize: 15,
                px: 2,
                py: 1,
              }}
            />
          ))}
        </Stack>
      )}
      <Box className="timetable-scroll" sx={{ width: '100%', overflowX: 'auto' }} ref={scrollRef}>
        <Table size="small" sx={{ mb: 2, tableLayout: 'fixed', width: '100%', minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ height: 72, borderRight: '2px solid #e0e0e0', width: 90, minWidth: 90, maxWidth: 90 }}>Time</TableCell>
              {daysOfWeek.map((day, idx) => (
                <TableCell
                  key={day}
                  sx={{
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: isDayBlocked(day) ? '#616161' : undefined,
                    color: isDayBlocked(day) ? '#fff' : undefined,
                    fontWeight: isDayBlocked(day) ? 700 : 400,
                    textAlign: 'center',
                    ...(idx !== 0 ? { borderLeft: '2px solid #e0e0e0', height: 72 } : { height: 72 }),
                  }}
                  onClick={() => handleDayHeaderClick(day)}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((slot) => (
              <TableRow key={slot}>
                <TableCell
                  sx={{
                    height: 72,
                    verticalAlign: 'middle',
                    borderRight: '2px solid #e0e0e0',
                    width: 90,
                    minWidth: 90,
                    maxWidth: 90,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: isSlotBlocked(slot) ? '#616161' : undefined,
                    color: isSlotBlocked(slot) ? '#fff' : undefined,
                    fontWeight: isSlotBlocked(slot) ? 700 : 400,
                    textAlign: 'center',
                  }}
                  onClick={() => handleSlotHeaderClick(slot)}
                  title="Block/unblock this hour for all days"
                  aria-label={`Block/unblock all days for time slot ${slot}`}
                >
                  {slot}
                </TableCell>
                {daysOfWeek.map((day, idx) => {
                  const blocked = isBlocked(day, slot);
                  return (
                    <TableCell
                      key={day}
                      sx={{
                        width: 120,
                        minWidth: 120,
                        maxWidth: 120,
                        height: 72,
                        verticalAlign: 'middle',
                        p: 0,
                        cursor: 'pointer',
                        backgroundColor: blocked ? '#ffebee' : undefined,
                        position: 'relative',
                        transition: 'background 0.3s, color 0.3s',
                        '&:hover': {
                          backgroundColor: blocked ? '#ffcdd2' : '#f5f5f5',
                          transition: 'background 0.2s',
                        },
                        ...(idx !== 0 ? { borderLeft: '2px solid #e0e0e0' } : {}),
                      }}
                      onClick={() => handleCellClick(day, slot)}
                      aria-label={`Block/unblock ${day} at ${slot}`}
                    >
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 72,
                        overflow: 'hidden',
                        opacity: blocked ? 0.4 : 1,
                        position: 'relative',
                        transition: 'opacity 0.3s',
                      }}>
                        <Fade in={blocked} timeout={300} unmountOnExit>
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            pointerEvents: 'none',
                            bgcolor: 'rgba(244,67,54,0.12)', // subtle red tint
                            borderRadius: 1,
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <LockIcon sx={{ color: '#b71c1c', fontSize: 28, opacity: 1 }} />
                          </Box>
                        </Fade>
                        {grid[day][slot].map((s, idx2) => (
                          <Box
                            key={idx2}
                            sx={{
                              mb: 0.5,
                              px: 1,
                              py: 0.5,
                              bgcolor: getCourseColor(s.course, courseColorMap, COURSE_COLORS),
                              borderRadius: 1,
                              color: "#222",
                              boxShadow: 1,
                              width: '90%',
                              minWidth: 0,
                              overflow: 'hidden',
                              mx: 'auto',
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>
                              {s.course} ({s.section})
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12 }}>
                              {s["Start Time"]} - {s["End Time"]}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: 11 }}>{s["Classroom"]}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
});

const ScheduleResults = React.memo(function ScheduleResults({
  schedules = [],
  warnings = [],
  timeSlots = [],
  daysOfWeek = [],
  selectedCourses = [],
  hasGenerated = false,
  blockedHours = [],
  setBlockedHours,
  onBack
}) {
  const [tab, setTab] = React.useState(0);
  const scheduleRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  // Reset tab to 0 when schedules change
  useEffect(() => {
    setTab(0);
  }, [schedules]);



  const handleDownload = async () => {
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

      const link = document.createElement('a');
      link.download = `schedule-${tab + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
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
  };

  // Always show the table, even if no schedules yet
  const showTable = timeSlots.length > 0 && daysOfWeek.length > 0;

  // Display all days, including Sunday
  const displayDaysOfWeek = daysOfWeek;

  if (!showTable && !warnings.length) return null;

  return (
    <Paper elevation={6} sx={{
      p: { xs: 1.5, sm: 4 },
      mb: { xs: 2, md: 4 },
      borderRadius: 4,
      boxShadow: 8,
      background: 'linear-gradient(135deg, #f5f6fa 0%, #e3e9f7 100%)',
      transition: 'box-shadow 0.3s cubic-bezier(.4,0,.2,1), background 0.3s cubic-bezier(.4,0,.2,1)',
    }}>
      {onBack && (
        <Button
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, fontWeight: 600 }}
        >
          Back to Course Selection
        </Button>
      )}
      {uniqueWarnings(warnings).map((w, i) => (
        <Alert severity="warning" key={i} sx={{ mb: 2, borderRadius: 2, boxShadow: 2, fontSize: 16 }} aria-live="polite">
          {w}
        </Alert>
      ))}
      {selectedCourses && selectedCourses.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Selected Courses:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
            {selectedCourses.map((course) => {
              // Check if course is present in any schedule.sections
              const isValid = schedules && schedules.length > 0 && tab !== undefined && schedules[tab]?.sections?.some(s => s.course === course);
              return (
                <Chip
                  key={course}
                  label={course}
                  color="primary"
                  variant="outlined"
                  sx={{
                    ...chipStyle,
                    textDecoration: isValid ? 'none' : 'line-through',
                    color: isValid ? undefined : 'grey.500',
                    opacity: isValid ? 1 : 0.7,
                    '&:hover': {
                      bgcolor: isValid ? 'primary.light' : 'background.paper',
                      color: isValid ? 'primary.contrastText' : 'grey.500',
                      boxShadow: isValid ? 3 : 1,
                      transform: isValid ? 'translateY(-1px) scale(1.03)' : 'none',
                    },
                    '&:active': {
                      boxShadow: 1,
                      transform: isValid ? 'scale(0.98)' : 'none',
                    },
                  }}
                />
              );
            })}
          </Stack>
          <Divider sx={{ mb: 2 }} />
        </Box>
      )}
      {schedules && schedules.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }}>
              {schedules.length} Valid Schedule{(schedules.length > 1 ? "s" : "")} Found
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                ...buttonStyle,
                ml: 2,
                fontSize: 16,
                letterSpacing: 0.5,
                py: 1.2,
              }}
              aria-label="Download schedule as image"
            >
              Download
            </Button>
          </Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
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
        </>
      )}
      <Box ref={scheduleRef}>
        {showTable && (
          <Timetable
            schedule={schedules && schedules.length > 0 && tab !== undefined ? schedules[tab] : { sections: [] }}
            timeSlots={timeSlots}
            daysOfWeek={displayDaysOfWeek}
            blockedHours={blockedHours}
            setBlockedHours={setBlockedHours}
            scrollRef={scrollRef}
          />
        )}
      </Box>
      {hasGenerated && schedules && schedules.length === 0 && warnings && warnings.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2, boxShadow: 1, fontSize: 16 }}>No valid schedules found.</Alert>
      )}
    </Paper>
  );
});

export default ScheduleResults; 