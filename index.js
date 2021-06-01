const axios = require('axios');

require('dotenv').config();

const { connect, exec } = require('./db');

// 'https://kbdfans.myshopify.com/blogs/news.atom'

async function lastNotified(client) {
  return new Promise((resolve, reject) => {
    exec(client, 'SELECT last FROM notified').then(res => {
      if (!res.rows || !res.rows.length) {
        return resolve();
      }
      resolve(res.rows[0].last);
    }, reject).catch(reject);
  });
}

async function updateLast(client, last) {
  return exec(client, 'UPDATE notified SET last=$1', [last]);
}

async function setLast(client, last) {
  return exec(client, 'INSERT INTO notified VALUES ($1)', [last]);
}

async function checkTable(client) {
  const query = 'CREATE TABLE IF NOT EXISTS notified (last timestamp)';
  return exec(client, query);
}

async function sendNotifications(notifications) {
  const webhook = process.env.WEBHOOK_URL;
  return Promise.all(notifications.map(n => {
    const content = `<@&676500305730469898> ${n.title} - https://kbdfans.myshopify.com/products/${n.handle}`;
    console.log('content', content);
    if (!webhook) {
      return Promise.resolve();
    }
    return axios.post(webhook, { content });
  }));
}

async function run() {
  let client;

  try {
    console.log('Connecting', process.env.NODE_ENV);
    client = await connect();
    console.log('Fetching products');
    const feed = process.env.NODE_ENV === 'production'
      ? await axios('https://kbdfans.myshopify.com/products.json')
      : { data: JSON.parse(require('fs').readFileSync('./products.json', 'utf8')) };

    console.log('Checking for new products');
    await checkTable(client);
    const last = await lastNotified(client);
    if (!last) {
      const { created_at } = feed.data.products[0];
      sendNotifications([feed.data.products[0]]);
      await setLast(client, created_at);
    } else {
      const notifications = feed.data.products.filter(f => f.created_at > last);
      console.log('notifications.length', notifications.length);
      if (notifications.length > 0) {
        const { created_at } = notifications[0];
        console.log('sending notifications');
        await sendNotifications(notifications);
        console.log('updating last');
        await updateLast(client, created_at);
      } else {
        console.log('Nothing new');
      }
    }
  } catch (e) {
    console.log('error', e);
  }
  finally {
    if (client) {
      client.end();
    }
    setTimeout(() => run(), process.env.INTERVAL || 5 * 60000);
  }
};

run();
