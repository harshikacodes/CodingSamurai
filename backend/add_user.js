const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUser() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('harshika123', 10);
        
        // Add the new user
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username: 'harshika',
                    password: hashedPassword,
                    role: 'user',
                    full_name: 'Harshika Malhotra',
                    leetcode_username: 'malhotraharshika',
                    geeksforgeeks_username: 'malhotraharshika',
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Error adding user:', error.message);
            return;
        }

        console.log('✅ User added successfully!');
        console.log('User details:', {
            id: data[0].id,
            username: data[0].username,
            full_name: data[0].full_name,
            role: data[0].role,
            leetcode_username: data[0].leetcode_username,
            geeksforgeeks_username: data[0].geeksforgeeks_username
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

// Run the function
addUser();
