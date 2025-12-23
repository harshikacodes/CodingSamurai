const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://10.108.172.217:3000',
        'http://10.108.172.217:3001',
        'http://yourproductiondomain.com'
    ],
    credentials: true
}));
app.use(express.json());

// Rate limiting middleware - Relaxed for development
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Much higher limit for development
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for development if NODE_ENV is not production
        return process.env.NODE_ENV !== 'production';
    }
});
app.use(limiter);

// Stricter rate limiting for auth endpoints - Also relaxed for development
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Higher limit for development
    message: 'Too many login attempts, please try again later.',
    skip: (req) => {
        // Skip rate limiting for development if NODE_ENV is not production
        return process.env.NODE_ENV !== 'production';
    }
});
app.use('/api/auth', authLimiter);

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test Supabase connection
async function initializeDatabase() {
    try {
        // Test connection by querying the questions table
        const { data, error } = await supabase
            .from('questions')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.log('Note: Tables may not exist yet, that\'s okay');
        }
        
        console.log(' Connected to Supabase successfully!');
        console.log(' You can now create tables in your Supabase dashboard.');
    } catch (err) {
        console.error(' Supabase connection error:', err.message);
        console.log('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
        process.exit(1);
    }
}

// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable is required!');
    console.error('Please add JWT_SECRET to your .env file');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required!');
    console.error('Please check your .env file');
    process.exit(1);
}

// Initialize database on startup
initializeDatabase();

// API Routes

// Submit question endpoint
app.post('/submit-question', async (req, res) => {
    const { questionName, questionLink, type, difficulty } = req.body;
    
    // Validate required fields
    if (!questionName || !questionLink || !type || !difficulty) {
        return res.status(400).json({ 
            error: 'All fields are required' 
        });
    }
    
    // Validate type and difficulty values
    const validTypes = ['homework', 'classwork'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    if (!validTypes.includes(type)) {
        return res.status(400).json({ 
            error: 'Invalid type. Must be either homework or classwork' 
        });
    }
    
    if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ 
            error: 'Invalid difficulty. Must be easy, medium, or hard' 
        });
    }
    
    try {
        // Insert into database using Supabase
        const { data, error } = await supabase
            .from('questions')
            .insert([
                {
                    question_name: questionName,
                    question_link: questionLink,
                    type: type,
                    difficulty: difficulty
                }
            ])
            .select();
        
        if (error) {
            console.error('Database error:', error.message);
            return res.status(500).json({ 
                error: 'Failed to save question to database' 
            });
        }
        
        const newId = data[0].id;
        console.log(`New question added with ID: ${newId}`);
        res.json({ 
            success: true, 
            id: newId,
            message: 'Question submitted successfully!' 
        });
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ 
            error: 'Failed to save question to database' 
        });
    }
});

// Get all questions endpoint (for viewing stored data)
app.get('/questions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Database error:', error.message);
            return res.status(500).json({ 
                error: 'Failed to retrieve questions' 
            });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ 
            error: 'Failed to retrieve questions' 
        });
    }
});

// Get questions by filter
app.get('/questions/filter', async (req, res) => {
    const { type, difficulty } = req.query;
    
    try {
        let query = supabase
            .from('questions')
            .select('*');
        
        // Apply filters if provided
        if (type) {
            query = query.eq('type', type);
        }
        
        if (difficulty) {
            query = query.eq('difficulty', difficulty);
        }
        
        // Order by created_at descending
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Database error:', error.message);
            return res.status(500).json({ 
                error: 'Failed to retrieve questions' 
            });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ 
            error: 'Failed to retrieve questions' 
        });
    }
});

// Update a question endpoint
app.put('/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { questionName, questionLink, type, difficulty } = req.body;
    
    // Validate required fields
    if (!questionName || !questionLink || !type || !difficulty) {
        return res.status(400).json({ 
            error: 'All fields are required' 
        });
    }
    
    // Validate type and difficulty values
    const validTypes = ['homework', 'classwork'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    if (!validTypes.includes(type)) {
        return res.status(400).json({ 
            error: 'Invalid type. Must be either homework or classwork' 
        });
    }
    
    if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ 
            error: 'Invalid difficulty. Must be easy, medium, or hard' 
        });
    }
    
    try {
        const { data, error } = await supabase
            .from('questions')
            .update({
                question_name: questionName,
                question_link: questionLink,
                type: type,
                difficulty: difficulty
            })
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('Database error:', error.message);
            return res.status(500).json({ 
                error: 'Failed to update question' 
            });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found' 
            });
        }
        
        console.log(`Question with ID ${id} updated`);
        res.json({ 
            success: true, 
            message: 'Question updated successfully!' 
        });
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ 
            error: 'Failed to update question' 
        });
    }
});

// Delete a question endpoint
app.delete('/questions/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('Database error:', error.message);
            return res.status(500).json({ 
                error: 'Failed to delete question' 
            });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Question deleted successfully!' 
        });
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ 
            error: 'Failed to delete question' 
        });
    }
});

// Server startup moved to the end of the file for proper initialization

