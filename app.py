"""
YU Scheduler Backend
-------------------
Flask backend for YU Scheduler, a course timetable planner for Yaşar University students.

Features:
- Provides course and section data from courses.json
- Generates conflict-free schedules
- API endpoints for frontend integration

Configuration:
- By default, loads courses.json from the project root.
- For production, set debug=False and consider using environment variables for configuration.
"""

from flask import Flask, render_template, request, jsonify, make_response
import json
from collections import defaultdict
import itertools
import hashlib
from flask_cors import CORS
import os
import logging
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import lru_cache
from flask_talisman import Talisman

# Configuration
class Config:
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
    TERMS_DIR = os.environ.get("TERMS_DIR", ".")
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    RATE_LIMIT = os.environ.get("RATE_LIMIT", "100/hour")

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, origins=app.config["CORS_ORIGINS"])
Talisman(app)

# Rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100/hour"],  # Default for any other endpoints
)

# Logging
if not app.debug:
    logging.basicConfig(level=logging.INFO)

# Add a custom hash filter for Jinja2 templates
@app.template_filter('hash')
def hash_filter(value):
    """Jinja2 filter: Return an integer hash of the input value."""
    # Create a hash of the input value and return an integer
    return int(hashlib.md5(str(value).encode()).hexdigest(), 16)

# Helper function to check if a session overlaps with a time slot
def session_overlaps_slot(session, time_slot):
    """Check if a session overlaps with a given time slot (format: 'HH:MM-HH:MM')."""
    session_start = session['Start Time']
    session_end = session['End Time']
    
    # Parse times
    try:
        start_hour, start_minute = map(int, session_start.split(':'))
        end_hour, end_minute = map(int, session_end.split(':'))
        
        slot_start, slot_end = time_slot.split('-')
        slot_start_hour, slot_start_minute = map(int, slot_start.split(':'))
        slot_end_hour, slot_end_minute = map(int, slot_end.split(':'))
        
        # Convert to minutes for easier comparison
        session_start_mins = start_hour * 60 + start_minute
        session_end_mins = end_hour * 60 + end_minute
        slot_start_mins = slot_start_hour * 60 + slot_start_minute
        slot_end_mins = slot_end_hour * 60 + slot_end_minute
        
        # Check if there's an overlap
        return (
            # Either session starts during the slot
            (session_start_mins <= slot_end_mins and session_start_mins >= slot_start_mins) or
            # Or session ends during the slot
            (session_end_mins >= slot_start_mins and session_end_mins <= slot_end_mins) or
            # Or session completely spans the slot
            (session_start_mins <= slot_start_mins and session_end_mins >= slot_end_mins)
        )
    except Exception:
        return False

# Helper to list available term files and extract term names
TERMS_DIR = app.config["TERMS_DIR"]
TERM_SUFFIX = 'spring.json'

def get_term_files():
    # List all files matching *_spring.json
    files = [f for f in os.listdir(TERMS_DIR) if f.endswith(TERM_SUFFIX)]
    return files

def get_term_name_from_file(filename):
    # e.g., 2024_2025spring.json -> 2024-2025 Spring
    base = filename.replace(TERM_SUFFIX, '').replace('_', '-')
    return base.strip('-') + ' Spring'

def get_file_from_term(term):
    # e.g., '2024-2025 Spring' -> 2024_2025spring.json
    base = term.lower().replace(' ', '').replace('-', '_')
    return f"{base}.json"

# Day name mapping from Turkish to English
DAY_MAP = {
    'PAZARTESİ': 'Monday', 'PAZARTESI': 'Monday', 'pazartesi': 'Monday', 'pazartesi': 'Monday', 'pazartesi': 'Monday',
    'SALI': 'Tuesday', 'sali': 'Tuesday',
    'ÇARŞAMBA': 'Wednesday', 'ÇARSAMBA': 'Wednesday', 'çarsamba': 'Wednesday', 'çarşamba': 'Wednesday',
    'PERŞEMBE': 'Thursday', 'PERSEMBE': 'Thursday', 'persembe': 'Thursday', 'perşembe': 'Thursday',
    'CUMA': 'Friday', 'cuma': 'Friday',
    'CUMARTESİ': 'Saturday', 'CUMARTESI': 'Saturday', 'cumartesi': 'Saturday',
    'PAZAR': 'Sunday', 'pazar': 'Sunday',
}

def map_days_to_english(data):
    for course_code, sessions in data.items():
        for session in sessions:
            if session['Day'] in DAY_MAP:
                session['Day'] = DAY_MAP[session['Day']]
    return data

# Caching course data
@lru_cache(maxsize=8)
def load_courses_data_cached(term):
    filename = get_file_from_term(term)
    path = os.path.join(TERMS_DIR, filename)
    if not os.path.exists(path):
        # fallback to latest available
        files = sorted(get_term_files(), reverse=True)
        if not files:
            raise FileNotFoundError('No course data files found.')
        path = os.path.join(TERMS_DIR, files[0])
    with open(path, 'r') as f:
        data = json.load(f)
    return map_days_to_english(data)

