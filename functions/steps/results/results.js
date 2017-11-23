import request from 'request-promise-native';
import { FLOOD_API_KEY, FLOOD_API_URI, FLOODS_PATH } from '../../globals';

/**
 * Retrieves the summary of the flood job.
 *
 * See: https://github.com/flood-io/api-docs/blob/master/endpoints/floods/GET-floods-flood_id-report.md
 *
 * Callback function will be called with an object containing the summary of the flood
 * ```
 * {
 *  summary, string
 * }
 * ```
 *
 * @param {Object} event - object containing the flood uuid
 * @param {Object} context - Lambda runtime information
 * @param {Function} callback - function that will be invoked with (err) or (null, response)
 */
export function handler(
  event = {},
  context,
  callback = () => {}
) {
  const { flood: { uuid } } = event;
  const options = {
    uri: `${FLOOD_API_URI}${FLOODS_PATH}/${uuid}/report`,
    auth: {
      user: FLOOD_API_KEY,
    },
  };

  request.get(options)
    .then(res => {
      const { summary } = JSON.parse(res);
      callback(null, summary);
    })
    .catch(err => {
      callback(err);
    });
}
