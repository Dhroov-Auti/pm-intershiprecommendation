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
    setupChatbot();
});

// Event Listeners Setup
function initializeEventListeners() {
    // Cache recommendations for offline use
    if ('localStorage' in window) {
        loadCachedRecommendations();
    }
}

// Language Toggle
// Language Toggle
function setupLanguageToggle() {
    const langSelect = document.getElementById('language-select');
    // NOTE: The getTranslation function must be added to the bottom of this file.

    langSelect.addEventListener('change', (event) => {
        const newLang = event.target.value;
        currentLanguage = newLang; // Update the global state
        updateLanguage(newLang);
        document.documentElement.lang = newLang;
    });

    // Initial call to set the language from the dropdown on load
    updateLanguage(langSelect.value);
}

function updateLanguage(lang) {
    // 1. Update text content for elements with data-en/data-hi
    document.querySelectorAll('[data-en], [data-hi]').forEach(element => {
        const translation = element.dataset[lang] || element.dataset.en; // Simple fallback to English
        if (translation) {
            element.textContent = translation;
        }
    });

    // 2. Update the tagline (special handling)
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        if (lang === 'en') {
            // Keep dual-language if English is selected
            tagline.textContent = 'अपनी स्किल्स के अनुसार इंटर्नशिप खोजें | Find internships matching your skills';
        } else {
            tagline.textContent = getTranslation(lang, 'tagline');
        }
    }
    
    // 3. Update placeholders
    const locationInput = document.getElementById('location');
    const preferredLocationsInput = document.getElementById('preferred_locations');
    const otherSkillsInput = document.getElementById('other_skills');
    
    if (locationInput) locationInput.placeholder = getTranslation(lang, 'location_placeholder');
    if (preferredLocationsInput) preferredLocationsInput.placeholder = getTranslation(lang, 'preferred_locations_placeholder');
    if (otherSkillsInput) otherSkillsInput.placeholder = getTranslation(lang, 'other_skills_placeholder');

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
            const response = await fetch(`${API_BASE_URL}/quick-match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                displayRecommendations(result.recommendations);
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
    
    // 💡 Add this simple check! If the button is not on the page, stop here.
    if (!registerBtn || !modal) {
        console.log("Registration elements not found. Skipping setup.");
        return; 
    }
    
    // Now the script can safely continue with the rest of the variables
    const closeModal = document.querySelector('.close-modal');
    const registrationForm = document.getElementById('registrationForm');
    
    registerBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
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
// --- NEW: Chatbot Functionality ---

function setupChatbot() {
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatModal = document.getElementById('chatModal');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatBody = document.getElementById('chatBody');
    const quickActionBtns = document.querySelectorAll('.action-btn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Open chat
    chatbotIcon.addEventListener('click', () => {
        chatModal.style.display = 'flex';
        chatbotIcon.style.display = 'none';
        chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom
    });

    // Close chat
    closeChatBtn.addEventListener('click', () => {
        chatModal.style.display = 'none';
        chatbotIcon.style.display = 'flex';
    });

    // Enable the text input and send button (previously left disabled)
    userInput.disabled = false;
    sendBtn.disabled = false;

    // Handle Quick Action Buttons (Static Responses)
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const userMessageText = e.target.textContent;
            handleBotReply(userMessageText, action);
        });
    });

    // Handle typed messages
    sendBtn.addEventListener('click', sendTypedMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendTypedMessage();
        }
    });

    function sendTypedMessage() {
        const text = userInput.value.trim();
        if (!text) return;
        handleBotReply(text, detectIntent(text));
        userInput.value = '';
    }

    // Simple keyword matching to map free text to an existing intent
    function detectIntent(text) {
        const lower = text.toLowerCase();
        if (lower.includes('eligib') || lower.includes('qualify') || lower.includes('pass')) {
            return 'Eligibility';
        }
        if (lower.includes('stipend') || lower.includes('salary') || lower.includes('pay') || lower.includes('money')) {
            return 'Stipend';
        }
        if (lower.includes('contact') || lower.includes('support') || lower.includes('help') || lower.includes('reach')) {
            return 'Contact';
        }
        return 'Unknown';
    }

    // Shared reply logic for both quick-action clicks and typed messages
    function handleBotReply(userMessageText, action) {
        // 1. Display user's message
        appendMessage(userMessageText, 'user-message');

        // 2. Respond with a bot message
        let botResponse = '';
        const lang = currentLanguage;

        switch (action) {
            case 'Eligibility':
                botResponse = getChatResponse(lang, 'eligibility');
                break;
            case 'Stipend':
                botResponse = getChatResponse(lang, 'stipend');
                break;
            case 'Contact':
                botResponse = getChatResponse(lang, 'contact');
                break;
            default:
                botResponse = "I'm not sure about that yet. Try asking about eligibility, stipend, or contact support — or tap one of the quick options below.";
        }

        // Simulate typing delay for bot response
        setTimeout(() => {
            appendMessage(botResponse, 'bot-message');
        }, 500);

        // Quick actions stay visible so the user can keep using them
    }
}

// Function to add a message to the chat body
function appendMessage(text, className) {
    const chatBody = document.getElementById('chatBody');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', className);
    messageDiv.textContent = text;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight; // Scroll to the latest message
}


// --- NEW: Language Translation Data and Function ---

const TRANSLATIONS = {
    // UI TEXT TRANSLATIONS (Used by updateLanguage function)
    'ui': {
        'hi': {
            'tagline': 'अपनी स्किल्स के अनुसार इंटर्नशिप खोजें',
            'location_placeholder': 'उदा. दिल्ली, बिहार, मुंबई',
            'preferred_locations_placeholder': 'उदा. दिल्ली, बैंगलोर, रिमोट',
            'other_skills_placeholder': 'अन्य कुशलताएं (कॉमा से अलग करें)',
        },
        'pa': {
            'tagline': 'ਆਪਣੀਆਂ ਮੁਹਾਰਤਾਂ ਅਨੁਸਾਰ ਇੰਟਰਨਸ਼ਿਪਾਂ ਲੱਭੋ',
            'location_placeholder': 'ਜਿਵੇਂ: ਦਿੱਲੀ, ਬਿਹਾਰ, ਮੁੰਬਈ',
            'preferred_locations_placeholder': 'ਜਿਵੇਂ: ਦਿੱਲੀ, ਬੈਂਗਲੁਰੂ, ਰਿਮੋਟ',
            'other_skills_placeholder': 'ਹੋਰ ਮੁਹਾਰਤਾਂ (ਕਾਮੇ ਨਾਲ ਵੱਖ ਕਰੋ)',
        },
        'bn': {
            'tagline': 'আপনার দক্ষতা অনুযায়ী ইন্টার্নশিপ খুঁজুন',
            'location_placeholder': 'যেমন: দিল্লি, বিহার, মুম্বাই',
            'preferred_locations_placeholder': 'যেমন: দিল্লি, বেঙ্গালুরু, রিমোট',
            'other_skills_placeholder': 'অন্যান্য দক্ষতা (কমা দ্বারা পৃথক)',
        },
        'ta': {
            'tagline': 'உங்கள் திறன்களுக்கு ஏற்ற இன்டர்ன்ஷிப்களைக் கண்டறியவும்',
            'location_placeholder': 'எ.கா. டெல்லி, பீகார், மும்பை',
            'preferred_locations_placeholder': 'எ.கா. டெல்லி, பெங்களூர், ரிமோட்',
            'other_skills_placeholder': 'பிற திறன்கள் (கமா மூலம் பிரிக்கவும்)',
        },
        'te': {
            'tagline': 'మీ నైపుణ్యాలకు సరిపోయే ఇంటర్న్‌షిప్‌లను కనుగొనండి',
            'location_placeholder': 'ఉదా. ఢిల్లీ, బీహార్, ముంబై',
            'preferred_locations_placeholder': 'ఉదా. ఢిల్లీ, బెంగళూరు, రిమోట్',
            'other_skills_placeholder': 'ఇతర నైపుణ్యాలు (కామాతో వేరు చేయండి)',
        },
        'mr': {
            'tagline': 'तुमच्या कौशल्यांशी जुळणाऱ्या इंटर्नशिप शोधा',
            'location_placeholder': 'उदा. दिल्ली, बिहार, मुंबई',
            'preferred_locations_placeholder': 'उदा. दिल्ली, बंगलोर, रिमोट',
            'other_skills_placeholder': 'इतर कौशल्ये (स्वल्पविरामाने वेगळे करा)',
        },
        'en': {
            'tagline': 'Find internships matching your skills',
            'location_placeholder': 'e.g., Delhi, Bihar, Mumbai',
            'preferred_locations_placeholder': 'e.g., Delhi, Bangalore, Remote',
            'other_skills_placeholder': 'Other skills (comma separated)',
        }
    },
    // CHATBOT RESPONSE TRANSLATIONS (Used by getChatResponse function)
    'chat': {
        'eligibility': {
            'en': "To check eligibility, please fill out the 'Education Level' and 'Location' fields in the form above. Generally, 10th pass is the minimum requirement for most PM schemes.",
            'hi': "पात्रता जांचने के लिए, कृपया ऊपर दिए गए फॉर्म में 'शिक्षा स्तर' और 'आपका स्थान' भरें। आमतौर पर, अधिकांश पीएम योजनाओं के लिए 10वीं पास न्यूनतम आवश्यकता है।",
            'pa': "ਯੋਗਤਾ ਦੀ ਜਾਂਚ ਕਰਨ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਉੱਪਰ ਦਿੱਤੇ ਫਾਰਮ ਵਿੱਚ 'ਸਿੱਖਿਆ ਪੱਧਰ' ਅਤੇ 'ਤੁਹਾਡਾ ਸਥਾਨ' ਭਰੋ। ਆਮ ਤੌਰ 'ਤੇ, ਜ਼ਿਆਦਾਤਰ ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਸਕੀਮਾਂ ਲਈ 10ਵੀਂ ਪਾਸ ਘੱਟੋ-ਘੱਟ ਲੋੜ ਹੈ।",
            'bn': "যোগ্যতা যাচাই করতে, দয়া করে উপরের ফর্মে 'শিক্ষার স্তর' এবং 'আপনার অবস্থান' পূরণ করুন। সাধারণত, বেশিরভাগ পিএম স্কিমের জন্য 10ম পাস ন্যূনতম প্রয়োজনীয়তা।",
            'ta': "தகுதிச் சரிபார்க்க, மேலே உள்ள படிவத்தில் 'கல்வி நிலை' மற்றும் 'உங்கள் இருப்பிடம்' ஆகியவற்றை நிரப்பவும். பொதுவாக, பெரும்பாலான பிரதமர் திட்டங்களுக்கு 10வது தேர்ச்சி குறைந்தபட்சத் தேவையாகும்.",
            'te': "అర్హతను తనిఖీ చేయడానికి, దయచేసి పై ఫారమ్‌లో 'విద్య స్థాయి' మరియు 'మీ స్థానం' పూరించండి. సాధారణంగా, చాలా వరకు PM పథకాలకు 10వ తరగతి పాస్ కనీస అవసరం.",
            'mr': "पात्रता तपासण्यासाठी, कृपया वरील फॉर्ममध्ये 'शिक्षण स्तर' आणि 'तुमचे स्थान' भरा. साधारणपणे, बहुतेक पीएम योजनांसाठी 10वी पास ही किमान आवश्यकता आहे.",
        },
        'stipend': {
            'en': "Stipend details vary by internship, but the minimum range on this platform is ₹0 to ₹20,000 per month. Use the 'Minimum Monthly Stipend' slider to set your preference.",
            'hi': "वजीफा विवरण इंटर्नशिप के अनुसार भिन्न होता है, लेकिन इस प्लेटफॉर्म पर न्यूनतम सीमा ₹0 से ₹20,000 प्रति माह है। अपनी प्राथमिकता निर्धारित करने के लिए 'न्यूनतम मासिक वजीफा' स्लाइडर का उपयोग करें।",
            'pa': "ਵਜ਼ੀਫ਼ੇ ਦੇ ਵੇਰਵੇ ਇੰਟਰਨਸ਼ਿਪ ਅਨੁਸਾਰ ਬਦਲਦੇ ਹਨ, ਪਰ ਇਸ ਪਲੇਟਫਾਰਮ 'ਤੇ ਘੱਟੋ-ਘੱਟ ਸੀਮਾ ₹0 ਤੋਂ ₹20,000 ਪ੍ਰਤੀ ਮਹੀਨਾ ਹੈ। ਆਪਣੀ ਤਰਜੀਹ ਸੈੱਟ ਕਰਨ ਲਈ 'ਘੱਟੋ-ਘੱਟ ਮਾਸਿਕ ਵਜ਼ੀਫ਼ਾ' ਸਲਾਈਡਰ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
            'bn': "ইন্টার্নশিপ অনুসারে স্টাইপেন্ডের বিবরণ পরিবর্তিত হয়, তবে এই প্ল্যাটফর্মে সর্বনিম্ন সীমা হল প্রতি মাসে ₹0 থেকে ₹20,000। আপনার পছন্দ সেট করতে 'ন্যূনতম মাসিক স্টাইপেন্ড' স্লাইডার ব্যবহার করুন।",
            'ta': "இன்டர்ன்ஷிப்பைப் பொறுத்து உதவித்தொகை விவரங்கள் மாறுபடும், ஆனால் இந்தப் தளத்தில் குறைந்தபட்ச வரம்பு மாதத்திற்கு ₹0 முதல் ₹20,000 வரை உள்ளது. உங்கள் விருப்பத்தை அமைக்க 'குறைந்தபட்ச மாத உதவித்தொகை' ஸ்லைடரைப் பயன்படுத்தவும்.",
            'te': "స్టిపెండ్ వివరాలు ఇంటర్న్‌షిప్‌ను బట్టి మారుతుంటాయి, కానీ ఈ ప్లాట్‌ఫారమ్‌లో కనీస పరిమితి నెలకు ₹0 నుండి ₹20,000 వరకు ఉంటుంది. మీ ప్రాధాన్యతను సెట్ చేయడానికి 'కనీస నెలవారీ స్టిపెండ్' స్లైడర్‌ను ఉపయోగించండి.",
            'mr': "स्टायपेंड तपशील इंटर्नशिपनुसार बदलतात, परंतु या प्लॅटफॉर्मवरील किमान श्रेणी दरमहा ₹0 ते ₹20,000 आहे. तुमची प्राधान्ये सेट करण्यासाठी 'किमान मासिक स्टायपेंड' स्लाइडर वापरा.",
        },
        'contact': {
            'en': "For support, please visit our official 'Contact Us' page (link coming soon) or check the FAQ section below the results.",
            'hi': "समर्थन के लिए, कृपया हमारे आधिकारिक 'हमसे संपर्क करें' पेज पर जाएं (लिंक जल्द आ रहा है) या परिणामों के नीचे FAQ अनुभाग देखें।",
            'pa': "ਸਹਾਇਤਾ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਸਾਡੇ ਅਧਿਕਾਰਤ 'ਸੰਪਰਕ ਕਰੋ' ਪੰਨੇ 'ਤੇ ਜਾਓ (ਲਿੰਕ ਜਲਦੀ ਆ ਰਿਹਾ ਹੈ) ਜਾਂ ਨਤੀਜਿਆਂ ਦੇ ਹੇਠਾਂ FAQ ਸੈਕਸ਼ਨ ਦੇਖੋ।",
            'bn': "সহায়তার জন্য, অনুগ্রহ করে আমাদের অফিসিয়াল 'যোগাযোগ করুন' পৃষ্ঠা দেখুন (লিঙ্ক শীঘ্রই আসছে) অথবা ফলাফলের নীচে FAQ বিভাগটি পরীক্ষা করুন।",
            'ta': "ஆதரவுக்காக, எங்கள் அதிகாரப்பூர்வ 'எங்களைத் தொடர்புகொள்ளவும்' பக்கத்தைப் பார்க்கவும் (இணைப்பு விரைவில் வருகிறது) அல்லது முடிவுகளுக்குக் கீழே உள்ள FAQ பிரிவைச் சரிபார்க்கவும்.",
            'te': "మద్దతు కోసం, దయచేసి మా అధికారిక 'మమ్మల్ని సంప్రదించండి' పేజీని సందర్శించండి (లింక్ త్వరలో వస్తుంది) లేదా ఫలితాల క్రింద FAQ విభాగాన్ని తనిఖీ చేయండి.",
            'mr': "समर्थनासाठी, कृपया आमच्या अधिकृत 'आमच्याशी संपर्क साधा' पृष्ठास भेट द्या (लिंक लवकरच येत आहे) किंवा निकालांच्या खालील FAQ विभाग तपासा.",
        }
    }
};

function getTranslation(lang, key) {
    const defaultLang = 'en';
    return TRANSLATIONS.ui[lang] && TRANSLATIONS.ui[lang][key] 
        ? TRANSLATIONS.ui[lang][key] 
        : TRANSLATIONS.ui[defaultLang][key];
}

function getChatResponse(lang, key) {
    const defaultLang = 'en';
    return TRANSLATIONS.chat[key] && TRANSLATIONS.chat[key][lang] 
        ? TRANSLATIONS.chat[key][lang] 
        : TRANSLATIONS.chat[key][defaultLang];
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
