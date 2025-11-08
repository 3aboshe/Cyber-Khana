# MongoDB Setup Guide for Cyberخانه CTF

## Quick Setup (Recommended)

### 1. Install MongoDB

**Option A: MongoDB Atlas (Cloud)**
```bash
# Go to https://www.mongodb.com/cloud/atlas
# 1. Create account
# 2. Create cluster (free tier)
# 3. Create database user
# 4. Add IP 0.0.0.0/0
# 5. Get connection string
```

**Option B: Local MongoDB**

macOS:
```bash
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

Ubuntu:
```bash
sudo apt-get install mongodb-org
sudo systemctl start mongod
```

Windows:
- Download from https://www.mongodb.com/try/download/community
- Run installer
- Start MongoDB service

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/cyber-khana
JWT_SECRET=cyber-khana-super-secret-jwt-key-2024
NODE_ENV=development" > .env

# Run database setup (creates sample data)
npm run setup-db
```

### 3. Start Backend

```bash
npm run dev
```

Backend will run on http://localhost:5000

### 4. Start Frontend (New Terminal)

```bash
# In project root
npm install
npm run dev
```

Frontend will run on http://localhost:5173

## Login Credentials (After Setup)

### Super Admin
- **URL**: http://localhost:5173
- **Username**: superadmin
- **Password**: admin123
- **Role**: Super Admin

### University Admin (MIT)
- **URL**: http://localhost:5173
- **Username**: mit_admin
- **Password**: admin123
- **University Code**: MIT123
- **Role**: Admin

### Regular User
- **URL**: http://localhost:5173
- **Username**: alice
- **Password**: user123
- **University Code**: MIT123
- **Role**: User

## What Gets Created

- ✅ 5 Universities (MIT123, STAN456, HARV789, BERK101, CMU202)
- ✅ 1 Super Admin
- ✅ 3 University Admins
- ✅ 3 Sample Users
- ✅ Ready to create challenges and competitions!

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

### Port Already in Use
```bash
# Change port in backend/.env
PORT=5001

# Update frontend .env (if exists)
VITE_API_URL=http://localhost:5001/api
```

### Database Setup Fails
1. Check MongoDB is running
2. Verify MONGODB_URI in .env
3. Run setup again: `npm run setup-db`

## Using MongoDB Atlas (Cloud)

If you prefer cloud database:

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create new project
3. Build a database → Create database
4. Add database user with password
5. Network access → Add IP Address → 0.0.0.0/0
6. Get connection string
7. Update MONGODB_URI in .env

Example Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cyber-khana?retryWrites=true&w=majority
```

## Development Tips

### View Database Data
You can use MongoDB Compass (GUI) to view your data:
1. Download MongoDB Compass
2. Connect to: mongodb://localhost:27017
3. Browse the 'cyber-khana' database

### Reset Database
```bash
npm run setup-db
```

This will clear and recreate all sample data.

### Add More Universities
Edit `backend/scripts/setup-db.ts` and add to the universities array.

## Next Steps

After successful setup:
1. Login as Super Admin
2. Create more university admins
3. Create challenges
4. Create competitions
5. Add users

Enjoy! 🚀
