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

describe('utils', () => {
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
        expect(sudoStub).be.calledWith(['make', 'install'], {
          spawnOptions: {
            foo: 'bar'
          }
        });
        done();
      });
    });

    it('should accept name, args, options and callback arguments', (done) => {
      utils.run('make', ['install'], options, () => {
        expect(spawnStub).be.calledWith('make', ['install'], {
          foo: 'bar'
        });
        done();
      });
    });

    it('should accept sudo, name, args and callback arguments', (done) => {
      utils.run(true, 'make', ['install'], () => {
        expect(sudoStub).be.calledWith(['make', 'install'], {});
        done();
      });
    });

    it('should accept name, args and callback arguments', (done) => {
      utils.run('make', ['install'], () => {
        expect(spawnStub).be.calledWith('make', ['install'], {});
        done();
      });
    });

    it('should accept sudo name, options and callback arguments', (done) => {
      utils.run(true, 'make', options, () => {
        expect(sudoStub).be.calledWith(['make'], {
          spawnOptions: {
            foo: 'bar'
          }
        });
        done();
      });
    });

    it('should accept name, options and callback arguments', (done) => {
      utils.run('make', options, () => {
        expect(spawnStub).be.calledWith('make', [], {
          foo: 'bar'
        });
        done();
      });
    });

    it('should accept sudo, name and args arguments', () => {
      utils.run(true, 'make', ['install']);
      expect(sudoStub).be.calledWith(['make', 'install'], {});
    });

    it('should accept name and args arguments', () => {
      utils.run('make', ['install']);
      expect(spawnStub).be.calledWith('make', ['install'], {});
    });

    it('should accept sudo, name and options arguments', () => {
      utils.run(true, 'make', options);
      expect(sudoStub).be.calledWith(['make'], {
        spawnOptions: {
          foo: 'bar'
        }
      });
    });

    it('should accept name and options arguments', () => {
      utils.run('make', options);
      expect(spawnStub).be.calledWith('make', [], {
        foo: 'bar'
      });
    });

    it('should accept sudo, name and callback arguments', (done) => {
      utils.run(true, 'make', () => {
        expect(sudoStub).be.calledWith(['make'], {});
        done();
      });
    });

    it('should accept name and callback arguments', (done) => {
      utils.run('make', () => {
        expect(spawnStub).be.calledWith('make', [], {});
        done();
      });
    });

    it('should accept sudo and name arguments', (done) => {
      utils.run(true, 'make', () => {
        expect(sudoStub).be.calledWith(['make'], {});
        done();
      });
    });

    it('should name argument', (done) => {
      utils.run('make', () => {
        expect(spawnStub).be.calledWith('make', [], {});
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
      expect(utils.run).be.calledWith(true, 'arg1', 'arg2', 'arg3');
    });
  });
});
