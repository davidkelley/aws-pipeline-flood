/* eslint-disable import/no-unresolved */

import Schema from '@functions/pipeline/pipeline/validate/schema';

import Ajv from 'ajv';

describe('Schema', () => {
  it('compiles successfully', () => {
    expect(() => { new Ajv().compile(Schema); }).not.toThrow();
  });
});
