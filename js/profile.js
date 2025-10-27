
import { auth, db, doc, getDoc, updateDoc, deleteDoc, updateProfile } from './firebase-config.js';
import { showToast } from './app.js';

const courseTitles = {
    'paralegal': 'Paralegal Studies',
    'digitalmarketing': 'Digital Marketing',
    'webdevelopment': 'Web Development',
    'graphicdesign': 'Graphic Design',
    'projectmanagement': 'Project Management'
};

async function loadProfile() {
    const user = auth.currentUser;
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            document.getElementById('profileName').textContent = userData.name || user.displayName || 'Student';
            document.getElementById('profileEmail').textContent = user.email;
            
            const initials = getInitials(userData.name || user.displayName || user.email);
            document.getElementById('profileAvatar').textContent = initials;
            
            const joinDate = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
            document.getElementById('joinDate').textContent = joinDate.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });
            
            document.getElementById('editName').value = userData.name || user.displayName || '';
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editPhone').value = userData.phone || '';
            document.getElementById('editCountry').value = userData.country || '';
            
            loadEnrolledCourses(userData.enrolledCourses || []);
            
            loadUserCertificates(userData.completedCourses || []);
            
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile', 'danger');
    }
}

function getInitials(name) {
    const names = name.split(' ');
    if (names.length > 1) {
        return names[0][0] + names[1][0];
    }
    return name.substring(0, 2).toUpperCase();
}

function loadEnrolledCourses(courses) {
    const container = document.getElementById('enrolledCourses');
    
    if (courses.length === 0) {
        container.innerHTML = '<p class="text-muted">You haven\'t enrolled in any courses yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    courses.forEach(courseId => {
        const courseCard = document.createElement('div');
        courseCard.className = 'card mb-3';
        courseCard.style.borderRadius = '10px';
        courseCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${courseTitles[courseId] || courseId}</h5>
                        <p class="text-muted mb-0">
                            <i class="fas fa-clock"></i> 20 Hours • 
                            <i class="fas fa-book"></i> 5 Modules
                        </p>
                    </div>
                    <button class="btn btn-primary-custom" onclick="window.location.href='${courseId}.html'">
                        Continue <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(courseCard);
    });
}

function loadUserCertificates(completedCourses) {
    const container = document.getElementById('myCertificates');
    
    if (completedCourses.length === 0) {
        container.innerHTML = '<p class="text-muted">Complete courses to earn certificates.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    completedCourses.forEach(courseId => {
        const certCard = document.createElement('div');
        certCard.className = 'card mb-3';
        certCard.style.borderRadius = '10px';
        certCard.style.borderLeft = '4px solid var(--success)';
        certCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">
                            <i class="fas fa-certificate text-success"></i> 
                            ${courseTitles[courseId] || courseId}
                        </h5>
                        <p class="text-muted mb-0">Certificate earned</p>
                    </div>
                    <button class="btn btn-outline-primary" onclick="window.location.href='certificate.html'">
                        View Certificate
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(certCard);
    });
}

const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) return;
        
        const name = document.getElementById('editName').value;
        const phone = document.getElementById('editPhone').value;
        const country = document.getElementById('editCountry').value;
        
        try {

            await updateProfile(user, {
                displayName: name
            });
      
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: name,
                phone: phone,
                country: country,
                updatedAt: new Date()
            });
            
            showToast('Profile updated successfully!', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Profile update error:', error);
            showToast('Failed to update profile', 'danger');
        }
    });
}

const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'danger');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'danger');
            return;
        }
        
        showToast('Password change functionality requires reauthentication. Please contact support.', 'info');
    });
}

window.deleteAccount = async function() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {

        await deleteDoc(doc(db, 'users', user.uid));
        
        await user.delete();
        
        showToast('Account deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Delete account error:', error);
        showToast('Failed to delete account. You may need to reauthenticate.', 'danger');
    }
};

document.addEventListener('DOMContentLoaded', loadProfile);