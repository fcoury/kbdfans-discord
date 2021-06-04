const { expect } = require('chai');

const { getFeeds } = require('./utils');

describe('getFeeds', async () => {
  it('fetches all products', async () => {
    const products = await getFeeds();
    expect(products.filter(p => p.title === '[Restock] D60 E-Coating Blue WK\/WKL\/HHKB Mechanical Keyboard DIY KIT').length).to.eql(1);
    expect(products.map(p => p.title)).to.include('[IC] ePBT Axolotls');
    expect(products.map(p => p.title)).to.include('[GB] Fully assembled Blade DZ60 Rev 3.0 Soldered 60% Keyboard');
  });
});
