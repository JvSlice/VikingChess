# Viking Chess

A two-player, same-device Fetlar Hnefatafl game built with plain HTML, CSS, and JavaScript. All game assets use relative paths, so it can be served locally or hosted from a GitHub Pages project path.

For local play, serve this directory with any static file server and open `index.html`. The ES module imports do not work when opened directly with a `file:` URL.

The rule engine is in `rules.js`; the board and interaction layer are in `game.js`. Focused rules checks run with:

```sh
node --experimental-default-type=module rules.test.js
```

Rules reference: [current English Fetlar rules](https://aagenielsen.dk/fetlar_rules_en.php) and [2018 visual guide](https://aagenielsen.dk/fetlar_rules2018visual.pdf). If the sources differ, this checkpoint follows the current English rules page. Its general draw clause for positions where a game cannot be ended is not automatically adjudicated; threefold repetition is detected.
