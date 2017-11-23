/* eslint-disable import/no-unresolved */

import Parameters from '@functions/pipeline/pipeline/parameters';

import faker from 'faker';

describe('Parameters', () => {
  const artifactName = faker.random.word();

  const attribute = faker.random.number();

  const artifacts = {
    [artifactName]: {
      ready: async () => true,
      attribute: () => attribute,
    },
  };

  const values = {
    keyA: {
      'Fn::GetParam': [artifactName, faker.random.word(), faker.random.word()],
    },
    keyB: faker.random.words(),
  };

  describe('#parameters', () => {
    const parameters = new Parameters(values, artifacts);

    it('returns the correct value', () => {
      expect(parameters.parameters).toEqual(values);
    });
  });

  describe('#artifacts', () => {
    const parameters = new Parameters(values, artifacts);

    it('returns the correct value', () => {
      expect(parameters.artifacts).toEqual(artifacts);
    });
  });

  describe('#toEntries', () => {
    test('TODO: Not implemented');
  });

  describe('#toObject', () => {
    describe('when values are valid', () => {
      const parameters = new Parameters(values, artifacts);

      it('correctly builds a map', () =>
        expect(parameters.toObject()).resolves.toEqual(expect.objectContaining({
          keyA: attribute,
          keyB: values.keyB,
        })));
    });

    describe('when Fn::GetParam is defined', () => {
      describe('when the artifact exists', () => {
        const parameters = new Parameters(values, artifacts);

        it('returns the correct value', () =>
          expect(parameters.toObject()).resolves.toEqual(expect.objectContaining({
            keyA: attribute,
          })));
      });

      describe('when the artifact does not exist', () => {
        const parameters = new Parameters(values, {});

        it('rejects with an error', () =>
          expect(parameters.toObject()).rejects.toEqual(expect.any(Error)));
      });
    });

    describe('when values contains an unrecognised Fn:: key', () => {
      const invalidValues = {
        key: {
          'Fn::UnrecognisedAtt': faker.random.number(),
        },
      };

      const parameters = new Parameters(invalidValues, artifacts);

      it('rejects with an error', () =>
        expect(parameters.toObject()).rejects.toEqual(expect.any(Error)));
    });
  });

  describe('#toOverrides', () => {
    const parameters = new Parameters(values, artifacts);

    it('correctly builds a Java Overrides string', async () => {
      const overrides = await parameters.toOverrides();
      const str = `-DkeyA="${attribute}" -DkeyB="${values.keyB}"`;
      expect(overrides).toEqual(expect.stringMatching(str));
    });
  });

  describe('#fetch', () => {
    describe('when the artifact, file and key exists', () => {
      const parameters = new Parameters(null, artifacts);

      it('fetches the correct value', () => {
        const params = [artifactName, faker.random.word(), faker.random.word()];
        return expect(parameters.fetch(...params)).resolves.toEqual(attribute);
      });
    });

    describe('when the artifact does not exist', () => {
      const notFoundArtifacts = {
        [artifactName]: {
          ready: async () => { throw new Error('TEST'); },
          attribute: () => attribute,
        },
      };

      const parameters = new Parameters(values, notFoundArtifacts);

      it('rejects with an error', () => {
        const params = [artifactName, null, null];
        return expect(parameters.fetch(...params)).rejects.toEqual(expect.any(Error));
      });
    });

    describe('when the file or key/value does not exist', () => {
      const invalidArtifactFile = {
        [artifactName]: {
          ready: async () => true,
          attribute: () => { throw new Error('TEST'); },
        },
      };

      const parameters = new Parameters(values, invalidArtifactFile);

      it('rejects with an error', () => {
        const params = [artifactName, null, null];
        return expect(parameters.fetch(...params)).rejects.toEqual(expect.any(Error));
      });
    });
  });
});
