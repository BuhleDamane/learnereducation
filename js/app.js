
import { auth, onAuthStateChanged, signOut } from './firebase-config.js';

onAuthStateChanged(auth, (user) => {
    updateNavigation(user);
    
    const protectedPages = ['profile.html', 'notifications.html', 'paralegal.html', 'paralegaltest.html', 'certificate.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!user && protectedPages.includes(currentPage)) {
        window.location.href = 'index.html';
    }
});

function updateNavigation(user) {
    const navbar = document.getElementById('mainNav');
    if (!navbar) return;

    if (user) {

        navbar.innerHTML = `
            <div class="container">
                <a class="navbar-brand" href="index.html">
                    <i class="fas fa-graduation-cap"></i> Learner Education
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="about.html">About</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="courses.html">Courses</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="contact.html">Contact</a>
                        </li>
                        <li class="nav-item">
                            <div class="navbar-icons">
                                <button class="icon-btn" onclick="window.location.href='notifications.html'" title="Notifications">
                                    <i class="fas fa-bell"></i>
                                    <span class="notification-badge" id="notifBadge">3</span>
                                </button>
                                <div class="user-avatar" onclick="window.location.href='profile.html'" title="Profile">
                                    ${getUserInitials(user)}
                                </div>
                                <button class="btn btn-sm btn-outline-danger ms-2" onclick="handleLogout()">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    } else {

        navbar.innerHTML = `
            <div class="container">
                <a class="navbar-brand" href="index.html">
                    <i class="fas fa-graduation-cap"></i> Learner Education
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="about.html">About</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="courses.html">Courses</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="contact.html">Contact</a>
                        </li>
                        <li class="nav-item">
                            <button class="btn btn-login" onclick="showLoginModal()">Login / Sign Up</button>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }

    highlightActivePage();
}

function getUserInitials(user) {
    if (user.displayName) {
        const names = user.displayName.split(' ');
        return names.length > 1 
            ? names[0][0] + names[1][0] 
            : names[0][0] + names[0][1];
    }
    return user.email[0].toUpperCase();
}

function highlightActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

window.handleLogout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
};

window.showLoginModal = function() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
};

window.showSignupForm = function() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) loginModal.hide();
    
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    signupModal.show();
};

window.showLoginForm = function() {
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    if (signupModal) signupModal.hide();
    
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
};

export function getCurrentUser() {
    return auth.currentUser;
}

export function isUserLoggedIn() {
    return auth.currentUser !== null;
}

export function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
    return container;
}