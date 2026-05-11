// test-redis.js
const Redis = require('ioredis');
const client = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: 'h8dfhaMxdsFYjjRj'
});

client.on('connect', () => {
  console.log('Conectado ao Redis');
  client.quit();
});

client.on('error', (err) => {
  console.error('Erro no Redis:', err);
});