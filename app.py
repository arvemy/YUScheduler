"""
YU Scheduler Backend
-------------------
Flask backend for YU Scheduler, a course timetable planner for Yaşar University students.

Features:
- Provides course and section data from courses.json
- Generates schedules
- API endpoints for frontend integration

Configuration:
- By default, loads courses.json from the project root.
- For production, set debug=False and consider using environment variables for configuration.
"""

from flask import Flask, request, jsonify, make_response
import json
from collections import defaultdict
import itertools
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
    default_limits=["100/hour"]  # Default for any other endpoints
)

# Logging
if not app.debug:
    logging.basicConfig(level=logging.INFO)

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
    'PAZARTESİ': 'Monday', 'PAZARTESI': 'Monday', 'pazartesi': 'Monday',
    'SALI': 'Tuesday', 'sali': 'Tuesday',
    'ÇARŞAMBA': 'Wednesday', 'ÇARSAMBA': 'Wednesday', 'çarşamba': 'Wednesday', 'çarsamba': 'Wednesday',
    'PERŞEMBE': 'Thursday', 'PERSEMBE': 'Thursday', 'perşembe': 'Thursday', 'persembe': 'Thursday',
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

def time_to_minutes(time_str):
    """Convert time string to minutes since midnight."""
    try:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    except Exception:
        return 0

def check_no_overlaps(all_sessions):
    """Check if sessions have no time overlaps when grouped by day."""
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

def session_overlaps_blocked(session, blocked_set):
    """Check if a session overlaps with any blocked time slot."""
    for day, slot in blocked_set:
        if session['Day'] != day:
            continue
        slot_start, slot_end = slot.split('-')
        sess_start = session['Start Time']
        sess_end = session['End Time']
        if not (sess_end <= slot_start or sess_start >= slot_end):
            return True
    return False

def build_eligible_sections(data):
    """Build eligible sections from course data."""
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
    
    return eligible_sections

# Add a new function to identify specific blocked hours causing conflicts
def identify_conflicting_hours(course, eligible_sections, blocked_set):
    """Identify which blocked hours conflict with which course sections."""
    conflicts = defaultdict(list)
    
    # For each section of the course
    for section, sessions in eligible_sections.get(course, []):
        # Check each session for conflicts with blocked hours
        for session in sessions:
            # Find conflicting blocked hours for this session
            for day, slot in blocked_set:
                if session['Day'] != day:
                    continue
                    
                slot_start, slot_end = slot.split('-')
                sess_start = session['Start Time']
                sess_end = session['End Time']
                
                if not (sess_end <= slot_start or sess_start >= slot_end):
                    conflicts[section].append({
                        'day': day, 
                        'slot': slot, 
                        'session_time': f"{sess_start}-{sess_end}",
                        'classroom': session.get('Classroom', 'Unknown')
                    })
    
    return conflicts

