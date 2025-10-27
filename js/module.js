
import { auth, db, doc, getDoc, updateDoc } from './firebase-config.js';
import { showToast } from './app.js';

const moduleData = {
    1: {
        title: "Module 1: Introduction to Paralegal Work",
        description: "Understanding the role and responsibilities of a paralegal in the legal system"
    },
    2: {
        title: "Module 2: Legal Research Methods",
        description: "Master the techniques of effective legal research and analysis"
    },
    3: {
        title: "Module 3: Document Preparation",
        description: "Learn to prepare and manage legal documents professionally"
    },
    4: {
        title: "Module 4: Client Communication",
        description: "Develop professional communication skills for legal environments"
    },
    5: {
        title: "Module 5: Ethics and Professional Responsibility",
        description: "Understand the ethical obligations of paralegals"
    }
};

let currentModule = 1;
let timerSeconds = 25 * 60; 
let timerInterval;
let timerComplete = false;
const courseId = 'paralegal'; 

async function initModule() {
    const user = auth.currentUser;
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const progressRef = doc(db, 'courseProgress', `${user.uid}_${courseId}`);
        const progressDoc = await getDoc(progressRef);
        
        if (progressDoc.exists()) {
            const progress = progressDoc.data();
            currentModule = progress.currentModule || 1;
            
            await updateDoc(progressRef, {
                lastAccessed: new Date()
            });
        }
        
    } catch (error) {
        console.error('Error loading progress:', error);
    }
    
    loadModule(currentModule);
    
    startModuleTimer();
}

function loadModule(moduleNum) {
    const module = moduleData[moduleNum];
    
    document.getElementById('currentModule').textContent = moduleNum;
    document.getElementById('moduleTitle').textContent = module.title;
    document.getElementById('moduleDescription').textContent = module.description;
    
    const progress = (moduleNum / 5) * 100;
    document.getElementById('courseProgress').style.width = `${progress}%`;
    document.getElementById('progressPercent').textContent = Math.round(progress);
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (moduleNum === 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
    }
    
    nextBtn.disabled = true;
    
    timerSeconds = 25 * 60;
    timerComplete = false;
    
    if (moduleNum >= 5) {
        document.getElementById('completionCard').style.display = 'none';
    }
}

function startModuleTimer() {
    const timerDisplay = document.getElementById('moduleTimer');
    const timerStatus = document.getElementById('timerStatus');
    const nextBtn = document.getElementById('nextBtn');
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            clearInterval(timerInterval);
            timerComplete = true;
            nextBtn.disabled = false;
            timerStatus.textContent = 'Timer complete! You can now proceed to the next module.';
            timerStatus.style.color = 'green';
            showToast('Module timer complete! You can now proceed.', 'success');
        }
    }, 1000);
}

window.previousModule = async function() {
    if (currentModule > 1) {
        currentModule--;
        loadModule(currentModule);
        startModuleTimer();
        
        await updateProgress();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.nextModule = async function() {
    if (!timerComplete) {
        showToast('Please complete the 25-minute timer before proceeding.', 'warning');
        return;
    }
    
    if (currentModule < 5) {
        currentModule++;
        loadModule(currentModule);
        startModuleTimer();
        
        await updateProgress();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        document.querySelector('.module-content').style.display = 'none';
        document.getElementById('completionCard').style.display = 'block';
        
        await markCourseComplete();
    }
};

async function updateProgress() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const progressRef = doc(db, 'courseProgress', `${user.uid}_${courseId}`);
        const progressDoc = await getDoc(progressRef);
        
        if (progressDoc.exists()) {
            const progress = progressDoc.data();
            const completedModules = progress.completedModules || [];
            
            if (currentModule > 1 && !completedModules.includes(currentModule - 1)) {
                completedModules.push(currentModule - 1);
            }
            
            await updateDoc(progressRef, {
                currentModule: currentModule,
                completedModules: completedModules,
                lastAccessed: new Date()
            });
        }
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

async function markCourseComplete() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const progressRef = doc(db, 'courseProgress', `${user.uid}_${courseId}`);
        await updateDoc(progressRef, {
            completed: true,
            completedAt: new Date(),
            completedModules: [1, 2, 3, 4, 5]
        });
        
        showToast('Congratulations! You completed all modules!', 'success');
    } catch (error) {
        console.error('Error marking course complete:', error);
    }
}

window.goToTest = function() {
    window.location.href = `${courseId}test.html`;
};

document.addEventListener('DOMContentLoaded', initModule);