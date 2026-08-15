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
        """Recommend internships using hybrid TF-IDF similarity + rule-based boosting"""
        skills = candidate_profile.get('skills', '')
        interests = candidate_profile.get('interests', '')
        preferred_sector = candidate_profile.get('preferred_sector', '')
        preferred_locations = candidate_profile.get('preferred_locations', '')

        candidate_text = ' '.join([skills, interests, preferred_sector, preferred_locations])
        candidate_vector = self.tfidf.transform([candidate_text])
        base_similarity = cosine_similarity(candidate_vector, self.features_matrix).flatten()

        candidate_skills_set = set(
            s.strip().lower() for s in skills.split(',') if s.strip()
        )
        preferred_sector_lower = preferred_sector.strip().lower() if preferred_sector else ''
        preferred_locs_list = [
            l.strip().lower() for l in preferred_locations.split(',') if l.strip()
        ] if preferred_locations else []

        boosted_scores = []
        for idx in range(len(self.internships)):
            internship = self.internships.iloc[idx]
            score = base_similarity[idx] * 100  # base TF-IDF similarity, scaled 0-100

            # Sector match bonus
            internship_sector = str(internship.get('sector', '')).lower()
            if preferred_sector_lower and preferred_sector_lower in internship_sector:
                score += 20

            # Skill overlap bonus
            internship_skills = set(
                s.strip().lower() for s in str(internship.get('skills_required', '')).split(',') if s.strip()
            )
            overlap = len(candidate_skills_set & internship_skills)
            score += overlap * 8

            # Location match bonus
            internship_location = str(internship.get('location', '')).lower()
            if preferred_locs_list and internship_location in preferred_locs_list:
                score += 10

            boosted_scores.append(min(round(score, 2), 100))

        # Rank by boosted score, take top_n
        top_indices = sorted(
            range(len(boosted_scores)), key=lambda i: boosted_scores[i], reverse=True
        )[:top_n]

        recommendations = []
        for idx in top_indices:
            internship = self.internships.iloc[idx].to_dict()
            match_score = boosted_scores[idx]

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
                'why_recommended': self._build_reason(
                    match_score, preferred_sector_lower, internship_sector=str(internship.get('sector', '')).lower(),
                    skill_gap=skill_gap
                ),
                'skill_gap': skill_gap
            })

        return recommendations

    def _build_reason(self, match_score, preferred_sector_lower, internship_sector, skill_gap):
        """Generate a human-readable reason for the recommendation"""
        reasons = []
        if preferred_sector_lower and preferred_sector_lower in internship_sector:
            reasons.append("matches your preferred sector")
        if skill_gap['existing_skills']:
            reasons.append(f"you already have {len(skill_gap['existing_skills'])} required skill(s)")
        if not reasons:
            reasons.append("relevant based on your profile")
        return f"Recommended because it {', '.join(reasons)} (match score: {match_score}%)"

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
