// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State Management
let currentLanguage = 'en';
let selectedSkills = new Set();
let selectedSectors = new Set();
let candidateData = {};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setupLanguageToggle();
    setupVisualSelectors();
    setupSkillChips();
    setupSectorButtons();
    setupStipendSlider();
    setupFormSubmission();
    setupRegistration();
});

// Event Listeners Setup
function initializeEventListeners() {
    // Cache recommendations for offline use
    if ('localStorage' in window) {
        loadCachedRecommendations();
    }
}

// Language Toggle
function setupLanguageToggle() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            langButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentLanguage = this.dataset.lang;
            updateLanguage();
        });
    });
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-en][data-hi]');
    elements.forEach(el => {
        el.textContent = el.dataset[currentLanguage === 'hi' ? 'hi' : 'en'];
    });
}

// Visual Education Selectors
function setupVisualSelectors() {
    const visualOptions = document.querySelectorAll('.visual-option');
    const educationInput = document.getElementById('education_level');
    
    visualOptions.forEach(option => {
        option.addEventListener('click', function() {
            visualOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            educationInput.value = this.dataset.value;
        });
    });
}

// Skill Chips Selection
function setupSkillChips() {
    const skillChips = document.querySelectorAll('.skill-chip');
    const skillsInput = document.getElementById('skills');
    const otherSkillsInput = document.getElementById('other_skills');
    
    skillChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const skill = this.dataset.skill;
            
            if (selectedSkills.has(skill)) {
                selectedSkills.delete(skill);
                this.classList.remove('selected');
            } else {
                selectedSkills.add(skill);
                this.classList.add('selected');
            }
            
            updateSkillsInput();
        });
    });
    
    otherSkillsInput.addEventListener('blur', updateSkillsInput);
    
    function updateSkillsInput() {
        const allSkills = Array.from(selectedSkills);
        const otherSkills = otherSkillsInput.value.trim();
        
        if (otherSkills) {
            allSkills.push(...otherSkills.split(',').map(s => s.trim()));
        }
        
        skillsInput.value = allSkills.join(', ');
    }
}

// Sector Buttons Selection
function setupSectorButtons() {
    const sectorButtons = document.querySelectorAll('.sector-btn');
    const sectorInput = document.getElementById('preferred_sector');
    
    sectorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sector = this.dataset.sector;
            
            if (selectedSectors.has(sector)) {
                selectedSectors.delete(sector);
                this.classList.remove('active');
            } else {
                selectedSectors.add(sector);
                this.classList.add('active');
            }
            
            sectorInput.value = Array.from(selectedSectors).join(', ');
        });
    });
}

// Stipend Slider
function setupStipendSlider() {
    const stipendSlider = document.getElementById('min_stipend');
    const stipendValue = document.getElementById('stipend_value');
    
    stipendSlider.addEventListener('input', function() {
        stipendValue.textContent = this.value;
    });
}

// Form Submission
function setupFormSubmission() {
    const quickMatchForm = document.getElementById('quickMatchForm');
    
    quickMatchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(this);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Add interests based on selected sectors
        data.interests = data.preferred_sector;
        
        // Show loading spinner
        showLoading(true);
        
        try {
            // Call API for quick match
            const response = await fetch(`${API_BASE_URL}/quick-match?top_n=5`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                const: result = await response.json(),

// Enforce top 5 on client as a safeguard
                const: top5 = (result.recommendations || []).slice(0, 5),
            });
            
            const result = await response.json();
            
            if (result.success) {
                displayRecommendations(result.recommendations||[]).slice(0,5);
                cacheRecommendations(result.recommendations);
            } else {
                showError('Unable to get recommendations. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            // Try to load cached recommendations if offline
            const cached = getCachedRecommendations();
            if (cached && cached.length > 0) {
                displayRecommendations(cached);
                showNotification('Showing cached recommendations (offline mode)');
            } else {
                showError('Connection error. Please check your internet connection.');
            }
        } finally {
            showLoading(false);
        }
    });
}

// Display Recommendations
function displayRecommendations(recommendations) {
    const resultsSection = document.getElementById('resultsSection');
    const cardsContainer = document.getElementById('recommendationCards');
    
    // Clear previous results
    cardsContainer.innerHTML = '';
    
    // Create cards for each recommendation
    recommendations.forEach((rec, index) => {
        const card = createRecommendationCard(rec, index);
        cardsContainer.appendChild(card);
    });
    
    // Show results section with animation
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Animate cards
    animateCards();
}

// Create Recommendation Card
function createRecommendationCard(rec, index) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Determine match level color
    const matchColor = rec.match_score >= 80 ? 'var(--success-color)' : 
                      rec.match_score >= 60 ? 'var(--warning-color)' : 
                      'var(--primary-color)';
    
    card.innerHTML = `
        <div class="match-badge" style="background: ${matchColor}">
            ${rec.match_score}% Match
        </div>
        
        <div class="card-header">
            <h3 class="card-title">${rec.title}</h3>
            <p class="card-company">${rec.company}</p>
        </div>
        
        <div class="card-details">
            <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${rec.location}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-rupee-sign"></i>
                <span>₹${rec.stipend}/month</span>
            </div>
            ${rec.remote ? '<div class="detail-item"><i class="fas fa-home"></i><span>Remote Available</span></div>' : ''}
        </div>
        
        <div class="match-score-bar">
            <div class="match-score-fill" style="width: ${rec.match_score}%"></div>
        </div>
        
        <p class="why-recommended">
            <strong>Why recommended:</strong> ${rec.why_recommended}
        </p>
        
        ${rec.skills_to_learn && rec.skills_to_learn.length > 0 ? `
            <div class="skills-section">
                <p class="skills-title">Skills to Learn:</p>
                <div class="skills-list">
                    ${rec.skills_to_learn.map(skill => 
                        `<span class="skill-tag missing">${skill}</span>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    return card;
}

// Animation for cards
function animateCards() {
    const cards = document.querySelectorAll('.recommendation-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Registration Setup
function setupRegistration() {
    const registerBtn = document.getElementById('registerBtn');
    const modal = document.getElementById('registrationModal');
    const closeModal = document.querySelector('.close-modal');
    const registrationForm = document.getElementById('registrationForm');
    
    registerBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const regData = {};
        
        formData.forEach((value, key) => {
            regData[key] = value;
        });
        
        // Combine with quick match data
        const completeProfile = { ...candidateData, ...regData };
        
        showLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(completeProfile)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification(`Registration successful! Your ID: ${result.candidate_id}`);
                modal.style.display = 'none';
                
                // Get full recommendations
                getFullRecommendations(result.candidate_id);
            } else {
                showError('Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Connection error. Please try again.');
        } finally {
            showLoading(false);
        }
    });
}

// Get Full Recommendations
async function getFullRecommendations(candidateId) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/${candidateId}?top_n=5`);
        const result = await response.json();
        
        if (result.success) {
            displayRecommendations(result.recommendations);
            cacheRecommendations(result.recommendations);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Caching Functions
function cacheRecommendations(recommendations) {
    if ('localStorage' in window) {
        localStorage.setItem('cached_recommendations', JSON.stringify({
            data: recommendations,
            timestamp: Date.now()
        }));
    }
}

function getCachedRecommendations() {
    if ('localStorage' in window) {
        const cached = localStorage.getItem('cached_recommendations');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache valid for 24 hours
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
    }
    return null;
}

function loadCachedRecommendations() {
    const cached = getCachedRecommendations();
    if (cached && cached.length > 0) {
        console.log('Cached recommendations available for offline use');
    }
}

// UI Helper Functions
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);