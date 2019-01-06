const fetch = require('node-fetch');
const { makeCachedFetch, cleanCache } = require('./lib');

const cachedFetch = makeCachedFetch();

describe('saves to cache request', () => {
  after(async () => {
    await cleanCache();
  });

  it('sets the key the requested path', async () => {
    const response = await cachedFetch('https://api.thedogapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1');
    const body = await response.json();
    const response2 = await cachedFetch('https://api.thedogapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1');
    const body2 = await response2.json();
  });
});
