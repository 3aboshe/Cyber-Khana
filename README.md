# Cyberخانه - CTF Platform

A comprehensive Capture The Flag (CTF) competition platform with university-based separation and advanced competition management features.

## Features

### Core Features
- **University Code Separation**: All data is segregated based on university codes
- **Multi-Role Authentication**: Player, Admin, and Super Admin roles
- **Competition System**: Create timed competitions with security codes
- **Challenge Management**: Create, manage, and solve challenges
- **Super Admin Panel**: Copy challenges between universities
- **Minimalist Dashboard**: Clean UI with easy navigation

### User Roles

#### 1. Player (User)
- Join competitions using security codes
- Solve challenges at their own pace
- View leaderboards
- Earn points and rank up

#### 2. Admin
- Create and manage competitions
- Add challenges to competitions
- Create regular challenges
- Manage users and announcements
- View university-specific data

#### 3. Super Admin
- Access all universities' data
- Copy challenges between universities
- Create university admins
- System-wide administration

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
/cyber-citadel-ctf
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth & filters
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Helper functions
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── src/                  # React frontend
│   ├── components/       # Reusable components
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin panel pages
│   │   ├── LoginPage.tsx
│   │   ├── NewDashboardPage.tsx
│   │   ├── ChallengesPage.tsx
│   │   ├── CompetitionPage.tsx
│   │   └── ...
│   ├── types.ts          # TypeScript types
│   └── ...
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cyber-khana
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

5. Start MongoDB:
```bash
mongod
```

6. Start backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. In a new terminal, navigate to project root:
```bash
cd /Users/abdalrahmanmajed/Desktop/cyber-citadel-ctf
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. Start development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/login-admin` - Admin login
- `POST /api/auth/login-super-admin` - Super admin login

### Challenges
- `GET /api/challenges` - Get all challenges
- `GET /api/challenges/:id` - Get single challenge
- `POST /api/challenges` - Create challenge (Admin)
- `PUT /api/challenges/:id` - Update challenge (Admin)
- `DELETE /api/challenges/:id` - Delete challenge (Admin)
- `POST /api/challenges/:id/submit` - Submit flag

### Competitions
- `GET /api/competitions` - Get all competitions
- `POST /api/competitions` - Create competition (Admin)
- `GET /api/competitions/:id` - Get competition
- `PATCH /api/competitions/:id/status` - Update status (Admin)
- `POST /api/competitions/:id/challenges` - Add challenge (Admin)
- `POST /api/competitions/:id/submit` - Submit competition flag

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/leaderboard` - Get leaderboard
- `GET /api/users` - Get all users (Admin)
- `POST /api/users/create-admin` - Create admin (Super Admin)

## Usage Guide

### Getting Started

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `npm run dev`
3. **Access**: Open http://localhost:5173

### Creating Your First Setup

1. **Create University**: (Via database or admin panel in future)
2. **Create Super Admin**: (Via database initially)
3. **Login as Super Admin**:
   - Username: admin
   - Password: (your choice)
   - Role: Super Admin

4. **Create University Admin**:
   - Use Super Admin panel
   - Create admin for specific university code

5. **Create Challenges**:
   - Login as University Admin
   - Go to Admin Panel → Challenges
   - Create challenges

6. **Create Competition**:
   - Admin Panel → Competitions
   - Add challenges to competition
   - Set start/end time
   - Generate security code

7. **Start Competition**:
   - Set competition status to "active"
   - Share security code with participants

### Participant Flow

1. **Register/Login**:
   - Enter username, password, university code
   - Players must match their university's code

2. **Join Competition**:
   - Go to "Enter Competition"
   - Enter security code
   - Access competition challenges

3. **Solve Challenges**:
   - Go to "Explore Challenges" for practice
   - Or solve competition challenges
   - Submit flags to earn points

## Database Models

### University
- name: String
- code: String (unique, uppercase)

### User
- username: String (unique)
- password: String (hashed)
- role: Enum ['user', 'admin']
- universityCode: String
- points: Number
- solvedChallenges: String[]
- unlockedHints: String[]

### Challenge
- title: String
- category: Enum
- points: Number
- description: String
- author: String
- flag: String
- hints: Hint[]
- files: ChallengeFile[]
- universityCode: String
- solves: Number

### Competition
- name: String
- securityCode: String
- universityCode: String
- startTime: Date
- endTime: Date
- status: Enum ['pending', 'active', 'ended']
- challenges: CompetitionChallenge[]

### SuperAdmin
- username: String (unique)
- password: String (hashed)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- University code validation
- Role-based access control
- University data isolation
- Secure flag submission

## Development

### Running Tests
```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

### Type Checking
```bash
# Frontend
npx tsc --noEmit

# Backend
cd backend
npx tsc --noEmit
```

## Deployment

### Quick Deploy to Digital Ocean Droplet

**One-command deployment on Ubuntu 20.04+ Droplet:**

```bash
curl -sSL https://raw.githubusercontent.com/3aboshe/Cyber-Khana/master/deploy-to-droplet.sh | bash
```

That's it! The script will:
- Install Node.js 18, MongoDB, Nginx, and PM2
- Clone the repository
- Build the project
- Configure Nginx on port 80
- Set up the database
- Start the backend with PM2
- Configure firewall

**Access your application at:** `http://YOUR_DROPLET_IP`

**Login credentials:**
- Username: `admin`
- Password: `OurSecurePlatform@d0mv6p`

### Update Your Deployment

To update to the latest version:
```bash
cd /root/cyber-citadel-ctf && git pull origin master && pm2 restart cyber-citadel-backend
```

Or use the quick update script:
```bash
/root/cyber-citadel-ctf/update-droplet.sh
```

### Manual Deployment Steps

**Backend Deployment:**
1. Build: `cd backend && npm run build`
2. Set production environment variables
3. Deploy with PM2: `pm2 start ecosystem.config.js`

**Frontend Deployment:**
1. Build: `npm run build`
2. Deploy `dist/` folder to Nginx or static hosting

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cyber-khana
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Future Enhancements

- [ ] User registration UI for admins
- [ ] Announcement system
- [ ] Challenge categories filtering
- [ ] Team-based competitions
- [ ] Write-up submission system
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Email notifications
- [ ] Multi-language support

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

---

**Cyberخانه** - Empowering cybersecurity education through competitive challenges.
