![Logo][logo]

# CodePipeline Flood.IO Action

![Architecture][architecture]

This project provides an integration for [Flood.IO](https://flood.io) in [AWS CodePipeline](https://aws.amazon.com/documentation/codepipeline/).

Enabling automated load testing as an action within a pipeline. You may pass "flood files" (Jmeter, Selenium, etc.) from a pipeline artifact, as well as optionally define parameter overrides using artifact attribute keys (as described below).

In-order to ensure your Pipeline has necessary permissions to invoke a Lambda function, follow the [setup steps here](http://docs.aws.amazon.com/codepipeline/latest/userguide/actions-invoke-lambda-function.html).

The flood test is monitored by an AWS Step Functions State Machine (as described above).

An example action definition inside a CodePipeline CloudFormation resource definition:

```yaml
- Name: Testing
  Actions:
    - Name: Flood
      RunOrder: 1
      InputArtifacts:
        - Name: SourceOutput
        - Name: TestStackOutput
      ActionTypeId:
        Category: Invoke
        Owner: AWS
        Version: 1
        Provider: Lambda
      OutputArtifacts:
        - Name: BuildOutput
      Configuration:
        FunctionName: !ImportValue FloodTestingFunctionName
        UserParameters: !Sub |
          {
            "Parameters": {
              "SOME_VAL": "${PipelineParameter}",
              "API_URL": {
                "Fn::GetParam": ["TestStackOutput", "Outputs.json", "ApiUrl"]
              }
            },
            "Flood": {
              "tool": "jmeter"
            },
            "Files": [
              "SourceOutput::tests/load-test-a.jmx",
              "SourceOutput::tests/load-test-b.jmx"
            ],
            "Grids": [{
              "region": "us-east-1",
              "instance_quantity": 4,
              "stop_after": 120
            }]
          }
```

For a full definition of what you can define inside the `UserParameters` key, see [the JSON Schema file](/functions/pipeline/pipeline/validate/schema.js).

[logo]: /.github/images/logo-small.png
[architecture]: /.github/images/Flood.png


Event structure needs to follow this structure to be correctly read by flood.io.
The files list needs to be a list of presigned/public urls that the script can download.

NOTE, empty values are not allowed
NOTE2, if the `grid uuid` prop is set, it has to match an existing grid or it will return 404
```
{
  files: [
    'https://s3-eu-west-1.amazonaws.com/floodfiles/floodtest.jmx',
  ],
  flood: {
    tool: 'jmeter',
    // name: '',
    // notes: '',
    // tag_list: '',
    // privacy_flag: '',
    // threads: '',
    // rampup: '',
    // duration: '',
    // override_hosts: '',
    // override_parameters: '',
    grids: [
      {
        // uuid: 'existing-grid-id',
        region: 'eu-west-1',
        instance_type: 'm4.xlarge',
        // instance_quantity: '',
        stop_after: '60',
        infrastructure: 'demand',
        // aws_platform: '',
        // aws_tags: '',
        // aws_availability_zone: '',
        // aws_spot_price: '',
        // credential_id: '',
        // aws_vpc_identifier: '',
        // aws_vpc_subnet_public: '',
        // aws_vpc_subnet_private: '',
        // aws_vpc_security_groups: '',
      },
    ],
  },
};
```
