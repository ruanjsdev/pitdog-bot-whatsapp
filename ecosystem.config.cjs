module.exports = {
  apps: [
    {
      name: 'pits-dog-whatsapp-bot',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
