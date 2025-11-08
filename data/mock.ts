import { Challenge, ChallengeCategory, User, LeaderboardEntry, Announcement } from '../types';

export const challenges: Challenge[] = [
  {
    id: 'web-101',
    title: 'Cookie Monster',
    category: ChallengeCategory.WEB,
    points: 100,
    solves: 152,
    author: 'Admin',
    description: 'I made a cool website, but the secret is hidden in the cookies. Can you find it?',
    hints: [
        { text: 'Check your browser\'s developer tools.', cost: 10 },
        { text: 'Cookies are often used for session management.', cost: 20 },
    ],
    flag: 'flag{c00k1e_m4st3r_y0u_4r3}',
  },
  {
    id: 'crypto-201',
    title: 'Caesar\'s Salad',
    category: ChallengeCategory.CRYPTO,
    points: 150,
    solves: 98,
    author: 'CryptoGod',
    description: 'A classic cipher with a twist. The message is `GURDHVUSHDUG`. Can you decode it?',
    hints: [
        { text: 'This is a simple substitution cipher.', cost: 15 },
        { text: 'The key is a number between 1 and 25.', cost: 25 }
    ],
    flag: 'flag{therotationshift}',
  },
  {
    id: 'rev-301',
    title: 'License Key',
    category: ChallengeCategory.REVERSING,
    points: 300,
    solves: 45,
    author: 'Dr. Disassemble',
    description: 'This program requires a license key to unlock its full potential. Find the correct key to get the flag.',
    files: [{ name: 'license_checker', url: '#' }],
    flag: 'flag{rev_3ng1n33r_is_fun}',
  },
  {
    id: 'pwn-401',
    title: 'Buffer Overflow',
    category: ChallengeCategory.PWN,
    points: 400,
    solves: 23,
    author: 'StackSmasher',
    description: 'A vulnerable server is running. Can you overflow its buffer and gain control?',
    hints: [
        { text: 'Look for unsafe C functions like `gets()`.', cost: 40 },
        { text: 'You might need to craft a specific payload to overwrite the return address.', cost: 50 }
    ],
    flag: 'flag{st4ck_sm4sh3d_f0r_fun_4nd_pr0f1t}',
  },
  {
    id: 'misc-150',
    title: 'QR Fun',
    category: ChallengeCategory.MISC,
    points: 150,
    solves: 110,
    author: 'PixelPuzzler',
    description: 'This QR code seems to lead somewhere interesting. Scan it to find out!',
    files: [{ name: 'puzzle.png', url: 'https://picsum.photos/seed/qr/200' }],
    flag: 'flag{qr_c0d3s_4r3_c00l}',
  },
  {
    id: 'forensics-250',
    title: 'Hidden Message',
    category: ChallengeCategory.FORENSICS,
    points: 250,
    solves: 76,
    author: 'DataDetective',
    description: 'There is a message hidden within this image file. Use steganography tools to extract it.',
    files: [{ name: 'image.png', url: 'https://picsum.photos/seed/forensics/400' }],
    hints: [{ text: 'Steganography tools can hide data in plain sight.', cost: 25 }],
    flag: 'flag{st3g4n0gr4phy_r0cks}',
  },
   {
    id: 'web-202',
    title: 'SQL Injection',
    category: ChallengeCategory.WEB,
    points: 250,
    solves: 88,
    author: 'DBAdmin',
    description: 'A login form is poorly implemented. Can you bypass the authentication using SQL injection?',
    hints: [{ text: 'Try common SQL injection payloads like `\' OR 1=1 --`.', cost: 30 }],
    flag: 'flag{sqli_is_a_classic_vuln}',
  },
  {
    id: 'crypto-350',
    title: 'RSA Basics',
    category: ChallengeCategory.CRYPTO,
    points: 350,
    solves: 31,
    author: 'PrimeMaster',
    description: 'We intercepted a public key (e, n) and a ciphertext (c). Can you find the original message?',
    hints: [{ text: 'You might need to factor `n` to find the private key `d`.', cost: 50 }],
    flag: 'flag{rsa_is_not_so_hard}',
  },
];

export const initialUser: User = {
  id: 'user-5',
  name: 'NoobMaster69',
  rank: 5,
  points: 400,
  solvedChallenges: ['web-101', 'crypto-201', 'misc-150'],
  unlockedHints: [],
};

const allUsers: User[] = [
  { id: 'user-1', name: 'Alice', points: 1500, rank: 1, solvedChallenges: ['web-101', 'crypto-201', 'rev-301', 'pwn-401', 'misc-150'], unlockedHints: [] },
  { id: 'user-2', name: 'Bob', points: 1250, rank: 2, solvedChallenges: ['web-101', 'crypto-201', 'rev-301', 'misc-150'], unlockedHints: [] },
  { id: 'user-3', name: 'Charlie', points: 950, rank: 3, solvedChallenges: ['web-101', 'crypto-201', 'rev-301'], unlockedHints: [] },
  { id: 'user-4', name: 'Dave', points: 700, rank: 4, solvedChallenges: ['web-101', 'crypto-201', 'misc-150'], unlockedHints: [] },
  initialUser,
  { id: 'user-6', name: 'Eve', points: 300, rank: 6, solvedChallenges: ['web-101', 'crypto-201'], unlockedHints: [] },
  { id: 'user-7', name: 'Frank', points: 250, rank: 7, solvedChallenges: ['crypto-201', 'misc-150'], unlockedHints: [] },
  { id: 'user-8', name: 'Grace', points: 150, rank: 8, solvedChallenges: ['misc-150'], unlockedHints: [] },
  { id: 'user-9', name: 'Heidi', points: 100, rank: 9, solvedChallenges: ['web-101'], unlockedHints: [] },
  { id: 'user-10', name: 'Ivan', points: 100, rank: 10, solvedChallenges: ['web-101'], unlockedHints: [] },
];

export const users = allUsers;

export const leaderboard: LeaderboardEntry[] = allUsers.map(({ rank, name, points }) => ({ rank, name, points})).sort((a,b) => a.rank - b.rank);


export const initialAnnouncements: Announcement[] = [
    {
        id: '1',
        title: 'Welcome to Cyber خانة CTF!',
        content: 'The competition is now live. Good luck to all participants! Remember to check the rules and have fun.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'success',
    },
    {
        id: '2',
        title: 'New Challenge Released: "RSA Basics"',
        content: 'A new Cryptography challenge has been added. Test your skills and grab those points!',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        type: 'info',
    }
];