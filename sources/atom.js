const FeedParser = require('feedparser');
const request = require('request');

module.exports = (feed) => {
  return new Promise((resolve, reject) => {
    var req = request(feed);
    var feedparser = new FeedParser([]);

    req.on('response', function(res) {
      const stream = this;
      stream.pipe(feedparser);
    });

    req.on('error', function(err) {
      reject(err);
    });

    feedparser.on('readable', function () {
      const stream = this;
      const meta = this.meta;
      var item;

      const items = [];
      while (item = stream.read()) {
        items.append([ item.title, item.link ]);
      }
      resolve(items);
    });

    feedparser.on('error', function(err) {
      reject(err);
    });
  });
};
