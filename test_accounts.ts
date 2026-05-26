import https from 'https';

const config = require('./caflou_config.json');

const url = 'https://app.caflou.cz/api/v1/accounts';
console.log('Fetching', url);

https.get(url, {
  headers: {
    'Authorization': `Bearer ${config.caflouToken}`,
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';
  console.log('Status:', res.statusCode);
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Data:', data));
}).on('error', console.error);
