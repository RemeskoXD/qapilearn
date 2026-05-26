import https from 'https';

const pUrl = 'https://documenter.getpostman.com/api/collections/4786951/RWMFrTQC';

https.get(pUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.slice(0, 500));
  });
});
