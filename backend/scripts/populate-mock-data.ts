import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import University from '../src/models/University';
import Challenge from '../src/models/Challenge';
import Competition from '../src/models/Competition';
import SuperAdmin from '../src/models/SuperAdmin';
import { hashPassword } from '../src/utils/auth';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber-khana';

const universities = [
  {
    name: 'Massachusetts Institute of Technology',
    code: 'MIT123'
  },
  {
    name: 'Stanford University',
    code: 'STAN456'
  }
];

const sampleChallenges = {
  MIT123: [
    {
      title: 'Basic SQL Injection',
      category: 'Web Exploitation',
      points: 100,
      description: 'A vulnerable login form awaits. Can you extract the admin credentials?',
      author: 'admin',
      flag: 'CTF{sql_injection_master}',
      hints: [
        { text: 'Try common SQL injection payloads', cost: 20 },
        { text: 'Look for UNION-based attacks', cost: 30 }
      ],
      files: [
        { name: 'source_code.zip', url: 'http://example.com/source_code.zip' }
      ],
      universityCode: 'MIT123',
      solves: 15,
      writeup: {
        content: `# SQL Injection Writeup

## Step 1: Identifying the Vulnerability
We found a login form at /login that takes username and password.

## Step 2: Testing for SQL Injection
Using the payload: \`admin' OR '1'='1' --\`

## Step 3: Extracting Data
By using UNION SELECT, we can extract data from the users table.

## Solution
The flag is: \`CTF{sql_injection_master}\``,
        images: [],
        isUnlocked: true
      }
    },
    {
      title: 'Caesar Cipher Decryption',
      category: 'Cryptography',
      points: 150,
      description: 'An ancient cipher has been discovered. Can you crack the code?',
      author: 'crypto_master',
      flag: 'CTF{caesar_cipher_101}',
      hints: [
        { text: 'It\'s a substitution cipher', cost: 25 }
      ],
      files: [],
      universityCode: 'MIT123',
      solves: 22,
      writeup: {
        content: `# Caesar Cipher Writeup

## Analysis
The text shows a pattern of letter frequency typical of a Caesar cipher.

## Decryption
Using a shift of 13 (ROT13), we decode the message.

## Flag
\`CTF{caesar_cipher_101}\``,
        images: [],
        isUnlocked: true
      }
    },
    {
      title: 'Buffer Overflow Basics',
      category: 'Pwn',
      points: 200,
      description: 'A vulnerable program with no protection. Exploit it!',
      author: 'pwn_king',
      flag: 'CTF{buffer_overflow_victim}',
      hints: [
        { text: 'Check for ASLR', cost: 30 }
      ],
      files: [
        { name: 'vuln_program', url: 'http://example.com/vuln_program' }
      ],
      universityCode: 'MIT123',
      solves: 8,
      writeup: {
        content: `# Buffer Overflow Writeup

## Understanding the Vulnerability
The program uses \`gets()\` which doesn't check buffer boundaries.

## Exploitation Steps
1. Send 64 bytes to overflow the buffer
2. Overwrite return address
3. Jump to shellcode

## Flag
\`CTF{buffer_overflow_victim}\``,
        images: [],
        isUnlocked: false
      }
    },
    {
      title: 'Network Traffic Analysis',
      category: 'Forensics',
      points: 175,
      description: 'Capture file contains suspicious network traffic. Find the hidden message.',
      author: 'forensics_expert',
      flag: 'CTF{packet_sniffing_pro}',
      hints: [
        { text: 'Look for HTTP traffic', cost: 25 }
      ],
      files: [
        { name: 'capture.pcap', url: 'http://example.com/capture.pcap' }
      ],
      universityCode: 'MIT123',
      solves: 12,
      writeup: {
        content: `# Network Forensics Writeup

## Wireshark Analysis
Opening the capture file in Wireshark, we see multiple HTTP packets.

## Hidden Message
Using strings command reveals the hidden flag in packet data.

## Flag
\`CTF{packet_sniffing_pro}\``,
        images: [],
        isUnlocked: true
      }
    },
    {
      title: 'Reverse Engineering 101',
      category: 'Reverse Engineering',
      points: 180,
      description: 'A simple password checker. Can you bypass it?',
      author: 're_guru',
      flag: 'CTF{assembly_fluent}',
      hints: [
        { text: 'Use Ghidra or IDA Pro', cost: 30 }
      ],
      files: [
        { name: 'crackme.exe', url: 'http://example.com/crackme.exe' }
      ],
      universityCode: 'MIT123',
      solves: 10,
      writeup: {
        content: `# Reverse Engineering Writeup

## Static Analysis
Using Ghidra, we decompile the binary to understand its logic.

## Key Function
The password check function compares input with hardcoded string.

## Flag
\`CTF{assembly_fluent}\``,
        images: [],
        isUnlocked: false
      }
    }
  ],
  STAN456: [
    {
      title: 'XSS Vulnerability',
      category: 'Web Exploitation',
      points: 120,
      description: 'A comment form is vulnerable. Inject some JavaScript!',
      author: 'web_security',
      flag: 'CTF{xss_stored_attack}',
      hints: [
        { text: 'Try <script>alert(1)</script>', cost: 20 }
      ],
      files: [],
      universityCode: 'STAN456',
      solves: 18,
      writeup: {
        content: `# XSS Writeup

## Vulnerability
The comment form doesn't sanitize user input.

## Exploitation
We inject: \`<script>alert(document.cookie)</script>\`

## Impact
This could steal user session cookies.

## Flag
\`CTF{xss_stored_attack}\``,
        images: [],
        isUnlocked: true
      }
    },
    {
      title: 'RSA Encryption Challenge',
      category: 'Cryptography',
      points: 250,
      description: 'Can you factor this RSA modulus and decrypt the message?',
      author: 'crypto_pro',
      flag: 'CTF{rsa_factoring_fun}',
      hints: [
        { text: 'Try small factors first', cost: 40 }
      ],
      files: [
        { name: 'rsa_data.txt', url: 'http://example.com/rsa_data.txt' }
      ],
      universityCode: 'STAN456',
      solves: 5,
      writeup: {
        content: `# RSA Writeup

## RSA Parameters
Given: n = 3233, e = 17

## Factoring
Using trial division, we find: n = 61 × 53

## Decryption
Calculate d and decrypt the ciphertext.

## Flag
\`CTF{rsa_factoring_fun}\``,
        images: [],
        isUnlocked: false
      }
    },
    {
      title: 'Format String Vulnerability',
      category: 'Pwn',
      points: 220,
      description: 'A program uses printf incorrectly. Exploit the format string bug.',
      author: 'pwn_expert',
      flag: 'CTF{format_string_pro}',
      hints: [
        { text: 'Try %x %x %x', cost: 30 }
      ],
      files: [
        { name: 'vuln', url: 'http://example.com/vuln' }
      ],
      universityCode: 'STAN456',
      solves: 7,
      writeup: {
        content: `# Format String Writeup

## Vulnerability
The program uses printf(user_input) without format specifier.

## Exploitation
Using %n, we can write to arbitrary memory addresses.

## Flag
\`CTF{format_string_pro}\``,
        images: [],
        isUnlocked: true
      }
    },
    {
      title: 'Image Steganography',
      category: 'Forensics',
      points: 160,
      description: 'Hidden data in an image. Find the secret message!',
      author: 'steganography_ninja',
      flag: 'CTF{lsb_steganography_pro}',
      hints: [
        { text: 'Check least significant bits', cost: 25 }
      ],
      files: [
        { name: 'hidden.png', url: 'http://example.com/hidden.png' }
      ],
      universityCode: 'STAN456',
      solves: 14,
      writeup: {
        content: `# Steganography Writeup

## LSB Analysis
Using stegsolve, we examine the least significant bits.

## Hidden Message
The message is encoded in the blue channel LSB.

## Flag
\`CTF{lsb_steganography_pro}\``,
        images: [],
        isUnlocked: false
      }
    },
    {
      title: 'Android APK Reversing',
      category: 'Reverse Engineering',
      points: 200,
      description: 'A mobile app with a secret. Reverse engineer it!',
      author: 'mobile_re_expert',
      flag: 'CTF{android_reverse_fun}',
      hints: [
        { text: 'Decompile with jadx', cost: 35 }
      ],
      files: [
        { name: 'app.apk', url: 'http://example.com/app.apk' }
      ],
      universityCode: 'STAN456',
      solves: 9,
      writeup: {
        content: `# Android Reversing Writeup

## Decompilation
Using jadx, we decompile the APK to Java source.

## Logic Analysis
The app checks a hardcoded password in MainActivity.

## Flag
\`CTF{android_reverse_fun}\``,
        images: [],
        isUnlocked: true
      }
    }
  ]
};

