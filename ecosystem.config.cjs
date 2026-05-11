/**
 * PM2 process file for the DigitalOcean droplet.
 *
 * Usage on the server (after `npm ci && npm run build`):
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup        # follow the printed instructions to enable on boot
 */
module.exports = {
  apps: [
    {
      name: "visa-guide",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
