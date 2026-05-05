/**
 * EVM System - Home / Dashboard
 * Firebase Auth (Google Sign‑In) + Eligibility Check
 */

// script.js (Home Page Logic)



// ===========================
// FIREBASE CONFIGURATION
// ===========================
// IMPORTANT: Replace these dummy values with your actual Firebase project config.
const firebaseConfig = {
  apiKey: "AIzaSyAN4XUAmt8pFToDh56PxoWWBNxqCxXPDZ0",
  authDomain: "evm-live-system.firebaseapp.com",
  databaseURL: "https://evm-live-system-default-rtdb.firebaseio.com",
  projectId: "evm-live-system",
  storageBucket: "evm-live-system.firebasestorage.app",
  messagingSenderId: "742571817237",
  appId: "1:742571817237:web:200035af1fe829471d911c",
  measurementId: "G-QVYY5JCYD8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ===========================
// DOM ELEMENTS
// ===========================
const loginModal = document.getElementById('loginModal');
const dashboard = document.getElementById('dashboard');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const loadingModal = document.getElementById('loadingModal');
const enterButtons = document.querySelectorAll('.btn--enter');

// ===========================
// SESSION MANAGEMENT
// ===========================
function saveUserSession(email) {
    sessionStorage.setItem('evm_user_email', email);
}

function getUserSession() {
    return sessionStorage.getItem('evm_user_email');
}

function clearUserSession() {
    sessionStorage.removeItem('evm_user_email');
}

// ===========================
// UI STATE MANAGEMENT
// ===========================
function showDashboard(userEmail) {
    loginModal.style.display = 'none';
    dashboard.style.display = 'flex';
    userEmailDisplay.textContent = userEmail;
}

function showLogin() {
    dashboard.style.display = 'none';
    loginModal.style.display = 'flex';
    loginModal.style.opacity = '1';
}

function showLoadingModal() {
    loadingModal.classList.add('loading-overlay--visible');
    loadingModal.setAttribute('aria-hidden', 'false');
}

function hideLoadingModal() {
    loadingModal.classList.remove('loading-overlay--visible');
    loadingModal.setAttribute('aria-hidden', 'true');
}

// ===========================
// GOOGLE AUTHENTICATION
// ===========================
const provider = new firebase.auth.GoogleAuthProvider();

googleSignInBtn.addEventListener('click', async () => {
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        if (user && user.email) {
            saveUserSession(user.email);
            showDashboard(user.email);
        }
    } catch (error) {
        console.error('Google Sign‑In Error:', error);
        alert('உள்நுழைவு தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        clearUserSession();
        showLogin();
    } catch (error) {
        console.error('Logout Error:', error);
    }
});

// ===========================
// ELECTION ENTRY (DIRECT REDIRECT FOR OFFLINE TESTING)
// ===========================
enterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const btn = e.currentTarget;

        // பட்டன் Disabled ஆக இருந்தால் வேலை செய்யக்கூடாது
        if (btn.disabled) return;

        const electionId = btn.getAttribute('data-election');
        const isLive = btn.getAttribute('data-live') === 'true';

        if (!isLive || !electionId) return;

        // எந்த API செக்கிங்கும் இல்லாமல் நேரடியாக Voting Page-க்கு செல்ல:
        window.location.href = `voting/voting.html?election=${electionId}`;
    });
});

// ===========================
// AUTH STATE OBSERVER
// ===========================
firebase.auth().onAuthStateChanged((user) => {
    if (user && user.email) {
        // User is signed in
        saveUserSession(user.email);
        showDashboard(user.email);
    } else {
        // No user, check session as fallback (in case of reload)
        const storedEmail = getUserSession();
        if (storedEmail) {
            // Show dashboard with stored email (user might re-auth later)
            showDashboard(storedEmail);
        } else {
            showLogin();
        }
    }
});



// ===========================
// INITIAL STATE HIDDEN LOADER
// ===========================
hideLoadingModal();