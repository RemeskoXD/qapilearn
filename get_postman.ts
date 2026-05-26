import fs from 'fs';
import https from 'https';

https.get('https://documenter.getpostman.com/view/4786951/RWMFrTQC', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('postman.html', data);
    console.log('Done');
  });
});
