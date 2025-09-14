"""
Flask REST API for PM Internship Recommendation System
Simple, lightweight backend designed for mobile-first access
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import sys
import os
import json
from datetime import datetime

# Add parent directory to path to import recommendation engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.recommendation_engine import InternshipRecommender

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize recommender
recommender = InternshipRecommender()
recommender.load_data('../data/internships.csv')

# Store candidates in memory (in production, use a database)
candidates_db = {}
recommendations_cache = {}

@app.route('/')
def web_home():
    """API welcome message"""
    return jsonify({
        'message': 'PM Internship Recommendation API',
        'version': '1.0',
        'endpoints': {
            'register': '/api/register',
            'recommendations': '/api/recommendations/<candidate_id>',
            'internships': '/api/internships',
            'candidate': '/api/candidate/<candidate_id>',
            'skill_gap': '/api/skill-gap'
        }
    })

@app.route('/api/register', methods=['POST'])
def register_candidate():
    """Register a new candidate"""
    try:
        data = request.json
        
        # Generate candidate ID
        # NEW, CORRECTED LINE
        candidate_id = "C{}".format(len(candidates_db) + 1001)
        
        # Store candidate data
        candidate_profile = {
            'candidate_id': candidate_id,
            'name': data.get('name', 'Anonymous'),
            'age': data.get('age', 20),
            'education_level': data.get('education_level', '12th Pass'),
            'location': data.get('location', ''),
            'preferred_locations': data.get('preferred_locations', ''),
            'skills': data.get('skills', ''),
            'interests': data.get('interests', ''),
            'language': data.get('language', 'Hindi'),
            'experience_months': data.get('experience_months', 0),
            'preferred_sector': data.get('preferred_sector', ''),
            'preferred_duration': data.get('preferred_duration', 3),
            'min_stipend': data.get('min_stipend', 5000),
            'registration_date': datetime.now().isoformat()
        }
        
        candidates_db[candidate_id] = candidate_profile
        
        # Generate initial recommendations
        recommendations = recommender.recommend_internships(candidate_profile, top_n=5)
        recommendations_cache[candidate_id] = recommendations
        
        return jsonify({
            'success': True,
            'candidate_id': candidate_id,
            'message': 'Registration successful',
            'profile': candidate_profile,
            'recommendations_count': len(recommendations)
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/recommendations/<candidate_id>', methods=['GET'])
def get_recommendations(candidate_id):
    """Get personalized recommendations for a candidate"""
    try:
        # Check if candidate exists
        if candidate_id not in candidates_db:
            return jsonify({
                'success': False,
                'error': 'Candidate not found'
            }), 404
        
        # Get number of recommendations requested
        top_n = request.args.get('top_n', 5, type=int)
        
        # Generate fresh recommendations
        candidate_profile = candidates_db[candidate_id]
        recommendations = recommender.recommend_internships(candidate_profile, top_n=top_n)
        
        # Cache the recommendations
        recommendations_cache[candidate_id] = recommendations
        
        # Format response for mobile-friendly display
        formatted_recommendations = []
        for rec in recommendations:
            formatted_recommendations.append({
                'id': rec['internship_id'],
                'title': rec['title'],
                'company': rec['company'],
                'location': rec['location'],
                'sector': rec['sector'],
                'stipend': rec['stipend'],
                'duration': f"{rec['duration_months']} months",
                'match_score': rec['match_score'],
                'match_level': get_match_level(rec['match_score']),
                'remote': rec['remote_available'],
                'difficulty': rec['difficulty_level'],
                'why_recommended': rec['why_recommended'],
                'skills_to_learn': rec['skill_gap']['missing_skills'],
                'skills_you_have': rec['skill_gap']['existing_skills'],
                'skill_match_percentage': round(rec['skill_gap']['skill_match_percentage'], 1)
            })
        
        return jsonify({
            'success': True,
            'candidate_id': candidate_id,
            'recommendations': formatted_recommendations,
            'total_count': len(formatted_recommendations)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/internships', methods=['GET'])
def get_all_internships():
    """Get all available internships"""
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        sector = request.args.get('sector', None)
        location = request.args.get('location', None)
        
        # Load internships
        internships_df = pd.read_csv('../data/internships.csv')
        
        # Apply filters
        if sector:
            internships_df = internships_df[internships_df['sector'].str.contains(sector, case=False)]
        if location:
            internships_df = internships_df[internships_df['location'].str.contains(location, case=False)]
        
        # Pagination
        total = len(internships_df)
        start = (page - 1) * per_page
        end = start + per_page
        
        internships = internships_df.iloc[start:end].to_dict('records')
        
        return jsonify({
            'success': True,
            'internships': internships,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/candidate/<candidate_id>', methods=['GET'])
def get_candidate_profile(candidate_id):
    """Get candidate profile"""
    try:
        if candidate_id not in candidates_db:
            return jsonify({
                'success': False,
                'error': 'Candidate not found'
            }), 404
        
        return jsonify({
            'success': True,
            'profile': candidates_db[candidate_id]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/candidate/<candidate_id>', methods=['PUT'])
def update_candidate_profile(candidate_id):
    """Update candidate profile"""
    try:
        if candidate_id not in candidates_db:
            return jsonify({
                'success': False,
                'error': 'Candidate not found'
            }), 404
        
        data = request.json
        
        # Update profile
        for key, value in data.items():
            if key in candidates_db[candidate_id]:
                candidates_db[candidate_id][key] = value
        
        candidates_db[candidate_id]['last_updated'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': candidates_db[candidate_id]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/skill-gap', methods=['POST'])
def analyze_skill_gap():
    """Analyze skill gap for a specific internship"""
    try:
        data = request.json
        candidate_skills = data.get('candidate_skills', '')
        internship_id = data.get('internship_id')
        
        # Load internships
        internships_df = pd.read_csv('../data/internships.csv')
        internship = internships_df[internships_df['id'] == internship_id].iloc[0]
        
        # Get skill gap analysis
        skill_gap = recommender.get_skill_gap_analysis(
            candidate_skills,
            internship['skills_required']
        )
        
        # Add learning resources suggestions
        learning_resources = get_learning_resources(skill_gap['missing_skills'])
        
        return jsonify({
            'success': True,
            'internship_id': internship_id,
            'internship_title': internship['title'],
            'skill_gap': skill_gap,
            'learning_resources': learning_resources
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sectors', methods=['GET'])
def get_sectors():
    """Get all unique sectors"""
    try:
        internships_df = pd.read_csv('../data/internships.csv')
        sectors = internships_df['sector'].unique().tolist()
        
        return jsonify({
            'success': True,
            'sectors': sorted(sectors)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all unique locations"""
    try:
        internships_df = pd.read_csv('../data/internships.csv')
        locations = internships_df['location'].unique().tolist()
        
        return jsonify({
            'success': True,
            'locations': sorted(locations)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/quick-match', methods=['POST'])
def quick_match():
    """Quick matching without registration - for demo purposes"""
    try:
        data = request.json
        
        # Create temporary profile
        temp_profile = {
            'education_level': data.get('education_level', '12th Pass'),
            'location': data.get('location', ''),
            'preferred_locations': data.get('preferred_locations', ''),
            'skills': data.get('skills', ''),
            'interests': data.get('interests', ''),
            'language': data.get('language', 'Hindi'),
            'preferred_sector': data.get('preferred_sector', ''),
            'min_stipend': data.get('min_stipend', 5000)
        }
        
        # Get recommendations
        recommendations = recommender.recommend_internships(temp_profile, top_n=3)
        
        # Format for response
        formatted_recommendations = []
        for rec in recommendations:
            formatted_recommendations.append({
                'title': rec['title'],
                'company': rec['company'],
                'location': rec['location'],
                'stipend': rec['stipend'],
                'match_score': rec['match_score'],
                'why_recommended': rec['why_recommended']
            })
        
        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Helper functions
def get_match_level(score):
    """Convert match score to level"""
    if score >= 80:
        return 'Excellent Match'
    elif score >= 60:
        return 'Good Match'
    elif score >= 40:
        return 'Fair Match'
    else:
        return 'Consider Other Options'

def get_learning_resources(missing_skills):
    """Suggest learning resources for missing skills"""
    resources = {
        'java': ['Java basics on YouTube', 'Free Java course on Coursera'],
        'python': ['Python for beginners - YouTube', 'Python.org tutorials'],
        'programming': ['Introduction to Programming - Khan Academy', 'Code.org'],
        'data analysis': ['Excel basics', 'Google Data Analytics Certificate'],
        'social media': ['Facebook Blueprint', 'Google Digital Garage'],
        'content writing': ['Content writing basics - YouTube', 'Grammarly blog'],
        'basic computer': ['Computer basics - YouTube', 'Digital literacy courses'],
        'communication': ['Communication skills - YouTube', 'Public speaking tips'],
        'ms office': ['Microsoft Office tutorials', 'Excel basics on YouTube']
    }
    
    suggestions = []
    for skill in missing_skills:
        if skill.lower() in resources:
            suggestions.extend(resources[skill.lower()])
    
    return suggestions[:5]  # Return top 5 suggestions

@app.route("/api")
def index():
    return {"endpoints": {"predict": "/predict", "health": "/health"}}


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",   # allows access from other devices
        port=5000,        # you can change if needed
        debug=True        # optional, auto-reloads on changes
    )