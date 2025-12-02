// testHash.js
import bcrypt from 'bcrypt';

const plain = 'Admin123';
const hash = '$2b$10$7KkQ1XyZccF8DwQzIAVeEOhu4T3c0K9cB2YwIVGljL9lZZgwyUrhW'; // <- use the hash you saw in server logs

bcrypt.compare(plain, hash)
  .then(ok => {
    console.log('bcrypt.compare ->', ok);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
