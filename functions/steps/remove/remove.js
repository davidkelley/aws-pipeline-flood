import request from 'request-promise-native';
import { FLOOD_API_KEY, FLOOD_API_URI, GRIDS_PATH } from '../../globals';

/**
 * Removes a flood grid
 *
 * See: https://github.com/flood-io/api-docs/blob/master/endpoints/grids/DELETE-grids-grid_id.md
 *
 * Callback function will be called with an object containing the new status of the grid
 *
 * @param {Object} event - object containing the grid uuid
 * @param {Object} context - Lambda runtime information
 * @param {Function} callback - function that will be invoked with (err) or (null, response)
 */
export function handler(
  event = {},
  context,
  callback = () => {}
) {
  const { grid: { uuid } } = event;
  const options = {
    uri: `${FLOOD_API_URI}${GRIDS_PATH}/${uuid}`,
    auth: {
      user: FLOOD_API_KEY,
    },
  };

  request.delete(options)
    .then(res => {
      callback(null, Object.assign({}, event, JSON.parse(res)));
    })
    .catch(err => {
      callback(err);
    });
}
