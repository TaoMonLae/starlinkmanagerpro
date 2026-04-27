module.exports = {
  apps: [
    {
      name: "starlink-manager-pro-v5-api",
      cwd: "/var/www/starlink-manager-pro-v5/server",
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8112
      }
    }
  ]
};
