
import { auth, db, doc, getDoc, setDoc, updateDoc } from './firebase-config.js';
import { showToast } from './app.js';

const courseId = 'paralegal';

const correctAnswers = {
    q1: 'b', q2: 'c', q3: 'b', q4: 'b', q5: 'b',
    q6: 'b', q7: 'b', q8: 'd', q9: 'a', q10: 'b',
    q11: 'b', q12: 'b', q13: 'a', q14: 'a', q15: 'b',
    q16: 'b', q17: 'b', q18: 'a', q19: 'a', q20: 'b',
    q21: 'b', q22: 'b', q23: 'b', q24: 'b', q25: 'b'
};

const testForm = document.getElementById('testForm');
if (testForm) {
    testForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let correct = 0;
        const totalQuestions = 25;
        
        for (let i = 1; i <= totalQuestions; i++) {
            const answer = document.querySelector(`input[name="q${i}"]:checked`);
            if (answer && answer.value === correctAnswers[`q${i}`]) {
                correct++;
            }
        }
        
        const score = Math.round((correct / totalQuestions) * 100);
        const passed = score >= 80;
        
        await saveTestResult(score, passed);
        
        showResultModal(score, passed);
    });
}

async function saveTestResult(score, passed) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const testRef = doc(db, 'testResults', `${user.uid}_${courseId}`);
        
        await setDoc(testRef, {
            userId: user.uid,
            courseId: courseId,
            score: score,
            passed: passed,
            completedAt: new Date(),
            attempts: 1
        });
        
        if (passed) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const completedCourses = userData.completedCourses || [];
                
                if (!completedCourses.includes(courseId)) {
                    completedCourses.push(courseId);
                    
                    await updateDoc(userRef, {
                        completedCourses: completedCourses
                    });
                }
            }
            
            await setDoc(doc(db, 'certificates', `${user.uid}_${courseId}`), {
                userId: user.uid,
                courseId: courseId,
                courseName: 'Paralegal Studies',
                studentName: user.displayName || user.email,
                issueDate: new Date(),
                score: score,
                paid: false
            });
        }
        
    } catch (error) {
        console.error('Error saving test result:', error);
    }
}

function showResultModal(score, passed) {
    const modal = document.getElementById('resultModal');
    const icon = document.getElementById('resultIcon');
    const title = document.getElementById('resultTitle');
    const message = document.getElementById('resultMessage');
    const scoreDisplay = document.getElementById('resultScore');
    const certBtn = document.getElementById('certificateBtn');
    
    scoreDisplay.textContent = `Score: ${score}%`;
    
    if (passed) {
        icon.className = 'result-icon pass';
        icon.innerHTML = '<i class="fas fa-trophy"></i>';
        title.textContent = 'Congratulations!';
        message.textContent = 'You passed the test!';
        certBtn.style.display = 'inline-block';
    } else {
        icon.className = 'result-icon fail';
        icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        title.textContent = 'Not Quite There';
        message.textContent = 'You need 80% or higher to pass. Don\'t worry, you can retake the test!';
        certBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

window.goToCertificate = function() {
    window.location.href = 'certificate.html';
};

window.retakeTest = function() {
    window.location.reload();
};

async function checkCourseCompletion() {
    const user = auth.currentUser;
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const progressRef = doc(db, 'courseProgress', `${user.uid}_${courseId}`);
        const progressDoc = await getDoc(progressRef);
        
        if (!progressDoc.exists() || !progressDoc.data().completed) {
            showToast('Please complete all course modules before taking the test.', 'warning');
            setTimeout(() => {
                window.location.href = `${courseId}.html`;
            }, 2000);
        }
    } catch (error) {
        console.error('Error checking completion:', error);
    }
}

document.addEventListener('DOMContentLoaded', checkCourseCompletion);