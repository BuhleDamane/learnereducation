
import { auth, db, doc, getDoc, updateDoc, query, collection, where, getDocs } from './firebase-config.js';
import { showToast } from './app.js';

const courseTitles = {
    'paralegal': 'Paralegal Studies',
    'digitalmarketing': 'Digital Marketing',
    'webdevelopment': 'Web Development',
    'graphicdesign': 'Graphic Design',
    'projectmanagement': 'Project Management'
};

async function loadCertificates() {
    const user = auth.currentUser;
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const certificatesQuery = query(
            collection(db, 'certificates'),
            where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(certificatesQuery);
        const certificates = [];
        
        querySnapshot.forEach((doc) => {
            certificates.push({ id: doc.id, ...doc.data() });
        });
        
        if (certificates.length === 0) {
            document.getElementById('noCertificates').style.display = 'block';
        } else {
            displayCertificates(certificates);
        }
        
    } catch (error) {
        console.error('Error loading certificates:', error);
        showToast('Error loading certificates', 'danger');
    }
}

function displayCertificates(certificates) {
    const container = document.getElementById('certificatesList');
    container.innerHTML = '';
    
    certificates.forEach(cert => {
        const certCard = createCertificateCard(cert);
        container.appendChild(certCard);
    });
}

function createCertificateCard(cert) {
    const div = document.createElement('div');
    div.className = 'certificate-card';
    
    const issueDate = cert.issueDate?.toDate ? cert.issueDate.toDate() : new Date(cert.issueDate);
    const formattedDate = issueDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    div.innerHTML = `
        <div class="certificate-preview" id="cert-${cert.courseId}">
            <div class="cert-border">
                <div class="cert-header">Certificate of Completion</div>
                <div class="cert-subtitle">This is to certify that</div>
                <div class="cert-name">${cert.studentName}</div>
                <div class="cert-subtitle">has successfully completed the course</div>
                <div class="cert-course">${cert.courseName}</div>
                <div class="cert-subtitle">with a score of ${cert.score}%</div>
                <div class="cert-date">Issued on ${formattedDate}</div>
                <div class="cert-seal">
                    <i class="fas fa-award"></i>
                </div>
                <div class="mt-3">
                    <small><i class="fas fa-graduation-cap"></i> Learner Education</small>
                </div>
            </div>
        </div>
        
        <div class="text-center no-print">
            ${cert.paid 
                ? `<button class="btn btn-primary-custom btn-lg" onclick="downloadCertificate('${cert.courseId}', '${cert.courseName}')">
                    <i class="fas fa-download"></i> Download Certificate
                   </button>
                   <button class="btn btn-outline-primary btn-lg ms-2" onclick="printCertificate('cert-${cert.courseId}')">
                    <i class="fas fa-print"></i> Print Certificate
                   </button>`
                : `<button class="btn btn-primary-custom btn-lg" onclick="showPaymentModal('${cert.courseId}')">
                    <i class="fas fa-lock"></i> Pay R50 to Download
                   </button>`
            }
        </div>
    `;
    
    return div;
}

window.showPaymentModal = function(courseId) {
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
    
    window.currentCertificateCourse = courseId;
};

const paymentForm = document.getElementById('paymentForm');
if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
       
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            const certRef = doc(db, 'certificates', `${user.uid}_${window.currentCertificateCourse}`);
            
            await updateDoc(certRef, {
                paid: true,
                paymentDate: new Date()
            });
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
            modal.hide();
            
            showToast('Payment successful! You can now download your certificate.', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Payment error:', error);
            showToast('Payment failed. Please try again.', 'danger');
        }
    });
}

window.downloadCertificate = async function(courseId, courseName) {
    const certElement = document.getElementById(`cert-${courseId}`);
    
    if (!certElement) {
        showToast('Certificate not found', 'danger');
        return;
    }
    
    try {
   
        const canvas = await html2canvas(certElement, {
            scale: 2,
            backgroundColor: '#ffffff'
        });
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${courseName.replace(/\s+/g, '_')}_Certificate.png`;
            link.click();
            
            URL.revokeObjectURL(url);
            showToast('Certificate downloaded successfully!', 'success');
        });
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download certificate', 'danger');
    }
};

window.printCertificate = function(certId) {
    const certElement = document.getElementById(certId);
    
    if (!certElement) {
        showToast('Certificate not found', 'danger');
        return;
    }
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Certificate</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: 'Georgia', serif;
                }
                .certificate-preview {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    border: 10px solid #4D7CFE;
                    border-radius: 10px;
                    padding: 60px 40px;
                    text-align: center;
                }
                .cert-border {
                    border: 3px double #4D7CFE;
                    padding: 40px;
                }
                .cert-header {
                    font-size: 3rem;
                    font-weight: 800;
                    color: #4D7CFE;
                    margin-bottom: 20px;
                }
                .cert-subtitle {
                    font-size: 1.2rem;
                    color: #2D3748;
                    margin-bottom: 30px;
                    font-style: italic;
                }
                .cert-name {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #2D3748;
                    margin: 30px 0;
                    border-bottom: 2px solid #4D7CFE;
                    padding-bottom: 10px;
                    display: inline-block;
                }
                .cert-course {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #3D6CED;
                    margin: 20px 0;
                }
                .cert-date {
                    font-size: 1rem;
                    color: #718096;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            ${certElement.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

document.addEventListener('DOMContentLoaded', loadCertificates);