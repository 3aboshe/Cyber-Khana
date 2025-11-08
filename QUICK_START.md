# 🚀 Cyberخانه CTF - Quick Start Guide

## ✅ Status: READY TO USE!

Your **Cyberخانه** CTF platform is now running with MongoDB!

---

## 🔗 Access URLs

### Frontend (React App)
- **URL**: http://localhost:3000
- **Status**: ✅ Running

### Backend (API)
- **URL**: http://localhost:5001
- **API Docs**: http://localhost:5001/api/health
- **Status**: ✅ Running

### Database
- **MongoDB**: mongodb://localhost:27017/cyber-khana
- **Status**: ✅ Running

---

## 🔐 Login Credentials

### 1. 🔴 Super Admin (Full Access)
- **URL**: http://localhost:3000
- **Username**: `superadmin`
- **Password**: `admin123`
- **Role**: Super Admin
- **Access**: All universities, can copy challenges

### 2. 🔵 University Admin
- **URL**: http://localhost:3000
- **Username**: `mit_admin`
- **Password**: `admin123`
- **University Code**: `MIT123`
- **Role**: Admin
- **Access**: Only MIT123 university

### 3. 🟢 Regular User
- **URL**: http://localhost:3000
- **Username**: `alice`
- **Password**: `user123`
- **University Code**: `MIT123`
- **Role**: User
- **Access**: Join competitions, solve challenges

---

## 🎯 How to Use

### As Super Admin:
1. Login with `superadmin` / `admin123`
2. Go to Admin → Super Admin panel
3. Select a university from dropdown
4. Copy challenges between universities

### As University Admin:
1. Login with `mit_admin` / `admin123` + University Code: `MIT123`
2. Go to Admin → Competitions
3. Create a competition
4. Add challenges to competition
5. Set status to "active" to start it
6. Share security code with users

### As Regular User:
1. Login with `alice` / `user123` + University Code: `MIT123`
2. Click "Enter Competition" to join with security code
3. Click "Explore Challenges" to practice
4. Submit flags to earn points

---

## 📊 Database Contents

Created automatically:
- ✅ 5 Universities (MIT123, STAN456, HARV789, BERK101, CMU202)
- ✅ 1 Super Admin
- ✅ 3 University Admins
- ✅ 3 Sample Users

---

## 🛠️ Useful Commands

### Backend (in `/backend` directory):
```bash
# Test database connection
npm run test-db

# Reset database (clears all data)
npm run setup-db

# Start backend
npm run dev
```

### Frontend (in project root):
```bash
# Start frontend
npm run dev
```

---

## 📝 Quick Test Flow

1. **Open browser** → http://localhost:3000
2. **Login** as Super Admin:
   - Username: `superadmin`
   - Password: `admin123`
3. **Create Challenge** (as admin):
   - Go to Admin → Challenges
   - Click "Create Challenge"
   - Add title, description, flag, points
4. **Create Competition** (as admin):
   - Go to Admin → Competitions
   - Create new competition
   - Add challenges
   - Set to "active"
5. **Join as User**:
   - Login as `alice` / `user123` (University: `MIT123`)
   - Enter competition with security code
   - Solve challenges!

---

## 🎨 Features

### ✅ Implemented:
- University code separation
- JWT authentication
- Role-based access (User, Admin, Super Admin)
- Competition system with security codes
- Challenge management
- Super Admin panel for cross-university operations
- Minimalist dashboard
- Point-based scoring
- Leaderboard

### 🔄 Running:
- Frontend: React 19 + TypeScript
- Backend: Node.js + Express
- Database: MongoDB
- Auth: JWT + bcrypt

---

## 🆘 Troubleshooting

### MongoDB not running?
```bash
brew services start mongodb/brew/mongodb-community@7.0
```

### Port already in use?
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will auto-select next available port

### Database empty?
```bash
cd backend
npm run setup-db
```

---

## 📦 Project Structure

```
cyber-citadel-ctf/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── config/   # Database config
│   │   ├── controllers/ # API endpoints
│   │   ├── models/   # MongoDB models
│   │   └── ...
│   └── .env
├── src/
│   ├── pages/        # React pages
│   ├── components/   # Reusable components
│   └── ...
└── .env              # Frontend config
```

---

## 🎉 Success!

Everything is set up and ready to go!

**Next Steps:**
1. Create more challenges
2. Set up competitions
3. Add more users
4. Have fun with CTF!

---

**Cyberخانه** - Empowering cybersecurity education through competitive challenges.
