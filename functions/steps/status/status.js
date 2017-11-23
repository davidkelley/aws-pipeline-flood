import request from 'request-promise-native';

import { FLOOD_API_KEY, FLOOD_API_URI, FLOODS_PATH } from '../../globals';
import { parseFloodResponse } from '../helper';

/**
 * Queries the flood.io API for the status of a flood job.
 *
 * See: https://github.com/flood-io/api-docs/blob/master/endpoints/floods/GET-floods-flood_id.md
 *
 * Callback function will be called with an object describing the flood session on success
 * ```
 * {
 *  flood: {
 *    uuid, string
 *  },
 *  grid: {
 *    uuid, string
 *  },
 *  status, string, e.g. 'queued'/'finished'
 * }
 * ```
 *
 * @param {Object} event - object containing the flood uuid
 * @param {Object} context - Lambda runtime information
 * @param {Function} callback - function that will be invoked with (err) or (null, response)
 *
 */
export function handler(
  event = {},
  context,
  callback = () => {}
) {
  const { flood: { uuid } } = event;
  const options = {
    uri: `${FLOOD_API_URI}${FLOODS_PATH}/${uuid}`,
    auth: {
      user: FLOOD_API_KEY,
    },
  };

  request.get(options)
    .then((res) => {
      const cr = parseFloodResponse(JSON.parse(res));
      callback(null, cr);
    })
    .catch((err) => {
      callback(err);
    });
}