// *******************************************************************
//                        AUTHENTICATION ROUTES                       
// *******************************************************************

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !data) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = data;
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Generate refresh token (long-lived)
        const refreshToken = jwt.sign(
            { userId: user.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '30d' : '7d' }  // 30 days if remember me, 7 days otherwise
        );

        // Store refresh token in database for security
        try {
            await supabase
                .from('user_tokens')
                .upsert({
                    user_id: user.id,
                    refresh_token: refreshToken,
                    expires_at: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString()
                });
        } catch (dbError) {
            console.error('Error storing refresh token:', dbError.message);
            // Continue with login even if token storage fails
        }

        res.json({ 
            accessToken, 
            refreshToken,
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                fullName: user.full_name 
            },
            expiresIn: rememberMe ? '30d' : '7d'
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // Check if token exists in database and is not expired
        const { data: tokenData, error: tokenError } = await supabase
            .from('user_tokens')
            .select('*')
            .eq('user_id', decoded.userId)
            .eq('refresh_token', refreshToken)
            .single();

        if (tokenError || !tokenData) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        if (new Date(tokenData.expires_at) < new Date()) {
            // Remove expired token from database
            await supabase
                .from('user_tokens')
                .delete()
                .eq('refresh_token', refreshToken);
            return res.status(401).json({ error: 'Refresh token has expired' });
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, role, full_name')
            .eq('id', decoded.userId)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            accessToken: newAccessToken,
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                fullName: user.full_name 
            }
        });

    } catch (err) {
        console.error('Token refresh error:', err.message);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        try {
            // Remove refresh token from database
            await supabase
                .from('user_tokens')
                .delete()
                .eq('refresh_token', refreshToken);
        } catch (err) {
            console.error('Error removing refresh token:', err.message);
        }
    }

    res.json({ success: true, message: 'Logged out successfully' });
});


// *******************************************************************
//                        USER PROGRESS ROUTES                        
// *******************************************************************

// Get user progress for a specific user

app.get('/api/progress/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('question_id, is_solved')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error fetching user progress:', error.message);
            return res.status(500).json({ error: 'Failed to fetch progress' });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Error fetching user progress:', err.message);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Get user progress for a specific user (alternative endpoint format)
