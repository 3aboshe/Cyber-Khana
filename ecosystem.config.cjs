module.exports = {
  apps: [{
    name: 'cyber-khana-backend',
    script: './backend/start.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    env_file: './backend/.env'
  }]
};
