
import { auth, db, collection, query, where, getDocs, doc, updateDoc, addDoc } from './firebase-config.js';
import { showToast } from './app.js';

async function loadNotifications() {
    const user = auth.currentUser;
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(notificationsQuery);
        const notifications = [];
        
        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        
        notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        displayNotifications(notifications);
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        
        displaySampleNotifications();
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                <h4>No Notifications</h4>
                <p class="text-muted">You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    notifications.forEach(notif => {
        const notifElement = createNotificationElement(notif);
        container.appendChild(notifElement);
    });
}

function displaySampleNotifications() {
    const container = document.getElementById('notificationsList');
    const user = auth.currentUser;
    
    const sampleNotifications = [
        {
            id: '1',
            title: 'Welcome to Learner Education!',
            message: 'Thank you for joining us. Start your learning journey today!',
            type: 'info',
            read: false,
            createdAt: new Date()
        },
        {
            id: '2',
            title: 'Complete Your Course',
            message: 'You\'re halfway through Paralegal Studies. Keep up the great work!',
            type: 'reminder',
            read: false,
            createdAt: new Date(Date.now() - 3600000) 
        },
        {
            id: '3',
            title: 'Special Offer Ending Soon',
            message: 'Our special pricing ends in 48 hours. Don\'t miss out on great savings!',
            type: 'alert',
            read: true,
            createdAt: new Date(Date.now() - 86400000) 
        }
    ];
    
    container.innerHTML = '';
    
    sampleNotifications.forEach(notif => {
        const notifElement = createNotificationElement(notif);
        container.appendChild(notifElement);
    });
}

function createNotificationElement(notif) {
    const div = document.createElement('div');
    div.className = `notification-item ${notif.read ? '' : 'unread'}`;
    
    const createdAt = notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt);
    const timeAgo = getTimeAgo(createdAt);
    
    const icon = getNotificationIcon(notif.type);
    
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h5 class="mb-1">
                    <i class="${icon}"></i> ${notif.title}
                </h5>
                <p class="mb-1">${notif.message}</p>
                <p class="notification-time">${timeAgo}</p>
            </div>
            ${!notif.read ? '<span class="badge bg-primary">New</span>' : ''}
        </div>
    `;
    
    if (!notif.read) {
        div.addEventListener('click', () => {
            markAsRead(notif.id);
            div.classList.remove('unread');
            const badge = div.querySelector('.badge');
            if (badge) badge.remove();
        });
    }
    
    return div;
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'fas fa-info-circle text-primary',
        'reminder': 'fas fa-clock text-warning',
        'alert': 'fas fa-exclamation-triangle text-danger',
        'success': 'fas fa-check-circle text-success'
    };
    
    return icons[type] || 'fas fa-bell text-primary';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    return 'Just now';
}

async function markAsRead(notificationId) {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, {
            read: true,
            readAt: new Date()
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

window.markAllRead = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
        );
        
        const querySnapshot = await getDocs(notificationsQuery);
        
        const updatePromises = [];
        querySnapshot.forEach((doc) => {
            updatePromises.push(
                updateDoc(doc.ref, {
                    read: true,
                    readAt: new Date()
                })
            );
        });
        
        await Promise.all(updatePromises);
        
        showToast('All notifications marked as read', 'success');
        
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            const badge = item.querySelector('.badge');
            if (badge) badge.remove();
        });
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        showToast('Failed to mark all as read', 'danger');
    }
};

export async function createNotification(userId, title, message, type = 'info') {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadNotifications);