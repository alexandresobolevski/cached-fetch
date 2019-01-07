const fetch = require('node-fetch');
const assert = require('assert');
const sinon = require('sinon');
const { makeCachedFetch, cleanCache } = require('./lib');


const testUrl = 'https://api.thedogapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1';
let stubbedFetch;
let realResponse;
let cachedFetch;

describe('saves to cache request', () => {
  before(async() => {
    realResponse = await fetch(testUrl);
    stubbedFetch = sinon.stub().returns(Promise.resolve(realResponse));
    stubbedFetch.Response = fetch.Response;
    cachedFetch = makeCachedFetch(stubbedFetch);
  });

  after(async () => {
    await cleanCache();
  });

  it('uses cache if it exists', async () => {
    // request #1 should hit the real api
    const response = await cachedFetch(testUrl);
    const body = await response.json();
    // request #2 should access the cache
    const response2 = await cachedFetch(testUrl);
    const body2 = await response2.json();
    // TODO: do actual verification here
    assert.deepStrictEqual(body, body2, 'both body requests are the same');
    assert.equal(stubbedFetch.calledOnce, true, 'fetch was called only once');
  });
});
