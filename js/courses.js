
import { auth, db, doc, getDoc, updateDoc, setDoc } from './firebase-config.js';
import { showToast } from './app.js';

function startCountdown() {

    let endTime = localStorage.getItem('offerEndTime');
    
    if (!endTime) {
        endTime = Date.now() + (48 * 60 * 60 * 1000); 
        localStorage.setItem('offerEndTime', endTime);
    } else {
        endTime = parseInt(endTime);
    }
    
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!hoursEl) return;
    
    function updateTimer() {
        const now = Date.now();
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

window.enrollCourse = async function(courseId) {
    const user = auth.currentUser;
    
    if (!user) {
        showToast('Please login to enroll in courses', 'warning');
        setTimeout(() => {
            window.showLoginModal();
        }, 500);
        return;
    }
    
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const enrolledCourses = userData.enrolledCourses || [];
            
            if (enrolledCourses.includes(courseId)) {
                showToast('You are already enrolled in this course!', 'info');
                
                setTimeout(() => {
                    window.location.href = `${courseId}.html`;
                }, 1000);
                return;
            }
            
            enrolledCourses.push(courseId);
            
            await updateDoc(userRef, {
                enrolledCourses: enrolledCourses
            });
            
            await setDoc(doc(db, 'courseProgress', `${user.uid}_${courseId}`), {
                userId: user.uid,
                courseId: courseId,
                currentModule: 1,
                completedModules: [],
                startedAt: new Date(),
                lastAccessed: new Date()
            });
            
            showToast('Successfully enrolled! Redirecting to course...', 'success');
            
            setTimeout(() => {
                window.location.href = `${courseId}.html`;
            }, 1500);
            
        } else {
            
            await setDoc(userRef, {
                name: user.displayName || 'Student',
                email: user.email,
                enrolledCourses: [courseId],
                completedCourses: [],
                certificates: []
            });
            
            await setDoc(doc(db, 'courseProgress', `${user.uid}_${courseId}`), {
                userId: user.uid,
                courseId: courseId,
                currentModule: 1,
                completedModules: [],
                startedAt: new Date(),
                lastAccessed: new Date()
            });
            
            showToast('Successfully enrolled! Redirecting to course...', 'success');
            
            setTimeout(() => {
                window.location.href = `${courseId}.html`;
            }, 1500);
        }
        
    } catch (error) {
        console.error('Enrollment error:', error);
        showToast('Failed to enroll. Please try again.', 'danger');
    }
};

if (document.getElementById('globalCountdown')) {
    startCountdown();
}