/* eslint-disable import/no-unresolved */

import validate from '@functions/pipeline/pipeline/validate';

import faker from 'faker';

describe('#validate', () => {
  describe('when a schema is valid', () => {
    const data = {
      Flood: {
        tool: faker.random.arrayElement(['jmeter', 'gatling']),
      },
      Files: [
        'BuildOutput::test-a.jmx',
        'BuildOutput::test-b.jmx',
        'BuildOutput::test-c.jmx',
      ],
      Grids: [
        {
          uuid: faker.random.uuid(),
        },
      ],
    };

    it('resolves with the correct object', () =>
      expect(validate(data)).resolves.toMatchObject(data));
  });

  describe('when a schema is invalid', () => {
    it('rejects on empty schema', () =>
      expect(validate({})).rejects.toEqual(expect.any(Error)));
  });
});
