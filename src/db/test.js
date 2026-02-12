require('dotenv').config();
const pool = require('./index');

pool.query('SELECT 1')
  .then(() => {
    console.log('DB CONNECTED');
    process.exit(0);
  })
  .catch(err => {
    console.error('DB ERROR:', err.message);
    process.exit(1);
  });