const sampleUsers = {
  MIT123: [
    {
      username: 'alice',
      password: 'user123',
      role: 'user',
      universityCode: 'MIT123',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'default',
      isBanned: false
    },
    {
      username: 'bob',
      password: 'user123',
      role: 'user',
      universityCode: 'MIT123',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'hacker',
      isBanned: false
    },
    {
      username: 'charlie',
      password: 'user123',
      role: 'user',
      universityCode: 'MIT123',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'ninja',
      isBanned: false
    },
    {
      username: 'diana',
      password: 'user123',
      role: 'user',
      universityCode: 'MIT123',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'warrior',
      isBanned: false
    },
    {
      username: 'mit_admin',
      password: 'admin123',
      role: 'admin',
      universityCode: 'MIT123',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'admin',
      isBanned: false
    }
  ],
  STAN456: [
    {
      username: 'eve',
      password: 'user123',
      role: 'user',
      universityCode: 'STAN456',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'spy',
      isBanned: false
    },
    {
      username: 'frank',
      password: 'user123',
      role: 'user',
      universityCode: 'STAN456',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'default',
      isBanned: false
    },
    {
      username: 'grace',
      password: 'user123',
      role: 'user',
      universityCode: 'STAN456',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'hacker',
      isBanned: false
    },
    {
      username: 'stan_admin',
      password: 'admin123',
      role: 'admin',
      universityCode: 'STAN456',
      points: 0,
      solvedChallenges: [],
      solvedChallengesDetails: [],
      profileIcon: 'admin',
      isBanned: false
    }
  ]
};

