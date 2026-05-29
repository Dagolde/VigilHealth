/**
 * PM2 Ecosystem Configuration for CloudPanel
 *
 * Usage:
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *
 * Commands:
 *   pm2 status          - Check app status
 *   pm2 logs vigilhealth - View logs
 *   pm2 restart vigilhealth - Restart app
 *   pm2 reload vigilhealth  - Zero-downtime reload
 */

module.exports = {
  apps: [
    {
      name: 'vigilhealth',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/path/to/vigilhealth', // Update to actual path

      // Process management
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      max_memory_restart: '512M',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DEPLOYMENT_PHASE: 'phase2',
      },

      // Logging
      log_file: '/var/log/pm2/vigilhealth.log',
      out_file: '/var/log/pm2/vigilhealth-out.log',
      error_file: '/var/log/pm2/vigilhealth-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart policy
      autorestart: true,
      watch: false, // Don't watch files in production
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  // Deployment configuration (optional — for pm2 deploy)
  deploy: {
    production: {
      user: 'vigilhealth',
      host: 'your-cloudpanel-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/vigilhealth.git',
      path: '/var/www/vigilhealth',
      'pre-deploy-local': '',
      'post-deploy':
        'npm ci && npm run build && pm2 reload deploy/ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
