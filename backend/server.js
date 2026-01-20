const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_db'
});

db.connect(function(err) {
    if (err) {
        console.log('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
        createTables();
    }
});

function createTables() {
    const studentsTable = `
        CREATE TABLE IF NOT EXISTS students (
            id VARCHAR(50) PRIMARY KEY,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_active INT DEFAULT 1
        )
    `;
    
    const attendanceTable = `
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(50),
            status VARCHAR(20),
            date DATE
        )
    `;
    
    db.query(studentsTable, function(err) {
        if (err) console.log('Error creating students table:', err);
        else {
            const addColumn = 'ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active INT DEFAULT 1';
            db.query(addColumn, function(err) {
                if (err && err.code !== 'ER_DUP_FIELDNAME') {
                    console.log('Note: is_active column may already exist');
                }
            });
        }
    });
    
    db.query(attendanceTable, function(err) {
        if (err) console.log('Error creating attendance table:', err);
    });
}

app.get('/students', function(req, res) {
    const query = 'SELECT * FROM students WHERE is_active = 1 ORDER BY id';
    
    db.query(query, function(err, results) {
        if (err) {
            res.status(500).json({ error: 'Error fetching students' });
        } else {
            res.json(results);
        }
    });
});

app.post('/students', function(req, res) {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    
    const query = 'SELECT id FROM students ORDER BY id DESC LIMIT 1';
    
    db.query(query, function(err, results) {
        let newId = 1;
        
        if (results && results.length > 0) {
            newId = parseInt(results[0].id) + 1;
        }
        
        const insertQuery = 'INSERT INTO students (id, first_name, last_name, is_active) VALUES (?, ?, ?, 1)';
        
        db.query(insertQuery, [newId, first_name, last_name], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error adding student' });
            } else {
                res.json({ message: 'Student added', id: newId });
            }
        });
    });
});

app.delete('/students/:id', function(req, res) {
    const studentId = req.params.id;
    
    const updateQuery = 'UPDATE students SET is_active = 0 WHERE id = ?';
    
    db.query(updateQuery, [studentId], function(err, result) {
        if (err) {
            console.log('Error updating student:', err);
            res.status(500).json({ error: 'Error removing student' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Student not found' });
        } else {
            res.json({ message: 'Student removed from attendance sheet' });
        }
    });
});

app.post('/attendance', function(req, res) {
    const attendance = req.body.attendance;
    const date = req.body.date;
    
    console.log('Received attendance:', attendance);
    console.log('Date:', date);
    
    if (!attendance || attendance.length === 0) {
        console.log('No attendance data received');
        res.status(400).json({ error: 'No attendance data' });
        return;
    }
    
    const deleteQuery = 'DELETE FROM attendance WHERE date = ?';
    
    db.query(deleteQuery, [date], function(err) {
        if (err) {
            console.log('Error deleting old attendance:', err);
            res.status(500).json({ error: 'Error deleting old attendance' });
            return;
        }
        
        console.log('Old attendance deleted');
        
        const insertQuery = 'INSERT INTO attendance (student_id, status, date) VALUES ?';
        const values = [];
        
        for (let i = 0; i < attendance.length; i++) {
            values.push([attendance[i].studentId, attendance[i].status, attendance[i].date]);
        }
        
        console.log('Values to insert:', values);
        
        db.query(insertQuery, [values], function(err, result) {
            if (err) {
                console.log('Error saving attendance:', err);
                res.status(500).json({ error: 'Error saving attendance: ' + err.message });
            } else {
                console.log('Attendance saved successfully!', result);
                res.json({ message: 'Attendance saved' });
            }
        });
    });
});

app.get('/attendance/:date', function(req, res) {
    const date = req.params.date;
    const query = 'SELECT * FROM attendance WHERE date = ?';
    
    db.query(query, [date], function(err, results) {
        if (err) {
            res.status(500).json({ error: 'Error fetching attendance' });
        } else {
            res.json(results);
        }
    });
});

const PORT = 5000;
app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
});