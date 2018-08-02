const { Client } = require('pg');

async function connect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  return new Promise((resolve, reject) => {
    client.connect((err, _) => {
      if (err) { return reject(err); }
      resolve(client);
    });
  });
}

async function exec(client, sql, values=[]) {
  return new Promise((resolve, reject) => {
    client.query(sql, values, (err, result) => {
      if (err) { return reject(err); }
      resolve(result);
    });
  });
}

module.exports = { connect, exec };
