# DSA Project - Question Management System

A **web application** for managing Data Structures and Algorithms (DSA) questions with **user authentication, progress tracking, and leaderboards**.

---

## ✨ Features

* 📌 **Question Management**: Add, edit, delete, and filter questions
* 🔐 **User Authentication**: Secure login system with JWT tokens
* 📊 **Progress Tracking**: Track solved questions and user progress
* 🏆 **Leaderboards**: Daily, weekly, and all-time rankings
* 👤 **User Profiles**: Manage user information and coding platform usernames
* ⚙️ **Admin Panel**: Administrative controls for question management

---

## 📂 Project Structure

```
dsaproject/
├── backend/           # Node.js Express API server
│   ├── server.js      # Main server file
│   ├── package.json   # Backend dependencies
│   └── .env           # Environment variables
├── frontend/          # React.js client application
│   ├── src/           # React source files
│   ├── public/        # Static assets
│   └── package.json   # Frontend dependencies
└── README.md          # Project documentation
```

---

## 🛠️ Technology Stack

### Backend

* **Node.js** – Runtime environment
* **Express.js** – Web framework
* **Supabase** – Database and Authentication
* **JWT** – Authentication
* **bcryptjs** – Password hashing
* **CORS** – Cross-origin resource sharing

### Frontend

* **React.js** – UI framework
* **Tailwind CSS** – Styling
* **JavaScript** – Programming language

---

## 📌 Prerequisites

* **Node.js** (v14 or higher)
* **Supabase account** (free tier available)
* **npm** or **yarn** package manager

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd dsaproject
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001

# JWT Secret (optional)
JWT_SECRET=your_jwt_secret_here
```

📌 **Get your Supabase credentials**:

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your project dashboard → **Settings > API**
3. Copy the **Project URL** and **API Keys**

Start the backend server:

```bash
npm start
# or for development
npm run dev
```

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm start
```

📍 Application URLs:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:3001](http://localhost:3001)

---

## 🗄️ Database Schema

The application uses **Supabase (PostgreSQL)** with the following tables:

### Users Table

* `id` – Primary key
* `username` – Unique username
* `password` – Hashed password
* `role` – User role (admin/user)
* `full_name` – User's full name
* `leetcode_username` – LeetCode username
* `geeksforgeeks_username` – GeeksforGeeks username
* `created_at` – Account creation timestamp

### Questions Table

* `id` – Primary key
* `question_name` – Question title
* `question_link` – URL to the question
* `type` – Question type (homework/classwork)
* `difficulty` – Difficulty level (easy/medium/hard)
* `created_at` – Question creation timestamp

### User Progress Table

* `id` – Primary key
* `user_id` – Foreign key to users table
* `question_id` – Foreign key to questions table
* `is_solved` – Boolean flag for completion status
* `solved_at` – Completion timestamp
* `notes` – Optional user notes

---

## 🔗 API Endpoints

### Authentication

* `POST /api/auth/login` – User login

### Questions

* `GET /questions` – Get all questions
* `GET /questions/filter` – Filter questions by type/difficulty
* `POST /submit-question` – Create new question
* `PUT /questions/:id` – Update question
* `DELETE /questions/:id` – Delete question

### User Progress

* `GET /api/progress/:userId` – Get user progress
* `POST /api/progress` – Update progress

### User Management

* `GET /api/users/:id` – Get user profile
* `PUT /api/users/:id` – Update user profile

### Leaderboard

* `GET /api/leaderboard` – Get leaderboard data

---

## 🏗️ Backend Overview

This backend provides **user management features**, including:

* Adding single users
* Bulk user import via CSV

### Folder Structure

* `.env` – Environment variables
* `add_user.js` – Script to add a single user
* `bulk_add_users.js` – Script to bulk add users from CSV
* `package.json` – Backend dependencies
* `server.js` – Main backend server file
* `usersbulk.csv` – Example CSV for bulk user import

### Running Scripts

* Add a single user:

```bash
node add_user.js
```

* Bulk add users from CSV:

```bash
node bulk_add_users.js
```

⚠️ Ensure `usersbulk.csv` is correctly formatted.

---

## 🔧 Troubleshooting

### Database Connection Issues

* Verify Supabase project is active (not paused)
* Check Supabase credentials in `.env`
* Ensure Project URL & Keys are correct
* Check allowed IPs in Supabase settings

### Port Conflicts

* Backend: **3001** (default)
* Frontend: **3000** (default)
* Change ports in configuration files if needed

### CORS Issues

* Backend is configured for `localhost:3000` & `localhost:3001`
* Modify `server.js` CORS settings if required

---

## 📌 Recent Changes

* ✅ Updated project structure & dependencies
* ✅ Improved authentication (admin & user roles)
* ✅ Enhanced UI/UX for better navigation
* ✅ Bug fixes & performance improvements

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:

   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to branch:

   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request