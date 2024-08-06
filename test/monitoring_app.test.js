const { App } = require('aws-cdk-lib');
const { Template, Match } = require('aws-cdk-lib/assertions');
const { MonitoringAppStack } = require('../lib/monitoring_app-stack');

describe('MonitoringAppStack', () => {
  let app;
  let stack;

  beforeAll(() => {
    app = new App();
    stack = new MonitoringAppStack(app, 'MyTestStack');
  });

  test('S3 Bucket is deployed', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('Lambda Function is deployed', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs16.x',
      Environment: {
        Variables: {
          BUCKET_NAME: {
            Ref: Match.anyValue(),
          },
        },
      },
    });
  });
});
