document.addEventListener('DOMContentLoaded', () => {
    fetchPendingImages();
});
async function updateApprovedCount() {
    const approvedDisplay = document.getElementById('approved-count'); // Make sure this ID exists in HTML
    try {
        const response = await fetch('http://localhost:5000/api/staff/approved-stats');
        const data = await response.json();
        
        if (approvedDisplay) {
            approvedDisplay.innerText = data.count;
        }
    } catch (error) {
        console.error("Error fetching approved count:", error);
    }
}
async function fetchPendingImages() {
    const gridContainer = document.getElementById('student-image-grid');
    const pendingCount = document.getElementById('pending-count');
    
    try {
        const response = await fetch('http://localhost:5000/api/staff/pending-verification');
        const students = await response.json();
        
        pendingCount.innerText = students.length;
        
        if (students.length === 0) {
            gridContainer.innerHTML = '<p style="text-align:center; width:100%; padding:20px;">No images pending verification.</p>';
            return;
        }
        
        gridContainer.innerHTML = '';
        students.forEach(student => {
            const card = createStudentCard(student);
            gridContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching students:", error);
    }
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.style.cssText = "background: var(--bg-body); padding: 15px; border-radius: 12px; border: 1px solid var(--border-soft); text-align: center;";
    
    // Fix: String.fromCharCode (added 'h')
    const base64String = btoa(new Uint8Array(student.image.data.data).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    const imgSrc = `data:${student.image.contentType};base64,${base64String}`;
    
    card.innerHTML = `
        <img src="${imgSrc}" style="width: 100%; border-radius: 8px; margin-bottom: 10px; height: 180px; object-fit: cover; object-position: top;">
        <h4 style="color: #4e4e4e; margin-bottom: 5px;">Roll No: ${student.rollNumber}</h4>
        <p style="font-size: 0.8rem; font-weight: 800; color: var(--primary-blue); margin-bottom: 15px;">
            Quality Score: ${Math.round(student.qualityScore * 100)}%
        </p>
        <div style="display: flex; gap: 10px;">
            <button class="btn-upload" style="flex: 1; background: var(--success-green); padding: 8px;" 
                onclick="processDecision('${student.rollNumber}', 'accept')">Accept</button>
            <button class="btn-upload" style="flex: 1; background: var(--danger-red); padding: 8px;" 
                onclick="processDecision('${student.rollNumber}', 'reject')">Reject</button>
        </div>`;
    return card;
}

// Moved outside so the 'onclick' in the HTML can find it
async function processDecision(rollNumber, action) {
    if (!confirm(`Are you sure you want to ${action} this image?`)) return;
    try {
        const response = await fetch('http://localhost:5000/api/staff/verify-decision', { // Ensure this endpoint matches your backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Fix: headers (plural)
            body: JSON.stringify({ rollNumber, action })
        });
        
        const result = await response.json();
        if (result.success) {
            alert(`Student ${rollNumber} has been ${action}ed.`);
            fetchPendingImages(); 
            updateApprovedCount();// Refresh the grid
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Verification error:", error);
    }
}
