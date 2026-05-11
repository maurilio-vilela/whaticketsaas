module.exports = [{
  script: 'dist/server.js',
  name: 'Dialogix-backend',
  exec_mode: 'fork',

  // A CHAVE FOI ADICIONADA AQUI:
  interpreter: '/root/.nvm/versions/node/v22.19.0/bin/node', // <-- COLE O SEU CAMINHO AQUI

//  cron_restart: '05 00 * * *',
  cron_restart: "0 */6 * * *",
  max_memory_restart: '1536M', // Reinicia em 8GB para evitar lentidão acima de 6GB
  node_args: '--max-old-space-size=8192 --experimental-specifier-resolution=node', // Limite de 8GB, otimizado para tamanho
  watch: false,
  env: {
    NODE_ENV: 'production',
  },
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  error_file: '/www/wwwroot/dialogix/logs/error.log',
  out_file: '/www/wwwroot/dialogix/logs/out.log',
}];