const sampleCompetitions = [
  {
    name: 'MIT Winter CTF 2024',
    securityCode: 'WINTER2024',
    universityCode: 'MIT123',
    startTime: new Date('2024-01-20T09:00:00'),
    endTime: new Date('2024-01-22T09:00:00'),
    status: 'active',
    challenges: [
      {
        title: 'Web Security Challenge',
        category: 'Web Exploitation',
        points: 100,
        description: 'A simple web app with vulnerabilities',
        author: 'admin',
        flag: 'CTF{web_security_101}',
        hints: [],
        files: [],
        solves: 5
      },
      {
        title: 'Crypto Puzzle',
        category: 'Cryptography',
        points: 150,
        description: 'Decrypt the message',
        author: 'admin',
        flag: 'CTF{crypto_puzzle_2024}',
        hints: [],
        files: [],
        solves: 3
      }
    ]
  },
  {
    name: 'Stanford Spring Challenge',
    securityCode: 'SPRING2024',
    universityCode: 'STAN456',
    startTime: new Date('2024-02-01T10:00:00'),
    endTime: new Date('2024-02-03T10:00:00'),
    status: 'pending',
    challenges: [
      {
        title: 'Binary Exploitation',
        category: 'Pwn',
        points: 200,
        description: 'Exploit this binary',
        author: 'admin',
        flag: 'CTF{binary_exploit_spring}',
        hints: [],
        files: [],
        solves: 0
      }
    ]
  }
];

