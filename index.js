const fs = require('fs');

const fetch = require('node-fetch');
const series = require('async/series');

const locations = require('./locations');
const maps = require('./maps');
const sizes = require('./sizes');

const promises = [];

const writer = fs.createWriteStream('README.md');

writer.write('# Topo Backgrounds\n');

locations.forEach(({ latitude, longitude, zoom, name: locationName, slug: locationSlug }) => {
  writer.write(`# ${locationName}\n`);

  maps.forEach(({ id: map, name: mapName, slug: mapSlug }) => {
    let mapLine = `* ${mapName} `;
    const mapLinks = [];

    sizes.forEach(({width, height, name: sizeName}) => {
      const params = new URLSearchParams({ width, height, zoom, map, latitude, longitude });
      const url = `https://at-background.herokuapp.com/image?${params}`;
      const name = `${locationSlug}-${mapSlug}-${sizeName}`;
      const path = `images/${name}.png`;

      mapLinks.push(`[${sizeName}](${path})`);

      promises.push((cb) => {
        if (fs.existsSync(path)) {
          console.log(`Skipping ${name} - file exists.`);
          cb(null);
          return;
        }

        console.log(`Fetching ${name}`);

        fetch(url)
          .then(resp => {
            const dest = fs.createWriteStream(path);
            resp.body.pipe(dest);
          })
          .then(text => cb(null, text))
          .catch(err => cb(err));
      });
    });

    mapLine += mapLinks.join(' - ') + '\n';
    writer.write(mapLine);
  });
});

series(promises)
  .then(results => console.log('done'))
  .catch(err => console.log(err))
