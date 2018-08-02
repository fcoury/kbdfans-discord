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
  const query = 'CREATE TABLE IF NOT EXISTS notified (last bigint)';
  return exec(client, query);
}

async function sendNotifications(notifications) {
  const webhook = process.env.WEBHOOK_URL;
  return Promise.all(notifications.map(n => {
    const content = `${n.title} - https://kbdfans.cn/products/${n.handle}`;
    console.log('content', content);
    axios.post(webhook, { content });
  }));
}

async function run() {
  const client = await connect();
  const feed = await axios('https://kbdfans.cn/products.json');

  await checkTable(client);

  try {
    const last = await lastNotified(client);
    if (!last) {
      const id = feed.data.products[0].id;
      console.log('id', id);
      sendNotifications([feed.data.products[0]]);
      await setLast(client, id);
    } else {
      const notifications = feed.data.products.filter(f => f.id > last);
      if (notifications.length > 0) {
        sendNotifications(notifications);
      } else {
        console.log('Nothing new');
      }
    }
  } catch (e) {
    console.log('error', e);
  }
  finally {
    client.end();
    setTimeout(() => run(), process.env.INTERVAL || 5 * 60000);
  }
};

run();
