/**
 * This schema defines the keys, properties and valid values that can be included
 * inside the `UserParameters` key when defining the use of this action inside
 * CodePipeline.
 *
 * @see https://github.com/flood-io/api-docs
 *
 * @type {Object}
 */
const Schema = {
  type: 'object',
  required: [
    'Flood',
    'Files',
    'Grids',
  ],
  properties: {
    Parameters: {
      type: 'object',
      default: {},
      additionalProperties: {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'object',
            required: [
              'Fn::GetParam',
            ],
            properties: {
              'Fn::GetParam': {
                type: 'array',
                items: [
                  {
                    type: 'string',
                  },
                  {
                    type: 'string',
                  },
                  {
                    type: 'string',
                  },
                ],
              },
            },
          },
        ],
      },
    },
    Flood: {
      type: 'object',
      required: [
        'tool',
      ],
      properties: {
        tool: {
          type: 'string',
          enum: [
            'jmeter',
            'gatling',
            'java-selenium-chrome',
            'java-selenium-firefox',
          ],
        },
        name: {
          type: 'string',
          regex: '^[_-A-Za-z0-9]+$',
        },
        notes: {
          type: 'string',
        },
        privacy_flag: {
          type: 'string',
          default: 'private',
          enum: [
            'public',
            'private',
          ],
        },
        threads: {
          type: 'integer',
          minimum: 1,
          default: 2,
        },
        rampup: {
          type: 'integer',
          minimum: 1,
        },
        duration: {
          type: 'integer',
          minimum: 1,
        },
        override_hosts: {
          type: 'string',
        },
      },
    },
    Files: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
        pattern: '^.+::.+$',
      },
    },
    Grids: {
      type: 'array',
      minItems: 1,
      items: {
        oneOf: [
          {
            type: 'object',
            required: [
              'uuid',
            ],
            properties: {
              uuid: {
                type: 'string',
              },
            },
          },
          {
            type: 'object',
            required: [
              'region',
              'instance_quantity',
              'stop_after',
            ],
            properties: {
              region: {
                type: 'string',
              },
              instance_quantity: {
                type: 'integer',
              },
              stop_after: {
                type: 'integer',
              },
              infrastructure: {
                type: 'string',
                default: 'demand',
              },
              aws_platform: {
                type: 'string',
              },
              aws_tags: {
                type: 'string',
              },
              aws_availability_zone: {
                type: 'string',
              },
              aws_spot_price: {
                type: 'number',
              },
              credential_id: {
                type: 'string',
              },
              aws_vpc_identifier: {
                type: 'string',
              },
              aws_vpc_subnet_public: {
                type: 'string',
              },
              aws_vpc_subnet_private: {
                type: 'string',
              },
              aws_vpc_security_groups: {
                type: 'string',
              },
            },
          },
        ],
      },
    },
  },
};

export default Schema;
