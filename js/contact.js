
import { db, collection, addDoc } from './firebase-config.js';
import { showToast } from './app.js';

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        try {
        
            await addDoc(collection(db, 'contactMessages'), {
                name: name,
                email: email,
                subject: subject,
                message: message,
                createdAt: new Date(),
                status: 'new'
            });
            
            showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
            
            contactForm.reset();
            
        } catch (error) {
            console.error('Contact form error:', error);
            showToast('Failed to send message. Please try again.', 'danger');
        }
    });
}