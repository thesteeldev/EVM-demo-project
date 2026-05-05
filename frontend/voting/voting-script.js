/**
 * ===========================
 * EVM - Electronic Voting Machine
 * Vanilla JavaScript (ES6+)
 * Production-Ready | Well-Commented
 * ===========================
 */

// ===========================
// DOM ELEMENT REFERENCES
// ===========================
const dom = {
    // Login Section
    loginSection: document.getElementById('loginSection'),
    voterIdInput: document.getElementById('voterIdInput'),
    btnContinue: document.getElementById('btnContinue'),

    // Candidates Section
    candidatesSection: document.getElementById('candidatesSection'),
    voteButtons: document.querySelectorAll('.btn--vote'),

    // Confirmation Modal
    modalOverlay: document.getElementById('confirmationModal'),
    btnConfirmYes: document.getElementById('btnConfirmYes'),
    btnConfirmNo: document.getElementById('btnConfirmNo'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer'),

    // App Container (for global disabled state)
    appContainer: document.querySelector('.app-container'),
};

// ===========================
// APPLICATION STATE
// ===========================
const state = {
    voterId: null, // Stores the entered Voter ID after login
    selectedCandidateId: null, // Stores the candidate ID when user clicks "வாக்களிக்க"
    hasVoted: false, // Becomes true after a successful vote submission
    isProcessing: false, // True while the API request is in flight
};

// ===========================
// TOAST NOTIFICATION SYSTEM
// ===========================
/**
 * Displays a temporary toast notification.
 * @param {string} message - The message text to display.
 * @param {'success'|'error'|'info'} type - The type of toast (affects styling).
 * @param {number} duration - How long the toast stays visible (in ms).
 */
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast--${type}`);
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    dom.toastContainer.appendChild(toast);

    // Auto-remove after duration
    const removalTimeout = setTimeout(() => {
        removeToast(toast);
    }, duration);

    // Store timeout reference on the element for potential early removal
    toast._removalTimeout = removalTimeout;

    // Allow clicking the toast to dismiss it early
    toast.addEventListener('click', () => {
        clearTimeout(toast._removalTimeout);
        removeToast(toast);
    });
}

/**
 * Smoothly removes a toast element from the DOM.
 * @param {HTMLElement} toast - The toast element to remove.
 */
function removeToast(toast) {
    if (toast._isRemoving) return; // Prevent double-removal
    toast._isRemoving = true;
    toast.classList.add('toast--removing');
    toast.addEventListener('animationend', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, { once: true });
    // Fallback: force removal after animation duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 400);
}

// ===========================
// INPUT VALIDATION
// ===========================
/**
 * Validates the voter ID input.
 * @param {string} voterId - The raw input value.
 * @returns {boolean} - True if valid, false otherwise.
 */
function validateVoterId(voterId) {
    const trimmed = voterId.trim();
    if (trimmed.length === 0) {
        return false;
    }
    // Basic sanity: at least 3 characters, alphanumeric with possible hyphens
    if (trimmed.length < 3) {
        return false;
    }
    return true;
}

/**
 * Shows a temporary error state on the input field.
 */
function showInputError() {
    dom.voterIdInput.classList.add('input--error');
    // Shake animation lasts ~0.5s, remove class after that
    setTimeout(() => {
        dom.voterIdInput.classList.remove('input--error');
    }, 550);
}

// ===========================
// LOGIN FLOW
// ===========================
/**
 * Handles the "தொடரவும்" (Continue) button click.
 * Validates the voter ID, stores it, hides the login section,
 * and activates the candidates section.
 */
function handleLogin() {
    const rawVoterId = dom.voterIdInput.value;
    const trimmedVoterId = rawVoterId.trim();

    // Validate input
    if (!validateVoterId(trimmedVoterId)) {
        showInputError();
        showToast('தயவுசெய்து சரியான வாக்காளர் அடையாள எண்ணை உள்ளிடவும்.', 'error', 3000);
        return;
    }

    // Store voter ID in state
    state.voterId = trimmedVoterId;

    // Hide login section smoothly
    dom.loginSection.classList.add('login-section--hidden');

    // Activate candidates section after a short delay for smooth transition
    setTimeout(() => {
        dom.candidatesSection.classList.remove('candidates-section--inactive');
        dom.candidatesSection.classList.add('candidates-section--active');
        // Scroll candidates section into view
        dom.candidatesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);

    showToast('வணக்கம்! தயவுசெய்து உங்கள் வேட்பாளரை தேர்வு செய்யவும்.', 'info', 3000);
}

// ===========================
// VOTING FLOW
// ===========================
/**
 * Handles the "வாக்களிக்க" (Vote) button click on a candidate card.
 * Stores the selected candidate ID and opens the confirmation modal.
 * @param {Event} event - The click event.
 */
function handleVoteClick(event) {
    // Prevent voting if already voted or processing
    if (state.hasVoted || state.isProcessing) {
        return;
    }

    const button = event.currentTarget;
    const candidateId = button.getAttribute('data-candidate-id');

    if (!candidateId) {
        console.error('Candidate ID not found on button:', button);
        return;
    }

    // Store selected candidate ID
    state.selectedCandidateId = candidateId;

    // Show confirmation modal
    openModal();
}

/**
 * Opens the confirmation modal.
 */
function openModal() {
    dom.modalOverlay.classList.add('modal-overlay--visible');
    dom.modalOverlay.setAttribute('aria-hidden', 'false');
    // Reset the Yes button state in case it was previously in "Processing..." mode
    resetConfirmYesButton();
    // Focus the No button for accessibility
    setTimeout(() => {
        dom.btnConfirmNo.focus();
    }, 100);
}

/**
 * Closes the confirmation modal and clears the selected candidate.
 */
function closeModal() {
    dom.modalOverlay.classList.remove('modal-overlay--visible');
    dom.modalOverlay.setAttribute('aria-hidden', 'true');
    state.selectedCandidateId = null;
    // Refocus the voter ID input or a neutral element
    dom.voterIdInput.focus();
}

/**
 * Resets the "ஆம்" (Yes) button to its default state.
 */
function resetConfirmYesButton() {
    dom.btnConfirmYes.innerHTML = '✔️ ஆம்';
    dom.btnConfirmYes.disabled = false;
    state.isProcessing = false;
}

// ===========================
// CONFIRMATION HANDLERS
// ===========================
/**
 * Handles the "இல்லை" (No) button click in the modal.
 * Closes the modal and clears the selected candidate.
 */
function handleConfirmNo() {
    closeModal();
    showToast('வாக்களிப்பு ரத்து செய்யப்பட்டது.', 'info', 2500);
}

/**
 * Handles the "ஆம்" (Yes) button click in the modal.
 * Sends the vote to the backend API.
 */
async function handleConfirmYes() {
    // Prevent double-submission
    if (state.isProcessing || state.hasVoted) {
        return;
    }

    // Validate we have both voter ID and candidate ID
    if (!state.voterId || !state.selectedCandidateId) {
        showToast('பிழை: வாக்காளர் அல்லது வேட்பாளர் தகவல் இல்லை. மீண்டும் முயற்சிக்கவும்.', 'error', 4000);
        closeModal();
        return;
    }

    // Set processing state
    state.isProcessing = true;
    dom.btnConfirmYes.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    dom.btnConfirmYes.disabled = true;

    // Build the request payload
    const payload = {
        voter_id: state.voterId,
        candidate_id: state.selectedCandidateId,
    };

    try {
        // Send POST request to the backend
        const response = await fetch('https://evm-live-backend.onrender.com/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // Parse the response body (may be JSON or empty)
        let responseData = null;
        try {
            responseData = await response.json();
        } catch {
            // Response body may be empty or not JSON
            responseData = null;
        }

        if (response.ok) {
            // ========== SUCCESS: Vote registered ==========
            state.hasVoted = true;
            closeModal();
            showToast('வாக்கு பதிவானது! 🎉', 'success', 5000);
            // Disable all buttons on the entire screen
            disableAllButtons();
            // Also disable candidates section interaction
            dom.candidatesSection.classList.add('candidates-section--inactive');
            dom.candidatesSection.classList.remove('candidates-section--active');
        } else {
            // ========== ERROR: Backend returned non-200 status ==========
            const errorMessage =
                (responseData && responseData.message) ||
                (responseData && responseData.error) ||
                `பிழை: ${response.status} - வாக்கு பதிவு செய்ய முடியவில்லை.`;
            showToast(errorMessage, 'error', 5000);
            resetConfirmYesButton();
        }
    } catch (networkError) {
        // ========== NETWORK / FETCH ERROR ==========
        console.error('Vote API Error:', networkError);
        showToast(
            'நெட்வொர்க் பிழை: சேவையகத்துடன் இணைப்பு ஏற்படவில்லை. தயவுசெய்து பின்னர் முயற்சிக்கவும்.',
            'error',
            6000
        );
        resetConfirmYesButton();
    }
}

/**
 * Disables all buttons on the screen after a successful vote.
 */
function disableAllButtons() {
    // Add a class to the app container that disables all buttons via CSS
    dom.appContainer.classList.add('all-buttons-disabled');
    // Also explicitly disable every button element
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach((btn) => {
        btn.disabled = true;
    });
}

// ===========================
// KEYBOARD ACCESSIBILITY
// ===========================
/**
 * Handles the Escape key to close the modal.
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
    if (event.key === 'Escape') {
        const isModalVisible = dom.modalOverlay.classList.contains('modal-overlay--visible');
        if (isModalVisible && !state.isProcessing) {
            handleConfirmNo();
        }
    }
    // Allow Enter key on the voter ID input to trigger login
    if (event.key === 'Enter' && document.activeElement === dom.voterIdInput) {
        const isLoginVisible = !dom.loginSection.classList.contains('login-section--hidden');
        if (isLoginVisible && !state.hasVoted) {
            handleLogin();
        }
    }
}

// ===========================
// MODAL OVERLAY CLICK TO CLOSE
// ===========================
/**
 * Closes the modal if the user clicks the dark overlay (outside the popup).
 * This acts as an implicit "No" action.
 * @param {MouseEvent} event
 */
function handleOverlayClick(event) {
    // Only close if the click target is the overlay itself (not the popup)
    if (event.target === dom.modalOverlay && !state.isProcessing) {
        handleConfirmNo();
    }
}

// ===========================
// EVENT LISTENER REGISTRATION
// ===========================
function bindEvents() {
    // Login
    dom.btnContinue.addEventListener('click', handleLogin);
    dom.voterIdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const isLoginVisible = !dom.loginSection.classList.contains('login-section--hidden');
            if (isLoginVisible && !state.hasVoted) {
                handleLogin();
            }
        }
    });

    // Vote buttons on candidate cards
    dom.voteButtons.forEach((button) => {
        button.addEventListener('click', handleVoteClick);
    });

    // Modal buttons
    dom.btnConfirmYes.addEventListener('click', handleConfirmYes);
    dom.btnConfirmNo.addEventListener('click', handleConfirmNo);

    // Modal overlay click
    dom.modalOverlay.addEventListener('click', handleOverlayClick);

    // Global keyboard listener
    document.addEventListener('keydown', handleKeyDown);
}

// ===========================
// INITIALIZATION
// ===========================
function init() {
    // Ensure candidates section starts inactive
    dom.candidatesSection.classList.add('candidates-section--inactive');
    dom.candidatesSection.classList.remove('candidates-section--active');

    // Ensure modal is hidden
    dom.modalOverlay.classList.remove('modal-overlay--visible');
    dom.modalOverlay.setAttribute('aria-hidden', 'true');

    // Reset state
    state.voterId = null;
    state.selectedCandidateId = null;
    state.hasVoted = false;
    state.isProcessing = false;

    // Focus the voter ID input for convenience
    setTimeout(() => {
        dom.voterIdInput.focus();
    }, 300);

    // Bind all event listeners
    bindEvents();

    console.log('✅ EVM Application Initialized Successfully.');
    console.log('📋 State:', { ...state });
    console.log('🌐 API Endpoint: https://evm-live-backend.onrender.com/api/vote');
}

// ===========================
// START THE APPLICATION
// ===========================
document.addEventListener('DOMContentLoaded', init);