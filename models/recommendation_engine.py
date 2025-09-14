import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class InternshipRecommender:
    def __init__(self):
        self.internships = pd.DataFrame()
        self.tfidf = None
        self.features_matrix = None

    def load_data(self, filepath):
        """Load internship data from CSV"""
        self.internships = pd.read_csv(filepath)
        # Preprocess skills and other textual features for recommendation
        self.internships['combined_features'] = self.internships[
            ['title', 'company', 'location', 'sector', 'skills_required']
        ].fillna('').agg(' '.join, axis=1)
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.features_matrix = self.tfidf.fit_transform(self.internships['combined_features'])

    def recommend_internships(self, candidate_profile, top_n=5):
        """Recommend internships based on candidate profile"""
        # Create candidate feature string
        skills = candidate_profile.get('skills', '')
        interests = candidate_profile.get('interests', '')
        preferred_sector = candidate_profile.get('preferred_sector', '')
        preferred_locations = candidate_profile.get('preferred_locations', '')
        candidate_text = ' '.join([skills, interests, preferred_sector, preferred_locations])

        candidate_vector = self.tfidf.transform([candidate_text])
        similarity_scores = cosine_similarity(candidate_vector, self.features_matrix).flatten()

        # Get indices of top_n best matches
        top_indices = similarity_scores.argsort()[::-1][:top_n]

        recommendations = []
        for idx in top_indices:
            internship = self.internships.iloc[idx].to_dict()
            match_score = round(similarity_scores[idx] * 100, 2)

            skill_gap = self.get_skill_gap_analysis(
                candidate_profile.get('skills', ''),
                internship.get('skills_required', '')
            )

            recommendations.append({
                'internship_id': internship.get('id', idx),
                'title': internship.get('title', ''),
                'company': internship.get('company', ''),
                'location': internship.get('location', ''),
                'sector': internship.get('sector', ''),
                'stipend': internship.get('stipend', 0),
                'duration_months': internship.get('duration_months', 0),
                'remote_available': internship.get('remote_available', False),
                'difficulty_level': internship.get('difficulty_level', 'Medium'),
                'match_score': match_score,
                'why_recommended': f"Matched with profile by text similarity with score {match_score}",
                'skill_gap': skill_gap
            })

        return recommendations

    def get_skill_gap_analysis(self, candidate_skills_str, internship_skills_str):
        candidate_skills = set([s.strip().lower() for s in candidate_skills_str.split(',') if s.strip()])
        internship_skills = set([s.strip().lower() for s in internship_skills_str.split(',') if s.strip()])

        existing_skills = list(candidate_skills.intersection(internship_skills))
        missing_skills = list(internship_skills.difference(candidate_skills))
        total_skills = len(internship_skills)
        skill_match_percentage = (len(existing_skills) / total_skills * 100) if total_skills > 0 else 0

        return {
            'existing_skills': existing_skills,
            'missing_skills': missing_skills,
            'skill_match_percentage': skill_match_percentage
        }

