# 📊 Mock Data - Demonstration Guide

## ✅ Successfully Populated Database!

The MongoDB database has been populated with comprehensive mock data for demonstration purposes.

---

## 📈 **Data Summary**

### **Universities: 2**
1. **Massachusetts Institute of Technology (MIT123)**
2. **Stanford University (STAN456)**

### **Users: 9**
- **MIT University:**
  - alice (625 points) - Top solver with 3 challenges
  - bob (405 points) - 2 challenges solved
  - charlie (430 points) - 2 challenges solved
  - diana (250 points) - 2 challenges solved
  - mit_admin (Admin)

- **Stanford University:**
  - eve (590 points) - Top solver with 3 challenges
  - frank (380 points) - 2 challenges solved
  - grace (350 points) - 2 challenges solved
  - stan_admin (Admin)

- **Super Admin:**
  - superadmin (All universities access)

### **Challenges: 10**
- **MIT Challenges (5):**
  1. Basic SQL Injection (100 pts, Web) - 15 solves
  2. Caesar Cipher Decryption (150 pts, Crypto) - 22 solves
  3. Buffer Overflow Basics (200 pts, Pwn) - 8 solves
  4. Network Traffic Analysis (175 pts, Forensics) - 12 solves
  5. Reverse Engineering 101 (180 pts, Reverse) - 10 solves

- **Stanford Challenges (5):**
  1. XSS Vulnerability (120 pts, Web) - 18 solves
  2. RSA Encryption Challenge (250 pts, Crypto) - 5 solves
  3. Format String Vulnerability (220 pts, Pwn) - 7 solves
  4. Image Steganography (160 pts, Forensics) - 14 solves
  5. Android APK Reversing (200 pts, Reverse) - 9 solves

### **Competitions: 2**
1. **MIT Winter CTF 2024**
   - Security Code: WINTER2024
   - Status: Active
   - 2 challenges added

2. **Stanford Spring Challenge**
   - Security Code: SPRING2024
   - Status: Pending
   - 1 challenge added

---

## 🔐 **Login Credentials**

### **Super Admin (Full Access)**
```
URL: http://localhost:3000
Username: superadmin
Password: admin123
Role: Super Admin
Access: All universities, can copy challenges
```

### **MIT University Admin**
```
URL: http://localhost:3000
Username: mit_admin
Password: admin123
University Code: MIT123
Role: Admin
Access: Only MIT123 university
```

### **MIT Top User (Alice)**
```
URL: http://localhost:3000
Username: alice
Password: user123
University Code: MIT123
Role: User
Points: 625
Challenges Solved: 3
Profile Icon: default
```

### **Stanford University Admin**
```
URL: http://localhost:3000
Username: stan_admin
Password: admin123
University Code: STAN456
Role: Admin
Access: Only STAN456 university
```

### **Stanford Top User (Eve)**
```
URL: http://localhost:3000
Username: eve
Password: user123
University Code: STAN456
Role: User
Points: 590
Challenges Solved: 3
Profile Icon: spy
```

---

## 📊 **Leaderboard Data**

### **MIT University Leaderboard (Top 4)**
1. **alice** - 625 pts (3 solves) - Avg: 2.5 hrs/challenge
2. **charlie** - 430 pts (2 solves) - Avg: 5 hrs/challenge
3. **bob** - 405 pts (2 solves) - Avg: 6.5 hrs/challenge
4. **diana** - 250 pts (2 solves) - Avg: 5.5 hrs/challenge

### **Stanford University Leaderboard (Top 3)**
1. **eve** - 590 pts (3 solves) - Avg: 3 hrs/challenge
2. **frank** - 380 pts (2 solves) - Avg: 6 hrs/challenge
3. **grace** - 350 pts (2 solves) - Avg: 4 hrs/challenge

---

## 📝 **Writeup Data**

Each challenge has a writeup with:
- Markdown content
- Step-by-step solution
- Some writeups are **unlocked** for students
- Some writeups are **locked** (only visible to admins)

### **Unlocked Writeups (MIT):**
- Basic SQL Injection ✅
- Caesar Cipher Decryption ✅
- Network Traffic Analysis ✅

### **Unlocked Writeups (Stanford):**
- XSS Vulnerability ✅
- Format String Vulnerability ✅
- Android APK Reversing ✅

---

## 🎯 **Testing Scenarios**

### **1. Test Enhanced Leaderboard**
- Login as alice (MIT) or eve (Stanford)
- Go to Leaderboard page
- View top 3 champion cards with fire effects
- See statistics and time analysis
- Check full rankings table

### **2. Test Writeup System**
- Login as mit_admin or stan_admin
- Go to Admin → Manage Challenges
- Click "Writeup" button on any challenge
- Edit writeup content (Markdown supported)
- Toggle "Unlock writeup" checkbox
- Save writeup

### **3. Test Competitions**
- Login as mit_admin
- Go to Admin → Manage Competitions
- View "MIT Winter CTF 2024" (Active)
- Add challenges to competition
- Start/End competition
- Integrate challenges to main section

### **4. Test User Ban/Unban**
- Login as mit_admin
- Go to Admin → Users
- See all MIT users
- Ban a user
- Check if they disappear from leaderboard
- Unban the user

### **5. Test Super Admin Features**
- Login as superadmin (no university code needed)
- Go to Super Admin panel
- Select MIT123 from dropdown
- View MIT challenges
- Copy a challenge to Stanford

### **6. Test Announcements**
- Login as any user
- Click bell icon in header (next to profile)
- View announcements page

---

## 🏆 **Profile Icons**

Users have different profile icons configured:
- alice: default
- bob: hacker
- charlie: ninja
- diana: warrior
- eve: spy
- frank: default
- grace: hacker
- mit_admin: admin
- stan_admin: admin

---

## 🎨 **Visual Features**

### **Leaderboard Enhancements:**
- ✅ Top 3 cards with gold/silver/bronze gradients
- ✅ Fire effects with animated blur
- ✅ Statistics overview cards
- ✅ Time analysis (first/last/total/average)
- ✅ Hover effects and smooth transitions

### **Challenges:**
- ✅ Writeup support with Markdown
- ✅ Category filtering
- ✅ Hint system
- ✅ File attachments
- ✅ Solve tracking

### **Competitions:**
- ✅ Security code system
- ✅ Time-bound access
- ✅ Challenge integration
- ✅ Status management (pending/active/ended)

---

## 📱 **How to Access**

1. **Start the application:**
   ```bash
   # Backend (in /backend directory)
   npm start

   # Frontend (in root directory)
   npm run dev
   ```

2. **Access URLs:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api/health

3. **Login with any of the credentials above**

---

## 🔄 **Reset Mock Data**

To reset and re-populate the database:

```bash
cd backend
npx ts-node scripts/populate-mock-data.ts
```

This will clear all existing data and create fresh mock data.

---

## ✅ **Status: Ready for Demonstration!**

The database is fully populated with realistic data showcasing all platform features:
- 2 universities with complete isolation
- 9 users with different roles
- 10 challenges with writeups
- 2 active competitions
- Realistic solve times and points
- Profile icons and user attributes

Perfect for demonstrating the CTF platform's capabilities! 🚀
