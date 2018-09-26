'use strict';

const events = require('events');
const sinon = require('sinon');
const rewire = require('rewire');
const utils = rewire('../lib');

function fakeChildProcess() {
  return {
    stdout: new events.EventEmitter(),
    stderr: new events.EventEmitter(),
    on: () => null
  };
}

describe('browl-util', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#clean', () => {
    it('should clean string', () => {
      const expected = 'foo-bar-baz';
      const actual = utils.clean('foo/bar$/baz');
      expect(actual).be.equal(expected);
    });
  });

  describe('#callbackPromise', () => {
    it('should handle resolve', (done) => {
      const resolve = (arg1, arg2) => {
        expect(arg1).be.equal('foo');
        expect(arg2).be.equal('bar');
        done();
      };
      const callback = utils.callbackPromise(resolve, sinon.spy());

      callback(null, 'foo', 'bar');
    });

    it('should handle reject', (done) => {
      const reject = (err) => {
        expect(err).be.equal('error');
        done();
      };
      const callback = utils.callbackPromise(sinon.spy(), reject);

      callback('error');
    });
  });

  describe('#run', () => {
    let spawnStub;
    let sudoStub;
    let revert;
    let options;

    beforeEach(() => {
      options = { foo: 'bar' };

      const fakeSpawnProcess = fakeChildProcess();
      sandbox.stub(fakeSpawnProcess, 'on').withArgs('close').yields(0);
      spawnStub = sandbox.stub().returns(fakeSpawnProcess);

      const fakeSudoProcess = fakeChildProcess();
      sandbox.stub(fakeSudoProcess, 'on').withArgs('close').yields(0);
      sudoStub = sandbox.stub().returns(fakeSudoProcess);

      revert = utils.__set__({
        spawn: spawnStub,
        sudo: sudoStub
      });
    });

    afterEach(() => {
      revert();
    });

    it('should accept sudo, name, args, options and callback arguments', (done) => {
      utils.run(true, 'make', ['install'], options, () => {
        expect(sudoStub).calledWith(['make', 'install'], {
          spawnOptions: {
            foo: 'bar'
          }
        });
        done();
      });
    });

    it('should accept name, args, options and callback arguments', (done) => {
      utils.run('make', ['install'], options, () => {
        expect(spawnStub).calledWith('make', ['install'], {
          foo: 'bar'
        });
        done();
      });
    });

    it('should accept sudo, name, args and callback arguments', (done) => {
      utils.run(true, 'make', ['install'], () => {
        expect(sudoStub).calledWith(['make', 'install'], {});
        done();
      });
    });

    it('should accept name, args and callback arguments', (done) => {
      utils.run('make', ['install'], () => {
        expect(spawnStub).calledWith('make', ['install'], {});
        done();
      });
    });

    it('should accept sudo name, options and callback arguments', (done) => {
      utils.run(true, 'make', options, () => {
        expect(sudoStub).calledWith(['make'], {
          spawnOptions: {
            foo: 'bar'
          }
        });
        done();
      });
    });

    it('should accept name, options and callback arguments', (done) => {
      utils.run('make', options, () => {
        expect(spawnStub).calledWith('make', [], {
          foo: 'bar'
        });
        done();
      });
    });

    it('should accept sudo, name and args arguments', () => {
      utils.run(true, 'make', ['install']);
      expect(sudoStub).calledWith(['make', 'install'], {});
    });

    it('should accept name and args arguments', () => {
      utils.run('make', ['install']);
      expect(spawnStub).calledWith('make', ['install'], {});
    });

    it('should accept sudo, name and options arguments', () => {
      utils.run(true, 'make', options);
      expect(sudoStub).calledWith(['make'], {
        spawnOptions: {
          foo: 'bar'
        }
      });
    });

    it('should accept name and options arguments', () => {
      utils.run('make', options);
      expect(spawnStub).calledWith('make', [], {
        foo: 'bar'
      });
    });

    it('should accept sudo, name and callback arguments', (done) => {
      utils.run(true, 'make', () => {
        expect(sudoStub).calledWith(['make'], {});
        done();
      });
    });

    it('should accept name and callback arguments', (done) => {
      utils.run('make', () => {
        expect(spawnStub).calledWith('make', [], {});
        done();
      });
    });

    it('should accept sudo and name arguments', (done) => {
      utils.run(true, 'make', () => {
        expect(sudoStub).calledWith(['make'], {});
        done();
      });
    });

    it('should name argument', (done) => {
      utils.run('make', () => {
        expect(spawnStub).calledWith('make', [], {});
        done();
      });
    });
  });

  describe('#sudo', () => {
    beforeEach(() => {
      sandbox.stub(utils, 'run');
    });

    it('should call utils.run as sudo', () => {
      utils.sudo('arg1', 'arg2', 'arg3');
      expect(utils.run).calledWith(true, 'arg1', 'arg2', 'arg3');
    });
  });

  describe('#installModule', () => {
    let execSyncStub;
    let revert;

    beforeEach(() => {
      execSyncStub = sandbox.stub();

      revert = utils.__set__({
        execSync: execSyncStub
      });
    });

    afterEach(() => {
      revert();
    });

    it('should install module', () => {
      utils.installModule('sinon');
      expect(execSyncStub).calledWith('npm install sinon', { stdio: [0, 1, 2] });
    });

    it('should install module in specific directory', () => {
      utils.installModule('sinon', { cwd: '/path/to/dir' });
      expect(execSyncStub).calledWith('npm install --prefix /path/to/dir sinon', { stdio: [0, 1, 2] });
    });

    it('should install module globally', () => {
      utils.installModule('sinon', { global: true });
      expect(execSyncStub).calledWith('npm install --global sinon', { stdio: [0, 1, 2] });
    });
  });
});