@app.route('/')
def index():
    """Render the main page with grouped course list."""
    course_list = list(data.keys())
    grouped_courses = defaultdict(list)
    for course in course_list:
        prefix = course.split()[0]
        grouped_courses[prefix].append(course)
    return render_template('index.html', grouped_courses=grouped_courses)

@app.route('/generate_schedule', methods=['POST'])
def generate_schedule():
    """Generate all valid, conflict-free schedules for selected courses (form POST)."""
    selected_courses = request.form.getlist('courses')
    
    # Determine which courses have eligible sections
    valid_courses = [course for course in selected_courses if eligible_sections[course]]
    excluded_courses = [course for course in selected_courses if not eligible_sections[course]]
    
    warnings = []
    if excluded_courses:
        warnings.append(f"The following courses have no valid sections due to missing data and have been excluded: {', '.join(excluded_courses)}")
    
    if not valid_courses:
        warnings.append("No valid courses remain to generate a schedule.")
        return render_template('result.html', message=" ".join(warnings))
    
    # Generate all possible combinations of sections for valid courses
    section_lists = [eligible_sections[course] for course in valid_courses]
    combinations = list(itertools.product(*section_lists))
    
    valid_schedules = []
    for combination in combinations:
        all_sessions = []
        for section in combination:
            all_sessions.extend(section[1])
            
        if check_no_overlaps(all_sessions):
            schedule = {
                'sections': [
                    {
                        'course': course,
                        'section': section[0],
                        'sessions': section[1]
                    }
                    for course, section in zip(valid_courses, combination)
                ]
            }
            valid_schedules.append(schedule)
    
    # Define time slots for timetable
    time_slots = ['08:40-09:30', '09:40-10:30', '10:40-11:30', '11:40-12:30', 
                 '12:40-13:30', '13:40-14:30', '14:40-15:30', '15:40-16:30', 
                 '16:40-17:30', '17:40-18:30', '18:40-19:30', '19:40-20:30', '20:40-21:30', '21:40-22:30']
    
    # Define days of the week
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                 
    if valid_schedules:
        return render_template('result.html', 
                              schedules=valid_schedules, 
                              warnings=warnings,
                              time_slots=time_slots,
                              days_of_week=days_of_week,
                              session_overlaps_slot=session_overlaps_slot)
    else:
        warnings.append("No valid schedule exists without overlaps for the remaining courses.")
        return render_template('result.html', message=" ".join(warnings))

@app.route('/api/terms', methods=['GET'])
@limiter.limit("300/hour")
def api_terms():
    try:
        files = get_term_files()
        terms = [get_term_name_from_file(f) for f in sorted(files, reverse=True)]
        return jsonify(terms)
    except Exception as e:
        app.logger.error(f"/api/terms error: {e}")
        return make_response(jsonify({"error": "Internal server error"}), 500)

@app.route('/api/courses', methods=['GET'])
@limiter.limit("300/hour")
def api_courses():
    try:
        term = request.args.get('term')
        if not term:
            # Default to latest
            files = sorted(get_term_files(), reverse=True)
            term = get_term_name_from_file(files[0]) if files else None
        data = load_courses_data_cached(term)
        course_list = list(data.keys())
        grouped_courses = defaultdict(list)
        for course in course_list:
            prefix = course.split()[0]
            grouped_courses[prefix].append(course)
        return jsonify({k: v for k, v in grouped_courses.items()})
    except Exception as e:
        app.logger.error(f"/api/courses error: {e}")
        return make_response(jsonify({"error": "Internal server error"}), 500)

