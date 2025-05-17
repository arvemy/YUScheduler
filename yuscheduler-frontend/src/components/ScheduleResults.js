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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import LockIcon from '@mui/icons-material/Lock';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

function getCourseColor(course, courseColorMap, colorPalette) {
  if (!courseColorMap[course]) {
    const color = colorPalette[Object.keys(courseColorMap).length % colorPalette.length];
    courseColorMap[course] = color;
  }
  return courseColorMap[course];
}

const Timetable = React.memo(function Timetable({ schedule, timeSlots, daysOfWeek, blockedHours, setBlockedHours }) {
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
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
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
      <Box className="timetable-scroll" sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ mb: 2, tableLayout: 'fixed', width: '100%', minWidth: { xs: 600, md: '100%' } }}>
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

function uniqueWarnings(warnings) {
  const seen = new Set();
  return warnings.filter((w) => {
    const normalized = w.trim().toLowerCase();
    if (normalized === 'no valid courses remain to generate a schedule.') return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const ScheduleResults = React.memo(function ScheduleResults({ schedules, warnings, timeSlots, daysOfWeek, selectedCourses, hasGenerated, blockedHours, setBlockedHours }) {
  const [tab, setTab] = React.useState(0);
  const scheduleRef = React.useRef(null);
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Reset tab to 0 when schedules change
  useEffect(() => {
    setTab(0);
  }, [schedules]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = async (type) => {
    if (!scheduleRef.current) return;

    // Create a hidden container for full-size rendering
    const original = scheduleRef.current;
    const clone = original.cloneNode(true);
    const hiddenContainer = document.createElement('div');
    // Match the width of the visible table
    const rect = original.getBoundingClientRect();
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.top = '-9999px';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.width = rect.width + 'px';
    hiddenContainer.style.overflow = 'visible';
    hiddenContainer.style.background = 'white';
    hiddenContainer.appendChild(clone);
    document.body.appendChild(hiddenContainer);

    // Do NOT change width, font size, or other styles of the clone
    // Only ensure overflow is visible on the container

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#fff',
        width: rect.width,
        // height: rect.height, // let html2canvas determine height
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
      // Clean up
      document.body.removeChild(hiddenContainer);
    }
    handleMenuClose();
  };

  // Always show the table, even if no schedules yet
  const showTable = timeSlots.length > 0 && daysOfWeek.length > 0;

  // Remove Sunday from daysOfWeek for display
  const displayDaysOfWeek = daysOfWeek.filter(day => day !== 'Sunday');

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
              const isValid = schedules.length > 0 && schedules[tab]?.sections?.some(s => s.course === course);
              return (
                <Chip
                  key={course}
                  label={course}
                  color="primary"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    fontSize: 15,
                    letterSpacing: 0.3,
                    boxShadow: 1,
                    bgcolor: 'background.paper',
                    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
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
      {schedules.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }}>
              {schedules.length} Valid Schedule{(schedules.length > 1 ? "s" : "")} Found
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleMenuClick}
              sx={{
                ml: 2,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 0.5,
                boxShadow: 3,
                py: 1.2,
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
              aria-label="Download schedule options"
            >
              Download Schedule
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
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
            schedule={schedules.length > 0 ? schedules[tab] : { sections: [] }}
            timeSlots={timeSlots}
            daysOfWeek={displayDaysOfWeek}
            blockedHours={blockedHours}
            setBlockedHours={setBlockedHours}
          />
        )}
      </Box>
      {hasGenerated && schedules.length === 0 && warnings.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2, boxShadow: 1, fontSize: 16 }}>No valid schedules found.</Alert>
      )}
    </Paper>
  );
});

export default ScheduleResults; 