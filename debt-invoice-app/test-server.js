const CryptoJS = require('crypto-js');
const https = require('http');

const ENCRYPTION_KEY = 'abcdefghijuklmno0123456789012345';

// Encrypt payload
const payload = {
  username: 'aziz',
  password: 'letmego01',
  language: 'ar'
};

const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), ENCRYPTION_KEY).toString();

console.log('Encrypted payload:', encrypted);

// Make request
const data = JSON.stringify({ payload: encrypted });

const options = {
  hostname: '82.26.94.240',
  port: 80,
  path: '/admin/api/index.php/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  timeout: 15000
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('\nStatus:', res.statusCode);
    console.log('Response:', body.substring(0, 1000));
    
    try {
      const json = JSON.parse(body);
      if (json.token) {
        console.log('\n✅ SUCCESS! Token received:', json.token.substring(0, 50) + '...');
      }
    } catch (e) {
      console.log('\n❌ Not a JSON response');
    }
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.on('timeout', () => { req.destroy(); console.log('Timeout'); });
req.write(data);
req.end();
