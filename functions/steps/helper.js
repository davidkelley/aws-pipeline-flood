/**
 * Attempts to parse a flood.io response, extracting the flood uuid, the grid uuid and the status.
 *
 * @param {Object} data - response from flood io
 * @return {Object} - an object with the flood, grid and status properties
 * ```
 * {
 *  flood: {
 *    uuid
 *  },
 *  grid: {
 *    uuid
 *  },
 *  status
 * }
 * ```
 */
export const parseFloodResponse = (data) => {
  const { uuid, _embedded, status } = data;
  const grid = _embedded.grids.shift();
  return {
    flood: {
      uuid,
    },
    grid: {
      uuid: grid.uuid,
    },
    status,
  };
};


const makeArrayKey = key => {
  if (key.length > 2 && key.lastIndexOf('[]') === key.length - 2) {
    return key;
  }
  return `${key}[]`;
};

/**
 * Attempts to remap an object structure to a form compatible object.
 * Takes an object like
 * ```
 * {
 *  flood: {
 *    tool: 'jmeter'
 *    grids: [
 *      {
 *        region: 'eu-west-1'
 *      }
 *    ]
 *  }
 * }
 * ```
 * and transforms it to
 * ```
 * {
 *  'flood[tool]': 'jmeter',
 *  'flood[grids][][region]': 'eu-west-1'
 * }
 * ```
 *
 * @param {Object} obj - object containing the flood io preferences
 * @param {Object} parent - parent object to insert into (used for recursion)
 * @param {String} pre - prefix, will be generated from keys if not provided
 */
export const transformObjectProps = (obj, parent, pre) => {
  const mappedObj = parent || {};

  Object.keys(obj).forEach(prop => {
    const key = pre ? (`${pre}[${prop}]`) : prop;

    if (typeof obj[prop] === 'object' && !Array.isArray(obj[prop])) {
      transformObjectProps(obj[prop], mappedObj, key);
    } else if (Array.isArray(obj[prop])) {
      obj[prop].forEach(value => {
        const arrayKey = makeArrayKey(key);

        if (typeof value === 'object') {
          transformObjectProps(value, mappedObj, arrayKey);
        } else {
          mappedObj[arrayKey] = value;
        }
      });
    } else {
      mappedObj[key] = obj[prop];
    }
  });

  return mappedObj;
};
