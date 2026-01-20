const API_URL = 'http://localhost:5000';

let students = [];

function toggleMenu() {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    menu.classList.toggle('show');
    overlay.classList.toggle('show');
}

function closeMenu() {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    menu.classList.remove('show');
    overlay.classList.remove('show');
}

async function loadStudents() {
    try {
        const response = await fetch(API_URL + '/students');
        const data = await response.json();
        students = data;
        displayStudents();
        updateStats();
    } catch (error) {
        alert('Server not connected. Please run the backend');
    }
}

function displayStudents() {
    const table = document.getElementById('studentTable');
    if (!table) return;
    
    if (students.length === 0) {
        table.innerHTML = '<tr><td colspan="4">Koi student nahi hai</td></tr>';
        return;
    }
    
    table.innerHTML = '';
    
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.first_name}</td>
            <td>${student.last_name}</td>
            <td>
                <div class="status-radio">
                    <div class="radio-option">
                        <input type="radio" id="present-${student.id}" name="status-${student.id}" value="present">
                        <label for="present-${student.id}">Present</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="absent-${student.id}" name="status-${student.id}" value="absent">
                        <label for="absent-${student.id}">Absent</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="excused-${student.id}" name="status-${student.id}" value="excused">
                        <label for="excused-${student.id}">Excused</label>
                    </div>
                </div>
            </td>
        `;
        
        table.appendChild(row);
    }
}

function updateStats() {
    const totalEl = document.getElementById('totalStudents');
    const presentEl = document.getElementById('presentCount');
    const absentEl = document.getElementById('absentCount');
    const excusedEl = document.getElementById('excusedCount');
    
    if (totalEl) totalEl.textContent = students.length;
    
    let present = 0;
    let absent = 0;
    let excused = 0;
    
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const radios = document.getElementsByName('status-' + student.id);
        
        for (let j = 0; j < radios.length; j++) {
            if (radios[j].checked) {
                if (radios[j].value === 'present') present++;
                if (radios[j].value === 'absent') absent++;
                if (radios[j].value === 'excused') excused++;
            }
        }
    }
    
    if (presentEl) presentEl.textContent = present;
    if (absentEl) absentEl.textContent = absent;
    if (excusedEl) excusedEl.textContent = excused;
}

async function submitAttendance() {
    const day = document.getElementById('day').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    
    if (!day || !month || !year) {
        alert('Select Date First');
        return;
    }
    
    const date = year + '-' + month + '-' + day;
    const attendance = [];
    
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const radios = document.getElementsByName('status-' + student.id);
        
        for (let j = 0; j < radios.length; j++) {
            if (radios[j].checked) {
                attendance.push({
                    studentId: student.id,
                    status: radios[j].value,
                    date: date
                });
                break;
            }
        }
    }
    
    if (attendance.length === 0) {
        alert('Atleast Mark One Student');
        return;
    }
    
    console.log('Sending attendance:', attendance);
    
    try {
        const response = await fetch(API_URL + '/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendance: attendance, date: date })
        });
        const result = await response.json();
        
        if (response.ok) {
            showMessage('message');
            setTimeout(function() {
                hideMessage('message');
            }, 3000);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Cannot connect to server');
    }
}

function showMessage(id) {
    const msg = document.getElementById(id);
    if (msg) {
        msg.style.display = 'block';
    }
}

function hideMessage(id) {
    const msg = document.getElementById(id);
    if (msg) {
        msg.style.display = 'none';
    }
}

const addForm = document.getElementById('addStudentForm');
if (addForm) {
    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        
        if (!firstName || !lastName) {
            alert('Sab fields bharo');
            return;
        }
        
        const newStudent = {
            first_name: firstName,
            last_name: lastName
        };
        
        try {
            const response = await fetch(API_URL + '/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent)
            });
            const result = await response.json();
            showMessage('message');
            document.getElementById('firstName').value = '';
            document.getElementById('lastName').value = '';
            setTimeout(function() {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            alert('Cannot connect to server');
        }
    });
}

const removeForm = document.getElementById('removeStudentForm');
if (removeForm) {
    removeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('removeStudentId').value;
        
        if (!studentId) {
            alert('Enter Student ID');
            return;
        }
        
        const confirmDelete = confirm('Student ' + studentId + ' ko remove karna hai?');
        if (!confirmDelete) return;
        
        try {
            const response = await fetch(API_URL + '/students/' + studentId, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (response.ok) {
                showMessage('removeMessage');
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                alert(result.error || 'Student nahi mila');
            }
        } catch (error) {
            alert('Cannot connect to server');
        }
    });
}

if (document.getElementById('studentTable')) {
    window.addEventListener('DOMContentLoaded', function() {
        loadStudents();
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.type === 'radio') {
            updateStats();
        }
    });
}