import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DownloadIcon from '@mui/icons-material/Download';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const TIPS = [
  {
    icon: <SchoolIcon color="primary" />, 
    title: 'Select Courses',
    desc: 'Search and select the courses you want to include in your schedule.'
  },
  {
    icon: <AccessTimeIcon color="primary" />, 
    title: 'Block Unavailable Hours',
    desc: 'Click on timetable cells to block hours when you are unavailable. The scheduler will avoid these times.'
  },
  {
    icon: <ListAltIcon color="primary" />, 
    title: 'Section Selection',
    desc: 'If a course has multiple sections, you can choose a specific section or let the scheduler pick any.'
  },
  {
    icon: <CalendarMonthIcon color="primary" />, 
    title: 'Term Selection',
    desc: 'Switch between academic terms using the term chip at the top.'
  },
  {
    icon: <EventAvailableIcon color="primary" />, 
    title: 'Generate Schedules',
    desc: 'Click "Generate Schedules" to see all possible conflict-free timetables.'
  },
  {
    icon: <DownloadIcon color="primary" />, 
    title: 'Download Schedules',
    desc: 'Download your favorite schedule as a PDF or image for easy reference.'
  },
];

const LOCALSTORAGE_KEY = 'yuSchedulerHideTutorial';

export default function WelcomeTutorial({ open, setOpen }) {
  const [dontShow, setDontShow] = useState(false);

  const handleClose = () => {
    setOpen(false);
    if (dontShow) {
      localStorage.setItem(LOCALSTORAGE_KEY, '1');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 24, textAlign: 'center', pb: 0 }}>
        Welcome to YU Scheduler!
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
          Here are some tips to help you get started:
        </Typography>
        <List>
          {TIPS.map((tip, idx) => (
            <React.Fragment key={tip.title}>
              <ListItem alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 40 }}>{tip.icon}</ListItemIcon>
                <ListItemText
                  primary={<Typography fontWeight={600}>{tip.title}</Typography>}
                  secondary={<Typography color="text.secondary">{tip.desc}</Typography>}
                />
              </ListItem>
              {idx < TIPS.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={dontShow} onChange={e => setDontShow(e.target.checked)} />}
          label="Don't show again"
        />
        <Button onClick={handleClose} variant="contained" color="primary" sx={{ fontWeight: 700, borderRadius: 2 }}>
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
} 