async function populateMockData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    console.log('\n--- Clearing existing data ---');
    await User.deleteMany({});
    await University.deleteMany({});
    await Challenge.deleteMany({});
    await Competition.deleteMany({});
    await SuperAdmin.deleteMany({});
    console.log('Existing data cleared!');

    console.log('\n--- Creating Universities ---');
    const createdUniversities = await University.insertMany(universities);
    console.log(`Created ${createdUniversities.length} universities`);

    console.log('\n--- Creating Super Admin ---');
    const superAdminPassword = await hashPassword('admin123');
    await SuperAdmin.create({
      username: 'superadmin',
      password: superAdminPassword
    });
    console.log('Super admin created!');

    console.log('\n--- Creating Challenges ---');
    const allChallenges: any[] = [];
    for (const uniCode of Object.keys(sampleChallenges)) {
      const challenges = sampleChallenges[uniCode as keyof typeof sampleChallenges];
      for (const challenge of challenges) {
        allChallenges.push(challenge);
      }
    }
    const createdChallenges = await Challenge.insertMany(allChallenges);
    console.log(`Created ${createdChallenges.length} challenges`);

    console.log('\n--- Creating Users ---');
    const allUsers: any[] = [];
    for (const uniCode of Object.keys(sampleUsers)) {
      const users = sampleUsers[uniCode as keyof typeof sampleUsers];
      for (const user of users) {
        const userData = { ...user };
        const hashedPassword = await hashPassword(user.password);
        userData.password = hashedPassword;
        userData.solvedChallenges = [];
        userData.solvedChallengesDetails = [];
        allUsers.push(userData);
      }
    }
    const createdUsers = await User.insertMany(allUsers);
    console.log(`Created ${createdUsers.length} users`);

    console.log('\n--- Creating User Challenge Progress ---');
    const mitChallengeIds = createdChallenges
      .filter(c => c.universityCode === 'MIT123')
      .map(c => c._id);
    const stanChallengeIds = createdChallenges
      .filter(c => c.universityCode === 'STAN456')
      .map(c => c._id);

    const alice = createdUsers.find(u => u.username === 'alice');
    const bob = createdUsers.find(u => u.username === 'bob');
    const charlie = createdUsers.find(u => u.username === 'charlie');
    const diana = createdUsers.find(u => u.username === 'diana');

    if (alice) {
      alice.solvedChallenges = [mitChallengeIds[0], mitChallengeIds[1], mitChallengeIds[2]];
      alice.solvedChallengesDetails = [
        { challengeId: mitChallengeIds[0], solvedAt: new Date('2024-01-15T10:30:00'), points: 100 },
        { challengeId: mitChallengeIds[1], solvedAt: new Date('2024-01-15T11:45:00'), points: 150 },
        { challengeId: mitChallengeIds[2], solvedAt: new Date('2024-01-15T14:20:00'), points: 200 }
      ];
      alice.points = 625;
      await alice.save();
    }

    if (bob) {
      bob.solvedChallenges = [mitChallengeIds[0], mitChallengeIds[3]];
      bob.solvedChallengesDetails = [
        { challengeId: mitChallengeIds[0], solvedAt: new Date('2024-01-16T09:00:00'), points: 100 },
        { challengeId: mitChallengeIds[3], solvedAt: new Date('2024-01-16T15:30:00'), points: 175 }
      ];
      bob.points = 405;
      await bob.save();
    }

    if (charlie) {
      charlie.solvedChallenges = [mitChallengeIds[0], mitChallengeIds[4]];
      charlie.solvedChallengesDetails = [
        { challengeId: mitChallengeIds[0], solvedAt: new Date('2024-01-17T08:00:00'), points: 100 },
        { challengeId: mitChallengeIds[4], solvedAt: new Date('2024-01-17T13:00:00'), points: 180 }
      ];
      charlie.points = 430;
      await charlie.save();
    }

    if (diana) {
      diana.solvedChallenges = [mitChallengeIds[1], mitChallengeIds[3]];
      diana.solvedChallengesDetails = [
        { challengeId: mitChallengeIds[1], solvedAt: new Date('2024-01-18T10:00:00'), points: 150 },
        { challengeId: mitChallengeIds[3], solvedAt: new Date('2024-01-18T16:00:00'), points: 175 }
      ];
      diana.points = 250;
      await diana.save();
    }

    const eve = createdUsers.find(u => u.username === 'eve');
    const frank = createdUsers.find(u => u.username === 'frank');
    const grace = createdUsers.find(u => u.username === 'grace');

    if (eve) {
      eve.solvedChallenges = [stanChallengeIds[0], stanChallengeIds[2], stanChallengeIds[4]];
      eve.solvedChallengesDetails = [
        { challengeId: stanChallengeIds[0], solvedAt: new Date('2024-01-15T11:00:00'), points: 120 },
        { challengeId: stanChallengeIds[2], solvedAt: new Date('2024-01-15T14:00:00'), points: 220 },
        { challengeId: stanChallengeIds[4], solvedAt: new Date('2024-01-15T17:00:00'), points: 200 }
      ];
      eve.points = 590;
      await eve.save();
    }

    if (frank) {
      frank.solvedChallenges = [stanChallengeIds[0], stanChallengeIds[3]];
      frank.solvedChallengesDetails = [
        { challengeId: stanChallengeIds[0], solvedAt: new Date('2024-01-16T09:30:00'), points: 120 },
        { challengeId: stanChallengeIds[3], solvedAt: new Date('2024-01-16T15:30:00'), points: 160 }
      ];
      frank.points = 380;
      await frank.save();
    }

    if (grace) {
      grace.solvedChallenges = [stanChallengeIds[1], stanChallengeIds[3]];
      grace.solvedChallengesDetails = [
        { challengeId: stanChallengeIds[1], solvedAt: new Date('2024-01-17T10:00:00'), points: 250 },
        { challengeId: stanChallengeIds[3], solvedAt: new Date('2024-01-17T14:00:00'), points: 160 }
      ];
      grace.points = 350;
      await grace.save();
    }

    console.log('\n--- Creating Competitions ---');
    const createdCompetitions = await Competition.insertMany(sampleCompetitions);
    console.log(`Created ${createdCompetitions.length} competitions`);

    console.log('\n✅ Mock data population complete!');
    console.log('\n=== Summary ===');
    console.log(`Universities: ${createdUniversities.length}`);
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Challenges: ${createdChallenges.length}`);
    console.log(`Competitions: ${createdCompetitions.length}`);
    console.log('\n=== Login Credentials ===');
    console.log('\nSuper Admin:');
    console.log('  Username: superadmin');
    console.log('  Password: admin123');
    console.log('\nMIT Admin:');
    console.log('  Username: mit_admin');
    console.log('  Password: admin123');
    console.log('  University Code: MIT123');
    console.log('\nMIT User (Alice):');
    console.log('  Username: alice');
    console.log('  Password: user123');
    console.log('  University Code: MIT123');
    console.log('  Points: 625');
    console.log('\nStanford Admin:');
    console.log('  Username: stan_admin');
    console.log('  Password: admin123');
    console.log('  University Code: STAN456');
    console.log('\nStanford User (Eve):');
    console.log('  Username: eve');
    console.log('  Password: user123');
    console.log('  University Code: STAN456');
    console.log('  Points: 590');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error populating mock data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

populateMockData();
