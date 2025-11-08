module.exports = {
  apps: [{
    name: 'cyber-citadel-backend',
    script: './backend/dist/index.js',
    cwd: './backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
