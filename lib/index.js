'use strict';

const _ = require('lodash');
const { spawn, execSync } = require('child_process');
const fs = require('fs-extra');
const sudo = require('sudo');
const clc = require('cli-color');
const moduleExists = require('module-exists');
const debug = require('debug')('browl-util');

const utils = {};

utils.clean = (s) => s.replace(/[^0-9a-zA-Z]+/g, '-');

/* eslint-disable-next-line no-console */
utils.log = (msg) => console.log(clc.white.italic(msg));

/* eslint-disable-next-line no-console */
utils.errorLog = (msg) => console.log(clc.red.bold(msg));

utils.handleError = function (err) {
  utils.errorLog(err);
  return Promise.reject(err);
};

utils.handleSuccess = function (msg) {
  utils.log(msg);
  return Promise.resolve();
};

utils.callbackPromise = function (resolve, reject) {
  return (...args) => {
    const err = args.shift();
    if (err) {
      reject(err);
    } else {
      resolve.apply(null, args);
    }
  };
};

utils.run = function (asSudo, name, args, options, callback) {
  let promise;
  let cmd;
  let sudoOptions;

  if (typeof asSudo === 'string') {
    callback = options;
    options = args;
    args = name;
    name = asSudo;
    asSudo = false;
  }

  if (typeof args === 'function') {
    callback = args;
    args = [];
    options = {};
  }

  if (!Array.isArray(args)) {
    callback = options;
    options = args;
    args = [];
  }

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = utils.callbackPromise(resolve, reject);
    });
  }

  debug('run: command = %s, args = %j, sudo = %s', name, args, asSudo);

  if (asSudo) {
    if (_.isEmpty(options)) {
      sudoOptions = {};
    } else {
      sudoOptions = {
        spawnOptions: options
      };
    }

    cmd = sudo([name].concat(args), sudoOptions);
  } else {
    cmd = spawn(name, args, options);
  }

  cmd.stdout.on('data', utils.log);
  cmd.stderr.on('data', utils.errorLog);
  cmd.on('error', (err) => callback(err));

  cmd.on('close', (code) => {
    if (code === 0) {
      callback(null);
    } else {
      callback(new Error(name + ' exit with code: ' + code));
    }
  });

  return promise;
};

utils.sudo = function (...args) {
  args.unshift(true);

  return utils.run.apply(null, args);
};

utils.compile = function (file, callback) {
  let promise;

  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = utils.callbackPromise(resolve, reject);
    });
  }

  debug('compile: file = %s', file);
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      return callback(err);
    }

    const tmpl = _.template(data.toString());
    callback(null, tmpl);
  });

  return promise;
};

utils.render = function (file, data, callback) {
  let promise;

  if (typeof data === 'function') {
    callback = data;
    data = {};
  }

  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = utils.callbackPromise(resolve, reject);
    });
  }

  debug('render: file = %s, data = %j', file, data);
  utils.compile(file, (err, tmpl) => {
    if (err) {
      return callback(err);
    }

    return callback(null, tmpl(data));
  });

  return promise;
};

utils.copy = function (source, destination, callback) {
  debug('copy %s to %s', source, destination);

  let promise;

  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = utils.callbackPromise(resolve, reject);
    });
  }

  fs.copy(source, destination, callback);

  return promise;
};

utils.installModule = function (moduleName) {
  debug('installing %s module', moduleName);

  const index = moduleName.indexOf('/');
  const moduleNameToCheck = index > -1 ?
    moduleName.slice(index + 1) :
    moduleName;

  if (!moduleExists(moduleNameToCheck)) {
    utils.log(`Installing ${moduleName}...`);
    execSync(`npm install --no-save ${moduleName}`, {stdio:[0,1,2]});
  }
};

module.exports = utils;
