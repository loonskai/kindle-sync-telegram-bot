#!/usr/bin/env node

if (process.env.NODE_ENV !== 'development') {
  throw new Error('Nodemon should be used only in development environment');
}

const path = require('path');
const nodemon = require('nodemon');
const ngrok = require('ngrok');

(async () => {
  try {
    const url = await ngrok.connect({
      proto: 'http',
      addr: process.env.PORT,
    });
    console.log(`Ngrok tunnel opened at ${url}`);
    nodemon(`-x 'NGROK_URL=${url} node' ${path.join(process.cwd(), 'index.js')}`);
  } catch (err) {
    console.error('Error opening ngrok tunnel', err);
    process.exit(1);
  }
})();

nodemon.on('start', () => {
  console.log('App has started');
}).on('quit', () => {
  console.log('App has quit');
}).on('restart', (files) => {
  console.log('App restarted due to: ', files);
});
