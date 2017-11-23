/* eslint-disable import/no-unresolved */

import { parseFloodResponse, transformObjectProps } from '@functions/steps/helper';
import mockResponse from './mock/mockresponse.json';

const mockFloodProps = {
  flood: {
    tool: 'jmeter',
    grids: [
      {
        region: 'eu-west-1',
        instance_type: 'm4.xlarge',
        stop_after: '60',
        infrastructure: 'demand',
      },
    ],
  },
};

describe('Helper suite', () => {
  describe('parseFloodResponse', () => {
    it('Extracts the correct props and returns a new object', () => {
      expect(parseFloodResponse(mockResponse)).toMatchSnapshot();
    });
  });

  describe('transformObjectProps', () => {
    it('Remaps the object properties to match a form', () => {
      expect(transformObjectProps(mockFloodProps)).toMatchSnapshot();
    });
  });
});