@app.route('/')
def index():
    return "YU Scheduler API is running."

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
        # Request validation
        if not request.is_json:
            return make_response(jsonify({"error": "Request must be JSON"}), 400)
            
        req_data = request.get_json()
        if not req_data:
            return make_response(jsonify({"error": "Empty request body"}), 400)
            
        if "courses" not in req_data:
            return make_response(jsonify({"error": "Missing required field: 'courses'"}), 400)
            
        if not isinstance(req_data['courses'], list):
            return make_response(jsonify({"error": "Field 'courses' must be a list"}), 400)
            
        if len(req_data['courses']) == 0:
            return make_response(jsonify({"error": "At least one course must be selected"}), 400)

        # Term validation and loading
        term = req_data.get('term')
        try:
            if not term:
                files = sorted(get_term_files(), reverse=True)
                if not files:
                    return make_response(jsonify({"error": "No course data available"}), 404)
                term = get_term_name_from_file(files[0])
            
            data = load_courses_data_cached(term)
        except FileNotFoundError as e:
            app.logger.error(f"Term data not found: {term}, error: {e}")
            return make_response(jsonify({"error": f"Course data for term '{term}' not found"}), 404)
        except json.JSONDecodeError as e:
            app.logger.error(f"Invalid JSON in term file for {term}: {e}")
            return make_response(jsonify({"error": "Internal data error. Please try again later."}), 500)
        
        # Build eligible sections
        eligible_sections = build_eligible_sections(data)

        # Process selected courses
        selected_courses = req_data.get('courses', [])
        
        # Validate blocked hours
        blocked_hours = req_data.get('blocked_hours', [])
        if not isinstance(blocked_hours, list):
            return make_response(jsonify({"error": "Field 'blocked_hours' must be a list"}), 400)
            
        # Create a set of blocked time slots
        try:
            blocked_set = set()
            for block in blocked_hours:
                if not isinstance(block, dict) or 'day' not in block or 'slot' not in block:
                    return make_response(jsonify({"error": "Invalid blocked hour format. Each entry must have 'day' and 'slot'"}), 400)
                blocked_set.add((block['day'], block['slot']))
        except Exception as e:
            app.logger.error(f"Error processing blocked hours: {e}")
            return make_response(jsonify({"error": "Invalid blocked hours format"}), 400)

        # Support optional section selection
        valid_courses = []
        filtered_sections = {}
        excluded_courses = []
        course_conflicts = {}  # Store conflicts for each course
        
        for course_entry in selected_courses:
            try:
                if isinstance(course_entry, dict):
                    if 'course' not in course_entry:
                        return make_response(jsonify({"error": "Each course entry must have a 'course' field"}), 400)
                    course = course_entry.get('course')
                    section_choice = course_entry.get('section')
                else:
                    course = course_entry
                    section_choice = None
                    
                # Validate course exists in data
                if course not in data:
                    excluded_courses.append(course)
                    continue
                    
                filtered = []
                conflicts = identify_conflicting_hours(course, eligible_sections, blocked_set)
                
                if section_choice:
                    for section, sessions in eligible_sections.get(course, []):
                        if section == section_choice:
                            if not any(session_overlaps_blocked(sess, blocked_set) for sess in sessions):
                                filtered.append((section, sessions))
                            else:
                                # Store conflicts for this specific section
                                course_conflicts[course] = conflicts.get(section, [])
                            break
                else:
                    # Check all available sections
                    has_conflicts = False
                    for section, sessions in eligible_sections.get(course, []):
                        if not any(session_overlaps_blocked(sess, blocked_set) for sess in sessions):
                            filtered.append((section, sessions))
                        else:
                            has_conflicts = True
                    
                    # If at least one section has conflicts, store them
                    if has_conflicts and not filtered:
                        course_conflicts[course] = conflicts
                
                if filtered:
                    valid_courses.append(course)
                    filtered_sections[course] = filtered
                else:
                    excluded_courses.append(course)
            except Exception as e:
                app.logger.error(f"Error processing course {course_entry}: {e}")
                excluded_courses.append(str(course_entry))

        # Generate warnings for excluded courses
        warnings = []
        if excluded_courses:
            for course in excluded_courses:
                if course not in eligible_sections or not eligible_sections[course]:
                    warnings.append(f"{course}: No section data is available for this term. Please check if the course is offered or try another term.")
                else:
                    # Provide detailed conflict information
                    course_conflict_info = course_conflicts.get(course, [])
                    
                    if course_conflict_info:
                        # Group conflicts by day for readability
                        day_conflicts = defaultdict(list)
                        for section_conflicts in course_conflict_info.values():
                            for conflict in section_conflicts:
                                day_conflicts[conflict['day']].append(conflict['slot'])
                        
                        # Create a readable message
                        conflict_details = []
                        for day, slots in day_conflicts.items():
                            unique_slots = sorted(set(slots))
                            conflict_details.append(f"{day}: {', '.join(unique_slots)}")
                        
                        if conflict_details:
                            warnings.append(f"{course}: All sections conflict with your blocked hours on: {'; '.join(conflict_details)}. Please unblock these hours to include this course.")
                        else:
                            warnings.append(f"{course}: All sections conflict with your blocked hours. Try unblocking some hours or choose a different course.")
                    else:
                        warnings.append(f"{course}: All sections conflict with your blocked hours. Try unblocking some hours or choose a different course.")

        if not valid_courses:
            if blocked_hours:
                # Summarize the blocked hours by day
                blocked_by_day = defaultdict(list)
                for day, slot in blocked_set:
                    blocked_by_day[day].append(slot)
                
                blocked_summary = []
                for day, slots in blocked_by_day.items():
                    blocked_summary.append(f"{day}: {', '.join(sorted(slots))}")
                
                warnings.append(f"All selected courses were excluded due to conflicts with your blocked hours. Currently blocked: {'; '.join(blocked_summary)}. Try unblocking these hours or selecting different courses.")
            else:
                warnings.append("All selected courses were excluded. Please review your course selection or try a different term.")
            
            return jsonify({"warnings": warnings, "schedules": [], "error": "No valid courses to schedule"})

        # Generate schedule combinations
        try:
            section_lists = [filtered_sections[course] for course in valid_courses]
            combinations = list(itertools.product(*section_lists))
        except Exception as e:
            app.logger.error(f"Error generating combinations: {e}")
            return make_response(jsonify({"error": "Failed to generate schedule combinations"}), 500)

        # Find valid schedules
        valid_schedules = []
        conflict_pairs = []  # Store courses that conflict with each other

        for combination in combinations:
            try:
                all_sessions = []
                for section in combination:
                    all_sessions.extend(section[1])
                
                # Check for overlaps
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
                else:
                    # Find which specific courses conflict with each other
                    sessions_by_day = defaultdict(list)
                    course_sessions = {}
                    
                    # Group sessions by day and map to courses
                    for i, section in enumerate(combination):
                        course = valid_courses[i]
                        for session in section[1]:
                            day = session['Day']
                            start = time_to_minutes(session['Start Time'])
                            end = time_to_minutes(session['End Time'])
                            sessions_by_day[day].append((start, end, course, section[0]))
                            course_sessions[(course, section[0], day, start, end)] = session
                    
                    # Check for conflicts on each day
                    for day, sessions in sessions_by_day.items():
                        sessions.sort(key=lambda x: x[0])  # Sort by start time
                        for i in range(len(sessions)):
                            for j in range(i + 1, len(sessions)):
                                s1 = sessions[i]
                                s2 = sessions[j]
                                # Check if sessions overlap
                                if s1[0] < s2[1] and s2[0] < s1[1]:
                                    # Format: (course1, section1, time1, course2, section2, time2, day)
                                    conflict_info = (
                                        s1[2], s1[3], f"{course_sessions[(s1[2], s1[3], day, s1[0], s1[1])]['Start Time']}-{course_sessions[(s1[2], s1[3], day, s1[0], s1[1])]['End Time']}",
                                        s2[2], s2[3], f"{course_sessions[(s2[2], s2[3], day, s2[0], s2[1])]['Start Time']}-{course_sessions[(s2[2], s2[3], day, s2[0], s2[1])]['End Time']}",
                                        day
                                    )
                                    if conflict_info not in conflict_pairs:
                                        conflict_pairs.append(conflict_info)
            except Exception as e:
                app.logger.error(f"Error processing combination {combination}: {e}", exc_info=True)
                continue

        time_slots = ['08:40-09:30', '09:40-10:30', '10:40-11:30', '11:40-12:30', 
                     '12:40-13:30', '13:40-14:30', '14:40-15:30', '15:40-16:30', 
                     '16:40-17:30', '17:40-18:30', '18:40-19:30', '19:40-20:30', '20:40-21:30', '21:40-22:30']
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        if not valid_schedules:
            if conflict_pairs:
                # Add specific course conflict warnings (limit to 3 for readability)
                conflict_warnings = []
                for i, (c1, s1, t1, c2, s2, t2, day) in enumerate(conflict_pairs[:3]):
                    conflict_warnings.append(f"Conflict on {day}: {c1} (Section {s1}, {t1}) overlaps with {c2} (Section {s2}, {t2})")
                
                if len(conflict_pairs) > 3:
                    conflict_warnings.append(f"... and {len(conflict_pairs) - 3} more conflicts")
                
                for warning in conflict_warnings:
                    warnings.append(warning)
                
                warnings.append("No valid schedule could be generated due to course time conflicts. Try selecting different course sections or fewer courses.")
            elif blocked_hours:
                warnings.append("No valid schedule could be generated due to conflicts with your blocked hours. Try unblocking some hours or selecting different courses.")
            else:
                warnings.append("No valid schedule could be generated. Try selecting different course combinations.")

        response = {
            "warnings": warnings,
            "schedules": valid_schedules,
            "time_slots": time_slots,
            "days_of_week": days_of_week
        }
        return jsonify(response)
        
    except json.JSONDecodeError as e:
        app.logger.error(f"Invalid JSON in request: {e}")
        return make_response(jsonify({"error": "Invalid JSON format in request"}), 400)
    except KeyError as e:
        app.logger.error(f"Missing key in request: {e}")
        return make_response(jsonify({"error": f"Missing required field: {str(e)}"}), 400)
    except Exception as e:
        app.logger.error(f"/api/generate_schedule error: {e}", exc_info=True)
        return make_response(jsonify({"error": "Internal server error. Please try again later."}), 500)

@app.route('/api/sections', methods=['GET'])
@limiter.limit("200/hour")
def api_sections():
    try:
        term = request.args.get('term')
        if not term:
            files = sorted(get_term_files(), reverse=True)
            term = get_term_name_from_file(files[0]) if files else None
        data = load_courses_data_cached(term)
        
        # Build eligible sections
        eligible_sections = build_eligible_sections(data)
        
        section_map = {}
        for course_code, sections in eligible_sections.items():
            section_map[course_code] = [section for section, _ in sections]
        return jsonify(section_map)
    except Exception as e:
        app.logger.error(f"/api/sections error: {e}")
        return make_response(jsonify({"error": "Internal server error"}), 500)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# Global error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request: " + str(error.description)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(429)
def ratelimit_handler(error):
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

@app.errorhandler(500)
def internal_server_error(error):
    app.logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error. Please try again later."}), 500

@app.errorhandler(Exception)
def handle_exception(error):
    app.logger.error(f"Unhandled exception: {error}", exc_info=True)
    return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config["DEBUG"])