@app.route('/api/generate_schedule', methods=['POST'])
@limiter.limit("30/hour")
def api_generate_schedule():
    try:
        req_data = request.get_json()
        if not req_data or "courses" not in req_data:
            return make_response(jsonify({"error": "Missing required fields"}), 400)
        term = req_data.get('term')
        if not term:
            files = sorted(get_term_files(), reverse=True)
            term = get_term_name_from_file(files[0]) if files else None
        data = load_courses_data_cached(term)
        # Rebuild eligible_sections for this term
        courses = defaultdict(lambda: defaultdict(list))
        for course_code, sessions in data.items():
            for session in sessions:
                section = session['Section']
                courses[course_code][section].append(session)
        eligible_sections = defaultdict(list)
        for course_code, sections in courses.items():
            for section, sessions in sections.items():
                if all(session['Day'] is not None and session['Start Time'] is not None and session['End Time'] is not None for session in sessions):
                    eligible_sections[course_code].append((section, sessions))

        # --- Restored schedule generation logic ---
        def time_to_minutes(time_str):
            try:
                hours, minutes = map(int, time_str.split(':'))
                return hours * 60 + minutes
            except Exception:
                return 0

        def check_no_overlaps(all_sessions):
            sessions_by_day = defaultdict(list)
            for session in all_sessions:
                day = session['Day']
                start = time_to_minutes(session['Start Time'])
                end = time_to_minutes(session['End Time'])
                sessions_by_day[day].append((start, end))
            for day, day_sessions in sessions_by_day.items():
                day_sessions.sort(key=lambda x: x[0])
                for i in range(1, len(day_sessions)):
                    if day_sessions[i][0] < day_sessions[i-1][1]:
                        return False
            return True

        selected_courses = req_data.get('courses', [])
        blocked_hours = req_data.get('blocked_hours', [])
        blocked_set = set((b['day'], b['slot']) for b in blocked_hours)

        def session_overlaps_blocked(session, blocked_set):
            for day, slot in blocked_set:
                if session['Day'] != day:
                    continue
                slot_start, slot_end = slot.split('-')
                sess_start = session['Start Time']
                sess_end = session['End Time']
                if not (sess_end <= slot_start or sess_start >= slot_end):
                    return True
            return False

        # Support optional section selection
        valid_courses = []
        filtered_sections = {}
        excluded_courses = []
        for course_entry in selected_courses:
            if isinstance(course_entry, dict):
                course = course_entry.get('course')
                section_choice = course_entry.get('section')
            else:
                course = course_entry
                section_choice = None
            filtered = []
            if section_choice:
                for section, sessions in eligible_sections.get(course, []):
                    if section == section_choice:
                        if not any(session_overlaps_blocked(sess, blocked_set) for sess in sessions):
                            filtered.append((section, sessions))
                        break
            else:
                for section, sessions in eligible_sections.get(course, []):
                    if not any(session_overlaps_blocked(sess, blocked_set) for sess in sessions):
                        filtered.append((section, sessions))
            if filtered:
                valid_courses.append(course)
                filtered_sections[course] = filtered
            else:
                excluded_courses.append(course)

        warnings = []
        if excluded_courses:
            for course in excluded_courses:
                if not eligible_sections[course]:
                    warnings.append(f"{course}: No section data is available for this term. Please check if the course is offered or try another term.")
                else:
                    warnings.append(f"{course}: All sections conflict with your blocked hours. Try unblocking some hours or choose a different course.")

        if not valid_courses:
            warnings.append("All selected courses were excluded. Please review your blocked hours or course selection. You may need to unblock some hours or select different courses.")
            return jsonify({"warnings": warnings, "schedules": []})

        section_lists = [filtered_sections[course] for course in valid_courses]
        combinations = list(itertools.product(*section_lists))

        valid_schedules = []
        for combination in combinations:
            all_sessions = []
            for section in combination:
                all_sessions.extend(section[1])
            if check_no_overlaps(all_sessions):
                schedule = {
                    'sections': [
                        {
                            'course': course,
                            'section': section[0],
                            'sessions': section[1]
                        }
                        for course, section in zip(valid_courses, combination)
                    ]
                }
                valid_schedules.append(schedule)

        time_slots = ['08:40-09:30', '09:40-10:30', '10:40-11:30', '11:40-12:30', 
                     '12:40-13:30', '13:40-14:30', '14:40-15:30', '15:40-16:30', 
                     '16:40-17:30', '17:40-18:30', '18:40-19:30', '19:40-20:30', '20:40-21:30', '21:40-22:30']
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        if not valid_schedules:
            warnings.append("No valid schedule could be generated: All possible combinations have time conflicts or overlap with your blocked hours. Try unblocking more hours or selecting fewer courses.")

        response = {
            "warnings": warnings,
            "schedules": valid_schedules,
            "time_slots": time_slots,
            "days_of_week": days_of_week
        }
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"/api/generate_schedule error: {e}")
        return make_response(jsonify({"error": "Internal server error"}), 500)

@app.route('/api/sections', methods=['GET'])
@limiter.limit("200/hour")
def api_sections():
    try:
        term = request.args.get('term')
        if not term:
            files = sorted(get_term_files(), reverse=True)
            term = get_term_name_from_file(files[0]) if files else None
        data = load_courses_data_cached(term)
        # Rebuild eligible_sections for this term
        courses = defaultdict(lambda: defaultdict(list))
        for course_code, sessions in data.items():
            for session in sessions:
                section = session['Section']
                courses[course_code][section].append(session)
        eligible_sections = defaultdict(list)
        for course_code, sections in courses.items():
            for section, sessions in sections.items():
                if all(session['Day'] is not None and session['Start Time'] is not None and session['End Time'] is not None for session in sessions):
                    eligible_sections[course_code].append((section, sessions))
        section_map = {}
        for course_code, sections in eligible_sections.items():
            section_map[course_code] = [section for section, _ in sections]
        return jsonify(section_map)
    except Exception as e:
        app.logger.error(f"/api/sections error: {e}")
        return make_response(jsonify({"error": "Internal server error"}), 500)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config["DEBUG"])