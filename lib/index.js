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

function makeCachedFetch() {
  return async function fileCachedFetch(url, options) {
    // TODO: should be an argument

    ensureDirectory(directory);
    const file = path.join(directory, filenamify(`${url}.json`));
    const fileExists = fs.existsSync(file);
    let existingCache = {};
    if (fileExists) {
      existingCache = JSON.parse(await loadString(file));
    }
    const cacheKey = JSON.stringify(options) || '';
    if (existingCache[cacheKey]) {
      console.log('getting from cache');
      return new fetch.Response(
        JSON.stringify(existingCache[cacheKey].body),
        { status: existingCache[cacheKey].status }
      );
    }
    console.log('fetching api');
    const response = await fetch(url, options);
    const untouchedResponse = response.clone();
    const json = await response.json();
    const cacheValue = { body: json, status: response.status };
    existingCache[cacheKey] = cacheValue;
    const stringToWrite = asPrettyJSON(existingCache);
    await writeString(file, stringToWrite);
    return untouchedResponse;
  }
}

async function cleanCache() {
  await removeDir(directory);
}

module.exports = { makeCachedFetch, cleanCache };
