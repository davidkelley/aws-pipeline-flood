/* eslint-disable import/no-unresolved */

import Uploader from '@functions/pipeline/pipeline/uploader';

import File from '@functions/pipeline/pipeline/uploader/file';

import faker from 'faker';

describe('Uploader', () => {
  const artifactName = faker.random.word();

  const artifacts = {
    [artifactName]: {},
  };

  const files = [
    `${artifactName}::${faker.system.fileName()}`,
    `${artifactName}::${faker.system.fileName()}`,
    `${artifactName}::${faker.system.fileName()}`,
  ];

  describe('#references', () => {
    it('should return the correct value', () => {
      const uploader = new Uploader(files, artifacts);
      expect(uploader.references).toEqual(files);
    });
  });

  describe('#artifacts', () => {
    it('should return the correct value', () => {
      const uploader = new Uploader(files, artifacts);
      expect(uploader.artifacts).toEqual(artifacts);
    });
  });

  describe('#files', () => {
    describe('when the artifact exists', () => {
      it('should return the correct value', () => {
        const uploader = new Uploader(files, artifacts);
        expect(uploader.files()).toEqual(expect.arrayContaining([
          expect.any(File),
        ]));
      });
    });

    describe('when the artifact does not exist', () => {
      it('should throw an error', () => {
        const uploader = new Uploader(files, {});
        expect(() => { uploader.files(); }).toThrow(Error);
      });
    });
  });

  describe('#urls', () => {
    describe('when all files can be uploaded', () => {
      const uploader = new Uploader(files, artifacts);

      const url = faker.internet.url();

      beforeEach(() => {
        jest.spyOn(uploader, 'files').mockImplementation(() => (
          [
            {
              upload: async () => true,
              signedUrl: async () => url,
            },
          ]
        ));
      });

      it('should return the correct value', () =>
        expect(uploader.urls()).resolves.toEqual(expect.arrayContaining([
          url,
        ])));
    });
  });
});
