'use strict';

const chai = require('chai');
const sinonChai = require('sinon-chai');

process.env.NODE_ENV = 'test';

chai.use(sinonChai);

global.expect = chai.expect;
