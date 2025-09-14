# PM Internship Recommendation Engine MVP

## 🎯 Project Overview

An AI-based internship recommendation system designed specifically for the PM Internship Scheme, targeting first-generation learners and youth from rural areas, tribal districts, and urban slums across India.

### Key Features
- **Hybrid ML Recommendation System**: Combines content-based filtering with weighted scoring
- **Mobile-First Design**: Fully responsive interface optimized for low-end devices
- **Visual-First UI**: Icons and visual cues instead of text-heavy descriptions
- **Offline Capability**: Caches recommendations for low-connectivity areas
- **Skill Gap Analysis**: Shows what skills candidates need to learn
- **Multi-language Support**: Framework ready for regional languages
- **Simple & Lightweight**: Minimal resource requirements

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js (optional, for serving frontend)
- Web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone or download the project**
```bash
cd pm-internship-recommender
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Start the backend server**
```bash
cd backend
python app.py
```
The API will be available at `http://localhost:5000`

4. **Open the frontend**
- Open `frontend/index.html` in your web browser
- Or serve it using any static file server

## 📱 How to Use

### For Candidates

1. **Quick Match (No Registration)**
   - Select your education level using visual buttons
   - Enter your location and preferred work locations
   - Click on skill chips to select your skills
   - Choose sectors you're interested in
   - Set your minimum expected stipend using the slider
   - Click "Find My Perfect Internships" to get 3 recommendations

2. **Full Registration (5+ Recommendations)**
   - Complete the quick match form first
   - Click "Complete Registration for 5+ Recommendations"
   - Fill in additional details (name, age, experience)
   - Get access to 5 or more personalized recommendations

### Understanding Recommendations

Each recommendation card shows:
- **Match Score**: How well the internship matches your profile (0-100%)
- **Location & Remote Options**: Where the internship is based
- **Stipend**: Monthly compensation
- **Why Recommended**: Reasons for the match
- **Skills to Learn**: Skills you need to develop for this role

## 🏗️ Architecture

### Backend (Python/Flask)
- `models/recommendation_engine.py`: Hybrid ML recommendation system
- `backend/app.py`: RESTful API endpoints
- `data/`: CSV files with internships and candidate data

### Frontend (HTML/CSS/JavaScript)
- `frontend/index.html`: Main interface
- `frontend/styles.css`: Mobile-responsive styling
- `frontend/script.js`: Interactive functionality & API calls

### Machine Learning Approach

The recommendation engine uses a hybrid approach:

1. **Content-Based Filtering (40% weight)**
   - TF-IDF vectorization of internship features
   - Cosine similarity matching

2. **Education Compatibility (20% weight)**
   - Matches education requirements
   - Penalizes over/under qualification

3. **Location Preference (15% weight)**
   - Prioritizes preferred locations
   - Boosts remote opportunities

4. **Skill Matching (15% weight)**
   - Jaccard similarity for skills
   - Bonus for critical skills

5. **Stipend Compatibility (5% weight)**
   - Matches minimum stipend expectations

6. **Language Compatibility (5% weight)**
   - Ensures language requirements are met

## 📊 Sample Data

The MVP includes:
- 20 diverse internship opportunities
- 10 sample candidate profiles
- Coverage across multiple sectors (IT, Agriculture, Healthcare, Education, etc.)
- Locations across India including rural areas

## 🔧 API Endpoints

### Quick Match
```
POST /api/quick-match
```
Get 3 recommendations without registration

### Registration
```
POST /api/register
```
Register a new candidate

### Get Recommendations
```
GET /api/recommendations/<candidate_id>
```
Get personalized recommendations for a registered candidate

### Skill Gap Analysis
```
POST /api/skill-gap
```
Analyze skill gaps for a specific internship

## 🎨 Unique Features

1. **Visual Education Selector**: Icons instead of dropdown menus
2. **Skill Chips**: Tap-to-select skills interface
3. **Sector Grid**: Visual sector selection with icons
4. **Progress Bars**: Visual representation of match scores
5. **Offline Caching**: Works without constant internet
6. **Bilingual Support**: English/Hindi toggle ready

## 📈 Future Enhancements

- Integration with actual PM Internship Scheme portal
- Regional language translations
- SMS-based recommendations for feature phones
- WhatsApp bot integration
- Video tutorials for first-time users
- Company verification system
- Feedback and rating system

## 🤝 Contributing

This is an MVP designed for demonstration. To contribute:
1. Add more internship data in `data/internships.csv`
2. Improve the ML algorithm in `models/recommendation_engine.py`
3. Enhance UI/UX in the frontend files
4. Add regional language support

## 📝 License

This project is created as an MVP for the PM Internship Scheme and is intended for educational and demonstration purposes.

## 🙏 Acknowledgments

Designed specifically for:
- First-generation learners
- Rural youth
- Candidates with limited digital exposure
- Students from tribal districts and urban slums

**Built with ❤️ to empower India's youth**

---

For support or queries, please contact the PM Internship Scheme portal administrators.