const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Add multiple users from an array
 * @param {Array} users - Array of user objects with required fields
 */
async function addMultipleUsers(users) {
    console.log(`🚀 Starting to add ${users.length} users...`);
    
    const results = {
        success: [],
        failed: [],
        total: users.length
    };

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`\n📝 Processing user ${i + 1}/${users.length}: ${user.username}`);
        
        try {
            // Validate required fields
            const requiredFields = ['username', 'password', 'role', 'full_name'];
            const missingFields = requiredFields.filter(field => !user[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Check if user already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('username')
                .eq('username', user.username)
                .single();

            if (existingUser) {
                throw new Error(`User with username '${user.username}' already exists`);
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            // Prepare user data
            const userData = {
                username: user.username,
                password: hashedPassword,
                role: user.role,
                full_name: user.full_name,
                leetcode_username: user.leetcode_username || null,
                geeksforgeeks_username: user.geeksforgeeks_username || null,
                created_at: new Date().toISOString()
            };

            // Add the user to database
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select();

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            console.log(`✅ User '${user.username}' added successfully with ID: ${data[0].id}`);
            results.success.push({
                username: user.username,
                id: data[0].id,
                full_name: user.full_name,
                role: user.role
            });

        } catch (err) {
            console.log(`❌ Failed to add user '${user.username}': ${err.message}`);
            results.failed.push({
                username: user.username,
                error: err.message
            });
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 BULK USER ADDITION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users processed: ${results.total}`);
    console.log(`✅ Successfully added: ${results.success.length}`);
    console.log(`❌ Failed to add: ${results.failed.length}`);
    
    if (results.success.length > 0) {
        console.log('\n✅ Successfully added users:');
        results.success.forEach(user => {
            console.log(`  - ${user.username} (${user.full_name}) - Role: ${user.role}`);
        });
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed users:');
        results.failed.forEach(user => {
            console.log(`  - ${user.username}: ${user.error}`);
        });
    }

    return results;
}

/**
 * Read users from CSV file
 * @param {string} csvFilePath - Path to CSV file
 */
async function readUsersFromCSV(csvFilePath) {
    return new Promise((resolve, reject) => {
        const users = [];
        
        if (!fs.existsSync(csvFilePath)) {
            reject(new Error(`CSV file not found: ${csvFilePath}`));
            return;
        }

        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                // Convert CSV headers to match our expected format
                const user = {
                    username: row.username || row.Username || row.USERNAME,
                    password: row.password || row.Password || row.PASSWORD,
                    role: row.role || row.Role || row.ROLE || 'user',
                    full_name: row.full_name || row.Full_Name || row.FULL_NAME || row['Full Name'],
                    leetcode_username: row.leetcode_username || row.Leetcode_Username || row.LEETCODE_USERNAME || row['LeetCode Username'],
                    geeksforgeeks_username: row.geeksforgeeks_username || row.Geeksforgeeks_Username || row.GEEKSFORGEEKS_USERNAME || row['GeeksforGeeks Username']
                };
                
                // Remove empty string values and convert to null
                Object.keys(user).forEach(key => {
                    if (user[key] === '' || user[key] === undefined) {
                        user[key] = null;
                    }
                });

                users.push(user);
            })
            .on('end', () => {
                console.log(`📄 Successfully read ${users.length} users from CSV file`);
                resolve(users);
            })
            .on('error', (err) => {
                reject(new Error(`Error reading CSV file: ${err.message}`));
            });
    });
}

/**
 * Example function to add users manually (for testing)
 */
async function addExampleUsers() {
    const exampleUsers = [
        {
            username: 'john_doe',
            password: 'password123',
            role: 'user',
            full_name: 'John Doe',
            leetcode_username: 'johndoe_lc',
            geeksforgeeks_username: 'johndoe_gfg'
        },
        {
            username: 'jane_smith',
            password: 'securepass456',
            role: 'user',
            full_name: 'Jane Smith',
            leetcode_username: 'janesmith',
            geeksforgeeks_username: 'jane_smith_gfg'
        },
        {
            username: 'admin_test',
            password: 'adminpass789',
            role: 'admin',
            full_name: 'Admin User',
            leetcode_username: null,
            geeksforgeeks_username: null
        }
    ];

    return await addMultipleUsers(exampleUsers);
}

// Main execution
async function main() {
    try {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            console.log('Usage:');
            console.log('  node bulk_add_users.js <csv_file_path>   - Add users from CSV file');
            console.log('  node bulk_add_users.js --example        - Add example users');
            console.log('');
            console.log('CSV file should have columns: username, password, role, full_name, leetcode_username, geeksforgeeks_username');
            console.log('Required columns: username, password, role, full_name');
            console.log('Optional columns: leetcode_username, geeksforgeeks_username');
            return;
        }

        if (args[0] === '--example') {
            await addExampleUsers();
        } else {
            const csvFilePath = args[0];
            const users = await readUsersFromCSV(csvFilePath);
            await addMultipleUsers(users);
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// Export functions for use in other files
module.exports = {
    addMultipleUsers,
    readUsersFromCSV
};

// Run main function if this file is executed directly
if (require.main === module) {
    main();
}
