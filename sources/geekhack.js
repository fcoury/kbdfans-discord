module.exports = (feed) => {
  return new Promise((resolve, reject) => {
    const forums = process.env.FORUMS && process.env.FORUMS.split(',');
    const webhook = process.env.WEBHOOK_URL;

    await Promise.all(feed.items.map(async item => {
      const { title, categories, link } = item;
      const category = categories[0];
      const topic = link.split('?topic=')[1].split('.')[0];
      if (!title.startsWith('Re:')) {
        resolve(title, link);
      }
    }));
  });
};
