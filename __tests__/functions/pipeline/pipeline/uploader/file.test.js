/* eslint-disable import/no-unresolved */

import File from '@functions/pipeline/pipeline/uploader/file';

import AWS from 'aws-sdk-mock';
import faker from 'faker';

describe('File', () => {
  const data = JSON.stringify({ [faker.random.uuid()]: faker.random.number() });

  const artifact = {
    ready: async () => true,
    get: async () => new Buffer(data),
  };

  const filename = faker.system.fileName();

  describe('#new', () => {
    it('sets properties correctly', () => {
      const file = new File(artifact, filename);
      expect(file.extname).toMatch(/\.[a-z0-9]+$/);
      expect(file.artifact).toEqual(artifact);
      expect(file.filename).toEqual(filename);
      expect(file.key).toMatch(/^[-a-zA-Z0-9]+$/);
      expect(file.remote).toEqual(expect.objectContaining({
        Bucket: expect.any(String),
        Key: `${file.key}${file.extname}`,
      }));
    });
  });

  describe('#signedUrl', () => {
    const url = faker.internet.url();

    describe('when the url can be signed', () => {
      beforeEach(() => {
        AWS.mock('S3', 'getSignedUrl', (op, params, cb) => {
          expect(op).toEqual('getObject');
          expect(params).toEqual(expect.objectContaining({
            Key: expect.any(String),
            Bucket: expect.any(String),
          }));
          process.nextTick(() => { cb(null, url); });
        });
      });

      afterEach(() => {
        AWS.restore('S3', 'getSignedUrl');
      });

      it('returns the correct url', () => {
        const file = new File(artifact, filename);
        return expect(file.signedUrl()).resolves.toEqual(url);
      });
    });

    describe('when the url fails to be signed', () => {
      beforeEach(() => {
        AWS.mock('S3', 'getSignedUrl', (op, params, cb) => {
          process.nextTick(() => { cb(new Error('TEST')); });
        });
      });

      afterEach(() => {
        AWS.restore('S3', 'getSignedUrl');
      });

      it('rejects with an error', () => {
        const file = new File(artifact, filename);
        return expect(file.signedUrl()).rejects.toEqual(expect.any(Error));
      });
    });
  });

  describe('#read', () => {
    describe('when the file inside the artifact exists', () => {
      it('returns the correct data', () => {
        const file = new File(artifact, filename);
        return expect(file.read()).resolves.toEqual(new Buffer(data));
      });
    });

    describe('when the file inside the artifact does not exist', () => {
      const invalidArtifactFile = {
        ready: async () => true,
        get: async () => { throw new Error('TEST'); },
      };

      it('rejects with an error', () => {
        const file = new File(invalidArtifactFile, filename);
        return expect(file.read()).rejects.toEqual(expect.any(Error));
      });
    });
  });

  describe('#upload', () => {
    describe('when the file is successfully uploaded', () => {
      beforeEach(() => {
        AWS.mock('S3', 'putObject', (params, cb) => {
          expect(params.Body).toEqual(new Buffer(data));
          process.nextTick(() => { cb(null, true); });
        });
      });

      afterEach(() => {
        AWS.restore('S3', 'putObject');
      });

      it('correctly uploads a file', () => {
        const file = new File(artifact, filename);
        return expect(file.upload()).resolves.toEqual(true);
      });
    });

    describe('when the file fails to upload', () => {
      beforeEach(() => {
        AWS.mock('S3', 'putObject', (params, cb) => {
          process.nextTick(() => { cb(new Error('TEST')); });
        });
      });

      afterEach(() => {
        AWS.restore('S3', 'putObject');
      });

      it('rejects with an error', () => {
        const file = new File(artifact, filename);
        return expect(file.upload()).rejects.toEqual(expect.any(Error));
      });
    });
  });
});
