module.exports = {
  apps: [
    {
      name: 'myup-api',
      script: './src/server.js',
      instances: 'max', // Server yadrolari soniga qarab klaster rejimida ishlaydi (avtomatik masshtablanadi)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
