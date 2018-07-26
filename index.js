#! /usr/bin/env node
import puppeteer from 'puppeteer';
import write from 'write';
import del from 'delete';
import frontifyApi from '@frontify/frontify-api';
import parseArgs from 'minimist';
import path from 'path';

const args = parseArgs(process.argv.slice(2));

const access_token = process.env.token || args.token;
const project = process.env.project || args.project;
const baseUrl = process.env.baseUrl || args.baseUrl;
let localhost = args.input || args.localhost || 'http://localhost:9001/iframe.html';
let errors = false;

if (args.input) {
  localhost = `file://${path.join(process.cwd(), localhost)}`;
}

const createVariation = (name, html, css) => {
  const obj = {
    name,
    'assets': {}
  };

  if (html) {
    obj.assets.html = [html];
  }

  if (css) {
    obj.assets.css = [css];
  }

  return obj;
};

// set the type [atom,molecules,organisms]
const createJson = (name, variations) => {
  const primary = Object.keys(variations).filter((key) => variations[key].primary && variations[key]);
  const assets = variations[primary].assets;
  const type = variations[primary].type;

  delete variations[primary];

  return {
    name,
    description: '',
    type,
    stability: 'stable',
    variations,
    assets
  }
};

const getHTML = async (browser, url) => {
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });

  const html = await page.$eval('#root div', e => e.innerHTML);
  const type = await page.$eval('#root div', e => e.getAttribute('type'));

  const isType = type && type === 'atom' || type === 'molecules' || type === 'organisms' || type === null;

  if (!isType) {
    errors = 'Pattern type does not follow the atomic principles.';
  }

  return {
    html,
    type
  };
};

const getStorybook = async (browser, url) => {
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: 'networkidle2'
  });

  return page.evaluate('__STORYBOOK_CLIENT_API__.getStorybook()');
};

const getPage = async (browser, kind, name) => {
  const url = `${localhost}?selectedKind=${kind}&selectedStory=${name}`;

  return await getHTML(browser, url);
};

const getStories = async (browser, components) => {
  return Promise.all(components.map((component) => {
    const kind = component.kind;

    return Promise.all(
      component.stories.map(async (story) => {
        const name = story.name;
        return {
          [name]: await getPage(browser, kind, name)
        };
      })
    ).then((all) => {
      return {[kind]: all};
    });
  }));
};

const underscoreName = (name) => {
  const value = name.toLocaleLowerCase().replace(/ /g, '_');

  return value;
};

const getURL = (folder, file, type) => {
  return `./patterns/${folder}/${underscoreName(file)}.${type}`;
};

const writeFile = async (folder, file, contents, type = 'html') => {
  const url = getURL(folder, file, type);

  write.sync(url, contents);
};

const deleteFiles = async => {
  del.sync(['./patterns']);
};

const sendToFrontify = () => {
  return frontifyApi.syncPatterns({access_token, project, baseUrl}, ['patterns/**/*.json']).catch(function(err) {
      console.error(err);
  });
};

(async () => {
  const browser = await puppeteer.launch().catch((e) => Error(`error: ${e}`));
  const components = await getStorybook(browser, localhost).catch((e) => Error(`error: ${e}`));
  const stories = await getStories(browser, components);
  let success = !errors;

  if (success) {
    stories.forEach((comp) => {
      Object.keys(comp).forEach((folder) => {
        let variations = {};
        comp[folder].forEach((v, key) => {
          const file = Object.keys(comp[folder][key]);
          const type = v[file].type;

          writeFile(folder, file[0], v[file].html).catch(e => console.log(`Error: ${e}`));
          const variation = createVariation(`${folder} - ${file[0]}`, getURL(folder, file[0], 'html'));

          if (key === 0) {
            variation.primary = true;
            variation.type = type;
          }

          variations = {...variations, [underscoreName(file[0])]: variation};
        });
        const jsonFile = createJson(folder, variations);
        writeFile(folder, folder, JSON.stringify(jsonFile), 'json');
      });
    });
    sendToFrontify().then(() => deleteFiles());
  } else {
    console.log(errors);
  };

  await browser.close();
})();
