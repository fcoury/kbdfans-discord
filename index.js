const moment = require('moment');
const axios = require('axios');

require('dotenv').config();

const { connect, exec } = require('./db');
const { getFeeds } = require('./utils');

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
    const products = await getFeeds();
    console.log('Got', products.length, 'products...');

    await checkTable(client);
    console.log('Checking for new products');
    const last = await lastNotified(client);
    console.log('Last date', last);
    console.log(products.map(f => moment(f.updated_at)));
    const notifications = last
      ? products.filter(f => moment(f.updated_at).isAfter(last))
      : products;
    console.log('notifications.length', notifications.length);
    if (notifications.length > 0) {
      const { updated_at } = notifications[0];
      console.log('sending notifications');
      await sendNotifications(notifications);
      console.log('updating last', updated_at);
      if (last) {
        await updateLast(client, updated_at);
      } else {
        await setLast(client, updated_at);
      }
    } else {
      console.log('Nothing new');
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
