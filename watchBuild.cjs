#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const watch = require('watch');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const curDir = process.cwd();

if (process.argv.length < 3) {
  console.log('please specify target path');
  console.log('for example npm run watch:buildto ../react-geo/node_modules/@terrestris/react-util/');
  process.exit(0);
}

const sourcePath = path.join(curDir, 'src');
const distPath = path.join(curDir, 'dist');
const targetSourcePath = path.join(curDir, process.argv[2], 'src');
const targetDistPath = path.join(curDir, process.argv[2], 'dist');

if (!fs.existsSync(targetSourcePath) || !fs.existsSync(targetDistPath) ) {
  throw new Error('target does not exist');
}

async function buildAndCopy() {
  console.log('run build');

  try {
    const { stdout, stderr} = await exec('npm run build');
    console.log(stdout);
    console.log(stderr);

    console.log('copy dist / src');
    await fs.copy(distPath, targetDistPath);
    await fs.copy(sourcePath, targetSourcePath);

    console.log('done');
  } catch (error) {
    console.log('error');
    const { stdout, stderr } = error;
    console.log(stdout);
    console.log(stderr);
  }
}

buildAndCopy();

let timeout;

function throttle(callback, time) {
  if (!timeout) {
    timeout = setTimeout(function () {
      timeout = null;
      callback();
    }, time);
  }
}

watch.watchTree(sourcePath, function (f, curr, prev) {
  if (typeof f === 'object') {
    console.log('watching');
  } else {
    throttle(buildAndCopy, 1000);
  }
});
