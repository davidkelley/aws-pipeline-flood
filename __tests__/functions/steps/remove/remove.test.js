/* eslint-disable import/no-unresolved */

import request from 'request-promise-native';
import { handler } from '@functions/steps/remove/remove';
import nock from 'nock';
import { FLOOD_API_URI, GRIDS_PATH } from '@functions/globals';

const mockResponse = {
  result: 'mock',
};
const mockUUID = '123123';

let requestSpy;
let callbackSpy;

beforeAll(() => {
  nock.disableNetConnect();
  requestSpy = jest.spyOn(request, 'delete');
});

afterAll(() => {
  nock.enableNetConnect();
});

describe('Remove grid suite', () => {
  describe('Handles successful query', () => {
    beforeEach((done) => {
      nock(`${FLOOD_API_URI}${GRIDS_PATH}`)
        .delete(`/${mockUUID}`)
        .reply(200, mockResponse, { 'Content-Type': 'application/json' });

      callbackSpy = jest.fn().mockImplementation(() => {
        done();
      });

      handler({
        grid: {
          uuid: mockUUID,
        },
      }, null, callbackSpy);
    });

    describe('Calling handler', () => {
      it('Called endpoint to remove grid', () => {
        expect(requestSpy.mock.calls).toMatchSnapshot();
      });

      it('Invoked callback', () => {
        expect(callbackSpy.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('Handles unsuccesful response ', () => {
    beforeEach((done) => {
      nock(`${FLOOD_API_URI}${GRIDS_PATH}`)
        .delete(`/${mockUUID}`)
        .reply(404);

      callbackSpy = jest.fn().mockImplementation(() => {
        done();
      });

      handler({
        grid: {
          uuid: mockUUID,
        },
      }, null, callbackSpy);
    });

    describe('Calling handler', () => {
      it('Returned the error to the callback', () => {
        expect(callbackSpy.mock.calls).toMatchSnapshot();
      });
    });
  });
});
