module.exports = {
  apps: [
    {
      name: 'artifice-stream',
      script: 'scripts/stream_orders.py',
      interpreter: 'python3',
      cwd: '/Users/eshumanohare/Documents/eth-online-2025/Artifice',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