app.get('/api/users/:userId/progress', verifyToken, async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('question_id, is_solved, solved_at')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error fetching user progress:', error.message);
            return res.status(500).json({ error: 'Failed to fetch progress' });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Error fetching user progress:', err.message);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Alternative route for backward compatibility
app.get('/user-progress', async (req, res) => {
    // This route requires authentication - extract userId from token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { data, error } = await supabase
            .from('user_progress')
            .select('question_id, is_solved')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error fetching user progress:', error.message);
            return res.status(500).json({ error: 'Failed to fetch progress' });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Error fetching user progress:', err.message);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Helper function to identify platform based on URL
function identifyPlatform(url) {
    if (url.includes('geeksforgeeks.org') || url.includes('practice.geeksforgeeks.org')) {
        return 'gfg';
    } else if (url.includes('leetcode.com')) {
        return 'leetcode';
    } else if (url.includes('interviewbit.com')) {
        return 'interviewbit';
    }
    return 'unknown';
}

// Debug endpoint to check questions by platform
app.get('/api/debug/questions', async (req, res) => {
    try {
        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, question_name, question_link');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const platformStats = {
            total: questions.length,
            gfg: questions.filter(q => identifyPlatform(q.question_link) === 'gfg').length,
            leetcode: questions.filter(q => identifyPlatform(q.question_link) === 'leetcode').length,
            interviewbit: questions.filter(q => identifyPlatform(q.question_link) === 'interviewbit').length,
            unknown: questions.filter(q => identifyPlatform(q.question_link) === 'unknown').length
        };

        const sampleQuestions = {
            gfg: questions.filter(q => identifyPlatform(q.question_link) === 'gfg').slice(0, 3),
            leetcode: questions.filter(q => identifyPlatform(q.question_link) === 'leetcode').slice(0, 3),
            interviewbit: questions.filter(q => identifyPlatform(q.question_link) === 'interviewbit').slice(0, 3)
        };

        res.json({
            stats: platformStats,
            samples: sampleQuestions,
            allQuestions: questions.slice(0, 10) // First 10 questions for debugging
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Debug endpoint to check bookmark table
app.get('/api/debug/bookmarks/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Check if bookmarks table exists and get sample data
        const { data: bookmarks, error: bookmarksError } = await supabase
            .from('user_bookmarks')
            .select('*')
            .eq('user_id', userId)
            .limit(10);

        const { data: allBookmarks, error: allError } = await supabase
            .from('user_bookmarks')
            .select('*')
            .limit(5);

        res.json({
            table_exists: !bookmarksError,
            user_bookmarks: bookmarks || [],
            user_bookmark_count: bookmarks ? bookmarks.length : 0,
            sample_bookmarks: allBookmarks || [],
            errors: {
                bookmarks_error: bookmarksError?.message,
                all_error: allError?.message
            }
        });
    } catch (err) {
        res.status(500).json({ 
            error: err.message,
            table_exists: false,
            message: 'user_bookmarks table might not exist'
        });
    }
});

// Debug endpoint to check users and their platform usernames
app.get('/api/debug/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, full_name, leetcode_username, geeksforgeeks_username, role');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            total_users: users.length,
            users: users,
            users_with_leetcode: users.filter(u => u.leetcode_username).length,
            users_with_gfg: users.filter(u => u.geeksforgeeks_username).length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Debug endpoint to test LeetCode API directly
app.get('/api/debug/leetcode-api/:username', async (req, res) => {
    const { username } = req.params;
    
    const apiEndpoints = [
        `https://leetcodestats.cyclic.app/${username}`,
        `https://leetcode-stats-api.herokuapp.com/${username}`,
        `https://alfa-leetcode-api.onrender.com/${username}/solved`,
        `https://leetcode-api-faisalshohag.vercel.app/${username}`
    ];

    const results = [];
    
    for (let i = 0; i < apiEndpoints.length; i++) {
        const apiUrl = apiEndpoints[i];
        try {
            console.log(`Testing API ${i + 1}: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const data = await response.json();
                results.push({
                    api_index: i + 1,
                    api_url: apiUrl,
                    status: 'success',
                    data: data,
                    keys: Object.keys(data)
                });
            } else {
                results.push({
                    api_index: i + 1,
                    api_url: apiUrl,
                    status: 'http_error',
                    error: `HTTP ${response.status}: ${response.statusText}`
                });
            }
        } catch (error) {
            results.push({
                api_index: i + 1,
                api_url: apiUrl,
                status: 'fetch_error',
                error: error.message
            });
        }
    }
    
    res.json({
        username: username,
        tested_apis: results.length,
        results: results
    });
});

// Fetch and update GFG user progress
app.get('/api/sync-gfg-progress/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;

    try {
        // Get user profile to fetch GFG username
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('geeksforgeeks_username')
            .eq('id', userId)
            .single();

        if (userError || !user?.geeksforgeeks_username) {
            return res.status(400).json({ error: 'GeeksforGeeks username not found for this user' });
        }

        const gfgUsername = user.geeksforgeeks_username;

        // Fetch data from GFG API
        const response = await fetch(`https://geeks-for-geeks-api.vercel.app/${gfgUsername}`);
        const apiData = await response.json();

        // Extract solved question URLs from all difficulty levels
        let solvedQuestionUrls = [];
        let apiStats = {
            basic: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0
        };
        
        // Handle different difficulty levels
        if (apiData.solvedStats) {
            // Basic level
            if (apiData.solvedStats.basic && apiData.solvedStats.basic.questions) {
                apiStats.basic = apiData.solvedStats.basic.count || apiData.solvedStats.basic.questions.length;
                solvedQuestionUrls = solvedQuestionUrls.concat(
                    apiData.solvedStats.basic.questions.map(q => q.questionUrl)
                );
            }
            // Easy level
            if (apiData.solvedStats.easy && apiData.solvedStats.easy.questions) {
                apiStats.easy = apiData.solvedStats.easy.count || apiData.solvedStats.easy.questions.length;
                solvedQuestionUrls = solvedQuestionUrls.concat(
                    apiData.solvedStats.easy.questions.map(q => q.questionUrl)
                );
            }
            // Medium level
            if (apiData.solvedStats.medium && apiData.solvedStats.medium.questions) {
                apiStats.medium = apiData.solvedStats.medium.count || apiData.solvedStats.medium.questions.length;
                solvedQuestionUrls = solvedQuestionUrls.concat(
                    apiData.solvedStats.medium.questions.map(q => q.questionUrl)
                );
            }
            // Hard level
            if (apiData.solvedStats.hard && apiData.solvedStats.hard.questions) {
                apiStats.hard = apiData.solvedStats.hard.count || apiData.solvedStats.hard.questions.length;
                solvedQuestionUrls = solvedQuestionUrls.concat(
                    apiData.solvedStats.hard.questions.map(q => q.questionUrl)
                );
            }
        }
        
        // Calculate total from API
        apiStats.total = apiStats.basic + apiStats.easy + apiStats.medium + apiStats.hard;
        
        console.log('GFG API Stats:', apiStats);
        console.log('Total solved URLs from API:', solvedQuestionUrls.length);

        // Fetch only GFG questions from database
        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, question_link');

        if (error) {
            console.error('Error fetching questions:', error.message);
            return res.status(500).json({ error: 'Failed to fetch questions' });
        }

        // Helper function to extract base problem name from GFG URL
        const extractProblemName = (url) => {
            try {
                // Extract the part after /problems/
                const problemsPart = url.split('/problems/')[1];
                if (!problemsPart) return url;
                
                // Remove trailing slashes and numbers/categories
                let baseName = problemsPart.split('/')[0];
                
                // Remove trailing numbers and hyphens (like -1587115620)
                baseName = baseName.replace(/-\d+$/, '');
                
                return baseName;
            } catch (e) {
                return url;
            }
        };

        // Extract base problem names from API URLs
        const solvedProblemNames = solvedQuestionUrls.map(url => extractProblemName(url));
        
        console.log('Sample API URLs:', solvedQuestionUrls.slice(0, 3));
        console.log('Sample extracted names:', solvedProblemNames.slice(0, 3));

        // Filter only GeeksforGeeks questions and match with solved URLs
        const gfgQuestions = questions.filter(q => identifyPlatform(q.question_link) === 'gfg');
        
        console.log('Sample DB URLs:', gfgQuestions.slice(0, 3).map(q => q.question_link));
        console.log('Sample DB extracted names:', gfgQuestions.slice(0, 3).map(q => extractProblemName(q.question_link)));
        
        const solvedQuestions = gfgQuestions.filter(q => {
            const dbProblemName = extractProblemName(q.question_link);
            return solvedProblemNames.includes(dbProblemName);
        });

        console.log(`Found ${gfgQuestions.length} GFG questions in database`);
        console.log(`Found ${solvedQuestions.length} solved GFG questions for user`);

        // Update user progress for solved questions
        let updatedCount = 0;
        for (const question of solvedQuestions) {
            const { error: updateError } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    question_id: question.id,
                    is_solved: true,
                    solved_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,question_id'
                });

            if (updateError) {
                console.error('Error updating user progress:', updateError.message);
            } else {
                updatedCount++;
            }
        }

        res.json({ 
            success: true, 
            message: `GFG progress synchronized. Updated ${updatedCount} questions.`,
            stats: {
                totalGFGQuestions: gfgQuestions.length,
                solvedQuestions: solvedQuestions.length,
                updatedQuestions: updatedCount
            }
        });
    } catch (err) {
        console.error('Error synchronizing GFG progress:', err.message);
        res.status(500).json({ error: 'Failed to synchronize progress' });
    }
});

// Fetch and update LeetCode user progress
app.get('/api/sync-leetcode-progress/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    try {
        // Get user profile to fetch LeetCode username
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('leetcode_username')
            .eq('id', userId)
            .single();

        if (userError || !user?.leetcode_username) {
            return res.status(400).json({ error: 'LeetCode username not found for this user' });
        }

        const leetcodeUsername = user.leetcode_username;
        let apiData = null;
        let lastError = null;

        // Use multiple APIs with fallback: comprehensive API first, then reliable recent submissions API
        const apiEndpoints = [
            `https://alfa-leetcode-api.onrender.com/${leetcodeUsername}/userProfileUserQuestionProgressV2/${leetcodeUsername}`,
            `https://leetcode-api-faisalshohag.vercel.app/${leetcodeUsername}`
        ];

        for (let apiIndex = 0; apiIndex < apiEndpoints.length; apiIndex++) {
            const apiUrl = apiEndpoints[apiIndex];
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    console.log(`Trying API ${apiIndex + 1}, attempt ${attempt + 1}: ${apiUrl}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                    
                    const response = await fetch(apiUrl, {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    
        // Basic API response logging
        console.log(`✅ API Response received from: ${apiUrl}`);
        console.log(`📊 Keys available: ${Object.keys(data).slice(0, 5).join(', ')}...`);
                    
                    // Check if data is valid
                    if (data && !data.errors && !data.error) {
                        apiData = data;
                        console.log(`✅ Successfully fetched data from API ${apiIndex + 1}`);
                        break;
                    } else {
                        throw new Error(data.error || data.errors || 'Invalid response format');
                    }
                    
                } catch (fetchError) {
                    lastError = fetchError;
                    console.log(`❌ API ${apiIndex + 1}, attempt ${attempt + 1} failed: ${fetchError.message}`);
                    
                    if (attempt < maxRetries - 1) {
                        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    }
                }
            }
            
            if (apiData) break; // Successfully got data, exit outer loop
        }

        // If all APIs failed
        if (!apiData) {
            return res.status(503).json({ 
                error: 'All LeetCode APIs are currently unavailable. Please try again later.',
                details: lastError?.message || 'Unknown error',
                suggestion: 'LeetCode APIs have rate limits. Try again in a few minutes.'
            });
        }

        // Extract solved question data with multiple format support
        let solvedQuestions = [];
        let apiStats = {
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0
        };

        // Handle different API response formats
        if (apiData.solvedProblem || apiData.solved) {
            solvedQuestions = apiData.solvedProblem || apiData.solved || [];
            apiStats.easy = apiData.easySolved || apiData.easy || 0;
            apiStats.medium = apiData.mediumSolved || apiData.medium || 0;
            apiStats.hard = apiData.hardSolved || apiData.hard || 0;
            apiStats.total = apiData.totalSolved || apiData.total || solvedQuestions.length;
        } else if (apiData.data) {
            // Handle nested data structure
            const data = apiData.data;
            if (data.recentSubmissionList) {
                const acceptedSubs = data.recentSubmissionList.filter(sub => 
                    sub.statusDisplay === 'Accepted' || sub.status === 'Accepted'
                );
                solvedQuestions = [...new Set(acceptedSubs.map(sub => sub.title || sub.titleSlug))];
            }
            if (data.submitStats) {
                const stats = data.submitStats.acSubmissionNum;
                apiStats.easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
                apiStats.medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
                apiStats.hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
                apiStats.total = stats.reduce((sum, s) => sum + s.count, 0);
            }
        } else if (apiData.recentSubmissions) {
            // Handle recentSubmissions from leetcode-api-faisalshohag.vercel.app
            const acceptedSubs = apiData.recentSubmissions.filter(sub => 
                sub.statusDisplay === 'Accepted'
            );
            
            // Remove duplicates by titleSlug and keep the most recent submission for each problem
            const uniqueProblems = new Map();
            acceptedSubs.forEach(sub => {
                const key = sub.titleSlug || sub.title;
                if (!uniqueProblems.has(key)) {
                    uniqueProblems.set(key, {
                        title: sub.title,
                        titleSlug: sub.titleSlug
                    });
                }
            });
            
            solvedQuestions = Array.from(uniqueProblems.values());
            
            // Get stats from the API data
            apiStats.easy = apiData.easySolved || 0;
            apiStats.medium = apiData.mediumSolved || 0;
            apiStats.hard = apiData.hardSolved || 0;
            apiStats.total = apiData.totalSolved || solvedQuestions.length;
        } else if (apiData.problemsSolved) {
            // Another possible format
            solvedQuestions = apiData.problemsSolved;
            apiStats.total = solvedQuestions.length;
        } else {
            // Try to extract from various other possible fields
            // Look for stats first
            apiStats.easy = apiData.easySolved || 0;
            apiStats.medium = apiData.mediumSolved || 0;
            apiStats.hard = apiData.hardSolved || 0;
            apiStats.total = apiData.totalSolved || 0;
            
            // Since we don't have actual problem list, we'll work with empty array
            // but show the stats from API
            solvedQuestions = [];
        }

        console.log('LeetCode API Stats:', apiStats);
        console.log('Total solved problems from API:', solvedQuestions.length);
        console.log('\n🔍 DETAILED API EXTRACTION DEBUG:');
        console.log('solvedQuestions array:', JSON.stringify(solvedQuestions, null, 2));
        console.log('First few solved questions:', solvedQuestions.slice(0, 5));
        console.log('Types of solvedQuestions items:', solvedQuestions.map(item => typeof item));

        // Fetch only LeetCode questions from database FIRST
        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, question_name, question_link');

        if (error) {
            console.error('Error fetching questions:', error.message);
            return res.status(500).json({ error: 'Failed to fetch questions' });
        }

        // Filter only LeetCode questions
        const leetcodeQuestions = questions.filter(q => identifyPlatform(q.question_link) === 'leetcode');

        console.log(`\n🔍 Debug Info:`);
        console.log(`Total questions in DB: ${questions.length}`);
        console.log(`LeetCode questions in DB: ${leetcodeQuestions.length}`);
        console.log(`Solved questions from API: ${solvedQuestions.length}`);
        console.log('Sample DB URLs:', leetcodeQuestions.slice(0, 3).map(q => q.question_link));
        console.log('Sample API solved questions:', solvedQuestions.slice(0, 3));

        // If no solved questions found, return early BUT show DB stats
        if (solvedQuestions.length === 0) {
            return res.json({
                success: true,
                message: `LeetCode sync completed with limitations. The API shows you have solved ${apiStats.total} problems (${apiStats.easy} easy, ${apiStats.medium} medium, ${apiStats.hard} hard), but the available APIs only provide recent submissions (~20 problems), not your complete solved problems list. To sync all your solved problems, you would need to manually mark them as solved in the application.`,
                stats: {
                    totalLeetCodeQuestions: leetcodeQuestions.length,
                    solvedQuestions: 0,
                    updatedQuestions: 0,
                    apiStats: apiStats,
                    limitation: "APIs only provide recent submissions, not complete solved problems list"
                },
                recommendation: "Consider manually marking solved questions in the app, or try the sync again periodically to catch recent submissions."
            });
        }

        // Helper function to extract problem slug from LeetCode URL
        const extractLeetCodeSlug = (url) => {
            try {
                const match = url.match(/\/problems\/([^/]+)\/?/);
                return match ? match[1] : null;
            } catch (e) {
                return null;
            }
        };

        // Helper function to normalize problem titles for matching
        const normalizeTitle = (title) => {
            return title.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };
        
        const matchedSolvedQuestions = leetcodeQuestions.filter(q => {
            const dbSlug = extractLeetCodeSlug(q.question_link);
            const dbTitleNormalized = normalizeTitle(q.question_name);
            
            // Try to match by slug or normalized title (reduced logging)
            const isMatched = solvedQuestions.some(solvedItem => {
                const solvedTitle = typeof solvedItem === 'string' ? solvedItem : 
                                  (solvedItem.title || solvedItem.titleSlug || solvedItem.name || '');
                const solvedTitleNormalized = normalizeTitle(solvedTitle);
                const solvedSlug = typeof solvedItem === 'object' ? solvedItem.titleSlug : null;
                
                const slugMatch = dbSlug && solvedSlug && dbSlug === solvedSlug;
                const slugInTitle = dbSlug && solvedTitleNormalized.includes(dbSlug);
                const exactTitleMatch = dbTitleNormalized === solvedTitleNormalized;
                const partialMatch1 = solvedTitleNormalized.includes(dbTitleNormalized);
                const partialMatch2 = dbTitleNormalized.includes(solvedTitleNormalized);
                
                if (slugMatch || slugInTitle || exactTitleMatch || partialMatch1 || partialMatch2) {
                    console.log(`  ✅ MATCHED: ${q.question_name} <-> ${solvedTitle}`);
                    return true;
                }
                return false;
            });
            
            return isMatched;
        });

        console.log(`Found ${leetcodeQuestions.length} LeetCode questions in database`);
        console.log(`Found ${matchedSolvedQuestions.length} solved LeetCode questions for user`);

        // Update user progress for solved questions
        let updatedCount = 0;
        for (const question of matchedSolvedQuestions) {
            const { error: updateError } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    question_id: question.id,
                    is_solved: true,
                    solved_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,question_id'
                });

            if (updateError) {
                console.error('Error updating user progress:', updateError.message);
            } else {
                updatedCount++;
            }
        }

        res.json({ 
            success: true, 
            message: `LeetCode progress synchronized. Updated ${updatedCount} questions.`,
            stats: {
                totalLeetCodeQuestions: leetcodeQuestions.length,
                solvedQuestions: matchedSolvedQuestions.length,
                updatedQuestions: updatedCount,
                apiStats: apiStats
            }
        });
    } catch (err) {
        console.error('Error synchronizing LeetCode progress:', err.message);
        res.status(500).json({ 
            error: 'Failed to synchronize LeetCode progress',
            details: err.message,
            suggestion: 'Please try again later or contact support if the issue persists.'
        });
    }
});

// Sync both GFG and LeetCode progress
app.get('/api/sync-all-progress/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const results = { gfg: null, leetcode: null };

    try {
        // Get authorization header from the request
        const authHeader = req.headers.authorization;
        
        // Sync GFG progress
        try {
            const gfgResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/sync-gfg-progress/${userId}`, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            });
            results.gfg = await gfgResponse.json();
        } catch (gfgError) {
            console.error('GFG sync error:', gfgError.message);
            results.gfg = { error: 'Failed to sync GFG progress', details: gfgError.message };
        }

        // Sync LeetCode progress
        try {
            const leetcodeResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/sync-leetcode-progress/${userId}`, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            });
            results.leetcode = await leetcodeResponse.json();
        } catch (leetcodeError) {
            console.error('LeetCode sync error:', leetcodeError.message);
            results.leetcode = { error: 'Failed to sync LeetCode progress', details: leetcodeError.message };
        }

        res.json({
            success: true,
            message: 'Progress synchronization completed for all platforms',
            results: results
        });
    } catch (err) {
        console.error('Error synchronizing all progress:', err.message);
        res.status(500).json({ error: 'Failed to synchronize progress' });
    }
});

// Update user progress (mark as solved/unsolved)
app.post('/api/progress', async (req, res) => {
    const { userId, questionId, isSolved } = req.body;

    try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: userId,
                question_id: questionId,
                is_solved: isSolved,
                solved_at: now
            }, {
                onConflict: 'user_id,question_id'
            })
            .select();
        
        if (error) {
            console.error('Error updating user progress:', error.message);
            return res.status(500).json({ error: 'Failed to update progress' });
        }
        
        res.json({ success: true, message: 'Progress updated' });

    } catch (err) {
        console.error('Error updating user progress:', err.message);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Update user progress for specific user (alternative endpoint)
app.post('/api/users/:userId/progress', verifyToken, async (req, res) => {
    const { userId } = req.params;
    const { questionId, isSolved } = req.body;

    try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: userId,
                question_id: questionId,
                is_solved: isSolved,
                solved_at: isSolved ? now : null
            }, {
                onConflict: 'user_id,question_id'
            })
            .select();
        
        if (error) {
            console.error('Error updating user progress:', error.message);
            return res.status(500).json({ error: 'Failed to update progress' });
        }
        
        res.json({ success: true, message: 'Progress updated', data });

    } catch (err) {
        console.error('Error updating user progress:', err.message);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// *******************************************************************
//                        USER MANAGEMENT ROUTES                     
// *******************************************************************

// Add new user endpoint
app.post('/api/users', async (req, res) => {
    const { username, password, fullName, role, leetcodeUsername, geeksforgeeksUsername } = req.body;

    try {
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'User with this username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Add the user to database
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username: username,
                    password: hashedPassword,
                    role: role || 'user',
                    full_name: fullName,
                    leetcode_username: leetcodeUsername || null,
                    geeksforgeeks_username: geeksforgeeksUsername || null,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Error adding user:', error.message);
            return res.status(500).json({ error: 'Failed to add user' });
        }

        res.json({ 
            success: true, 
            message: 'User added successfully!',
            user: {
                id: data[0].id,
                username: data[0].username,
                full_name: data[0].full_name,
                role: data[0].role
            }
        });
    } catch (err) {
        console.error('Error adding user:', err.message);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// *******************************************************************
//                        BOOKMARK ROUTES                           
// *******************************************************************

// Get user bookmarks
app.get('/api/users/:userId/bookmarks', verifyToken, async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('user_bookmarks')
            .select('question_id')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error fetching bookmarks:', error.message);
            
            // If table doesn't exist, return empty bookmarks (frontend uses localStorage)
            if (error.message.includes('relation "user_bookmarks" does not exist') || 
                error.message.includes('relation "public.user_bookmarks" does not exist')) {
                console.log('⚠️ user_bookmarks table does not exist, returning empty bookmarks (frontend will use localStorage)');
                return res.json({});
            }
            
            return res.status(500).json({ error: 'Failed to fetch bookmarks', details: error.message });
        }
        
        // Convert array to object for easier lookup
        const bookmarkMap = {};
        if (data) {
            data.forEach(bookmark => {
                bookmarkMap[bookmark.question_id] = true;
            });
        }
        
        res.json(bookmarkMap);
    } catch (err) {
        console.error('Error fetching bookmarks:', err.message);
        // Return empty bookmarks instead of error to allow frontend localStorage to work
        console.log('📱 Returning empty bookmarks - frontend will use localStorage');
        res.json({});
    }
});

// Toggle bookmark (add/remove)
app.post('/api/users/:userId/bookmarks/:questionId', verifyToken, async (req, res) => {
    const { userId, questionId } = req.params;

    try {
        // Check if bookmark already exists
        const { data: existingBookmark, error: checkError } = await supabase
            .from('user_bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('question_id', questionId)
            .single();

        if (existingBookmark) {
            // Remove bookmark
            const { error: deleteError } = await supabase
                .from('user_bookmarks')
                .delete()
                .eq('user_id', userId)
                .eq('question_id', questionId);

            if (deleteError) {
                console.error('Error removing bookmark:', deleteError.message);
                return res.status(500).json({ error: 'Failed to remove bookmark' });
            }

            res.json({ success: true, action: 'removed', message: 'Bookmark removed' });
        } else {
            // Add bookmark
            const { error: insertError } = await supabase
                .from('user_bookmarks')
                .insert({
                    user_id: userId,
                    question_id: questionId,
                    bookmarked_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error adding bookmark:', insertError.message);
                
                // If table doesn't exist, provide helpful message
                if (insertError.message.includes('relation "user_bookmarks" does not exist')) {
                    return res.status(500).json({ 
                        error: 'Bookmarks table not found', 
                        message: 'Please create the user_bookmarks table in Supabase first',
                        sql_needed: true
                    });
                }
                
                return res.status(500).json({ error: 'Failed to add bookmark', details: insertError.message });
            }

            res.json({ success: true, action: 'added', message: 'Bookmark added' });
        }
    } catch (err) {
        console.error('Error toggling bookmark:', err.message);
        res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
});

// *******************************************************************
//                        USER PROFILE ROUTES                        
// *******************************************************************

// Get user profile
app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, full_name, leetcode_username, geeksforgeeks_username, created_at')
            .eq('id', id)
            .single();
        
        if (error || !data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(data);
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Update user profile
app.put('/api/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { fullName, leetcodeUsername, geeksforgeeksUsername } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                full_name: fullName,
                leetcode_username: leetcodeUsername,
                geeksforgeeks_username: geeksforgeeksUsername
            })
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('Error updating user profile:', error.message);
            return res.status(500).json({ error: 'Failed to update user profile' });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating user profile:', err.message);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

// Delete user endpoint
app.delete('/api/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        // First, delete related data to avoid foreign key constraints
        // Delete user progress
        await supabase
            .from('user_progress')
            .delete()
            .eq('user_id', id);
        
        // Delete user tokens
        await supabase
            .from('user_tokens')
            .delete()
            .eq('user_id', id);
        
        // Delete user bookmarks (if table exists)
        try {
            await supabase
                .from('user_bookmarks')
                .delete()
                .eq('user_id', id);
        } catch (bookmarkError) {
            // Ignore if user_bookmarks table doesn't exist
            console.log('User bookmarks cleanup skipped (table may not exist)');
        }
        
        // Finally, delete the user
        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('Error deleting user:', error.message);
            return res.status(500).json({ error: 'Failed to delete user' });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            success: true, 
            message: 'User deleted successfully',
            deleted_user: {
                id: data[0].id,
                username: data[0].username
            }
        });
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// *******************************************************************
//                        LEADERBOARD ROUTES                        
// *******************************************************************

// Simple sync endpoint for testing (original kept below)
app.post('/api/sync-test', async (req, res) => {
    try {
        // Get count of users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, leetcode_username, geeksforgeeks_username')
            .eq('role', 'user');

        if (usersError) {
            return res.status(500).json({ error: 'Failed to fetch users', details: usersError.message });
        }

        const usersWithUsernames = users.filter(u => u.leetcode_username || u.geeksforgeeks_username);
        
        res.json({
            success: true,
            message: 'Sync test completed successfully',
            stats: {
                total_users: users.length,
                users_with_platforms: usersWithUsernames.length,
                platform_breakdown: {
                    leetcode: users.filter(u => u.leetcode_username).length,
                    geeksforgeeks: users.filter(u => u.geeksforgeeks_username).length
                }
            }
        });
    } catch (err) {
        console.error('Error in sync test:', err.message);
        res.status(500).json({ error: 'Sync test failed', details: err.message });
    }
});

// Sync all users progress automatically
app.post('/api/sync-all-users-progress', async (req, res) => {
    try {
        // Get all users with role 'user'
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, full_name, leetcode_username, geeksforgeeks_username')
            .eq('role', 'user');

        if (usersError) {
            console.error('Error fetching users:', usersError.message);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        const results = {
            success: [],
            failed: [],
            total: users.length,
            profiles_updated: 0
        };

        // Process users in batches to avoid overwhelming APIs
        const batchSize = 5;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (user) => {
                const userResult = {
                    id: user.id,
                    username: user.username,
                    gfg: null,
                    leetcode: null,
                    profile_photo: null
                };

                // Sync GFG progress and get profile photo
                if (user.geeksforgeeks_username) {
                    try {
                        const gfgResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/sync-gfg-progress/${user.id}`);
                        userResult.gfg = await gfgResponse.json();
                        
                        // Try to get profile photo from GFG API
                        try {
                            const gfgProfileResponse = await fetch(`https://geeks-for-geeks-api.vercel.app/${user.geeksforgeeks_username}`);
                            const gfgProfileData = await gfgProfileResponse.json();
                            
                            if (gfgProfileData.info && gfgProfileData.info.profilePicture) {
                                userResult.profile_photo = gfgProfileData.info.profilePicture;
                                
                                // Update user profile with photo
                                await supabase
                                    .from('users')
                                    .update({ profile_photo: gfgProfileData.info.profilePicture })
                                    .eq('id', user.id);
                                    
                                results.profiles_updated++;
                            }
                        } catch (photoError) {
                            console.log(`Failed to get profile photo for ${user.username}:`, photoError.message);
                        }
                    } catch (gfgError) {
                        userResult.gfg = { error: gfgError.message };
                    }
                }

                // Sync LeetCode progress
                if (user.leetcode_username) {
                    try {
                        const leetcodeResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/sync-leetcode-progress/${user.id}`);
                        userResult.leetcode = await leetcodeResponse.json();
                    } catch (leetcodeError) {
                        userResult.leetcode = { error: leetcodeError.message };
                    }
                }

                return userResult;
            });

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if ((result.gfg && result.gfg.success) || (result.leetcode && result.leetcode.success)) {
                    results.success.push(result);
                } else {
                    results.failed.push(result);
                }
            });

            // Wait between batches to avoid rate limiting
            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            }
        }

        res.json({
            success: true,
            message: 'Bulk sync completed for all users',
            results: results
        });
    } catch (err) {
        console.error('Error syncing all users:', err.message);
        res.status(500).json({ error: 'Failed to sync all users progress' });
    }
});

// Get leaderboard data using Supabase - OPTIMIZED with single query
app.get('/api/leaderboard', async (req, res) => {
    const { period } = req.query; // daily, weekly, all-time

    try {
        console.log(`🏆 Fetching leaderboard for period: ${period}`);
        const startTime = Date.now();

        // Get total questions count (still need this for success rate)
        const { count: totalQuestions, error: questionsError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });

        if (questionsError) {
            console.error('Error fetching questions count:', questionsError.message);
            return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }

        // Build the optimized query with proper time filtering
        let query = `
            SELECT 
                u.id,
                u.username,
                u.full_name,
                COUNT(up.id) as solved_count
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id AND up.is_solved = true
        `;

        // Add time filtering to the JOIN condition
        if (period === 'daily') {
            const today = new Date().toISOString().slice(0, 10);
            query += ` AND up.solved_at >= '${today}'`;
        } else if (period === 'weekly') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            query += ` AND up.solved_at >= '${weekAgo}'`;
        }

        query += `
            WHERE u.role = 'user'
            GROUP BY u.id, u.username, u.full_name
            ORDER BY solved_count DESC, u.username ASC
            LIMIT 50
        `;

        console.log(`🔍 Executing optimized leaderboard query for ${period}`);

        // Execute the optimized query
        const { data: leaderboardData, error: leaderboardError } = await supabase.rpc('exec_sql', {
            sql: query
        });

        // Fallback to manual query if RPC doesn't work
        let leaderboard;
        if (leaderboardError || !leaderboardData) {
            console.log('📋 RPC failed, using fallback query method');
            
            // Fallback: Use Supabase query builder (still much faster than N+1)
            let progressQuery = supabase
                .from('user_progress')
                .select(`
                    user_id,
                    users!inner(id, username, full_name, role)
                `, { count: 'exact' })
                .eq('is_solved', true)
                .eq('users.role', 'user');

            // Apply time filtering
            if (period === 'daily') {
                const today = new Date().toISOString().slice(0, 10);
                progressQuery = progressQuery.gte('solved_at', today);
            } else if (period === 'weekly') {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                progressQuery = progressQuery.gte('solved_at', weekAgo);
            }

            const { data: progressData, error: progressError } = await progressQuery;

            if (progressError) {
                console.error('Error fetching user progress:', progressError.message);
                return res.status(500).json({ error: 'Failed to fetch leaderboard' });
            }

            // Group by user and count solved questions
            const userSolvedCounts = {};
            progressData.forEach(record => {
                const userId = record.user_id;
                const user = record.users;
                
                if (!userSolvedCounts[userId]) {
                    userSolvedCounts[userId] = {
                        id: user.id,
                        username: user.username,
                        full_name: user.full_name,
                        solved_count: 0
                    };
                }
                userSolvedCounts[userId].solved_count++;
            });

            // Also get users with zero solved questions for complete leaderboard
            const { data: allUsers, error: allUsersError } = await supabase
                .from('users')
                .select('id, username, full_name')
                .eq('role', 'user');

            if (!allUsersError) {
                allUsers.forEach(user => {
                    if (!userSolvedCounts[user.id]) {
                        userSolvedCounts[user.id] = {
                            id: user.id,
                            username: user.username,
                            full_name: user.full_name,
                            solved_count: 0
                        };
                    }
                });
            }

            // Convert to array and sort
            leaderboard = Object.values(userSolvedCounts)
                .sort((a, b) => {
                    if (b.solved_count !== a.solved_count) {
                        return b.solved_count - a.solved_count;
                    }
                    return a.username.localeCompare(b.username);
                })
                .slice(0, 50);
        } else {
            leaderboard = leaderboardData;
        }

        // Add rank and success rate
        const rankedLeaderboard = leaderboard.map((user, index) => {
            const successRate = totalQuestions > 0 ? 
                Math.round((user.solved_count / totalQuestions) * 100 * 100) / 100 : 0;

            return {
                ...user,
                rank: index + 1,
                success_rate: successRate
            };
        });

        const endTime = Date.now();
        console.log(`⚡ Leaderboard query completed in ${endTime - startTime}ms for ${rankedLeaderboard.length} users`);

        res.json(rankedLeaderboard);
    } catch (err) {
        console.error('Error fetching leaderboard:', err.message);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// *******************************************************************
//                        SERVER STARTUP                           
// *******************************************************************

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n\nReceived SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\nReceived SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
    });
});

// Keep the process alive and handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process for unhandled promise rejections in development
    if (process.env.NODE_ENV === 'production') {
        server.close(() => {
            process.exit(1);
        });
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Always exit on uncaught exceptions
    server.close(() => {
        process.exit(1);
    });
});

console.log('🚀 DSA Samurai Backend Server Started');
console.log('📝 Rate limiting is relaxed for development');
console.log('🔒 JWT Authentication enabled');
console.log('📊 Supabase database connected');
console.log('\n--- Server is ready to handle requests ---');
