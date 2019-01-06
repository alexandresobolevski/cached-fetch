const util = require('util');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const filenamify = require('filenamify');
const rimraf = require('rimraf');

const removeDir = util.promisify(rimraf);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const asPrettyJSON = obj => JSON.stringify(obj, null, 2);

// TODO: should tunable
const directory = '.fetch-cache';

function writeString(filename, string) {
  return writeFile(filename, string, 'utf8');
}

function loadString(filename) {
  return readFile(filename, 'utf8');
}

function ensureDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

// TODO: enable user to pass their own cache into the factory
// to use instead of this
const fileCache = {
  get: async(key) => JSON.parse(await loadString(key)),
  set: async(key, response) => {
    const stringToWrite = asPrettyJSON(response);
    await writeString(key, stringToWrite);
  }
}

// TODO: pass arguments here, such as TTL and directory name
function makeCachedFetch() {
  return async function fileCachedFetch(url, options) {
    // check if directory exists, create if not
    ensureDirectory(directory);
    // url is used as file name, stringified request options are
    // keys inside that file
    const file = path.join(directory, filenamify(`${url}.json`));
    const fileExists = fs.existsSync(file);
    let existingCache = {};
    if (fileExists) {
      existingCache = await fileCache.get(file);
    }
    const cacheKey = JSON.stringify(options) || '';
    // if we have the cached response already, re-build a response
    // object and return it
    // TODO: implement TTL
    if (existingCache[cacheKey]) {
      // console.log('getting from cache');
      return new fetch.Response(
        JSON.stringify(existingCache[cacheKey].body),
        // TODO: headers too
        { status: existingCache[cacheKey].status }
      );
    }
    // console.log('fetching api');
    const response = await fetch(url, options);
    const untouchedResponse = response.clone();
    const json = await response.json();
    // TODO: headers too
    const cacheValue = { body: json, status: response.status };
    existingCache[cacheKey] = cacheValue;
    await fileCache.set(file, existingCache);
    return untouchedResponse;
  }
}

async function cleanCache() {
  await removeDir(directory);
}

module.exports = { makeCachedFetch, cleanCache };
