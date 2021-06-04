const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');

async function getFeed(url) {
  if (process.env.NODE_ENV === 'production') {
    return await axios(url);
  }

  const parts = url.split('/');
  const file = parts.length > 4
    ? parts[parts.length - 2]
    : 'products';

  return Promise.resolve({
    data: JSON.parse(fs.readFileSync(`./fixtures/${file}.json`)),
  });
}

async function getFeeds() {
  const feeds = [
    'https://kbdfans.com/collections/group-buy/products.json',
    'https://kbdfans.com/collections/restock/products.json',
    'https://kbdfans.com/collections/new-arrival/products.json',
    'https://kbdfans.com/products.json',
  ];

  const products = await Promise.all(feeds.map(async feed => {
    const { data } = await getFeed(feed);
    return data.products;
  }));

  return _(products)
    .flatten()
    .map(p => _.pick(p, 'id', 'title', 'handle', 'created_at', 'updated_at'))
    .uniqBy('id')
    .value();
}

module.exports = { getFeeds };
