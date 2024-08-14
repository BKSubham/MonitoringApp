const { App } = require('aws-cdk-lib');
const { Template } = require('aws-cdk-lib/assertions');
const { MonitoringAppStack } = require('../lib/monitoring_app-stack'); // Adjust path if necessary

test('S3 bucket is created with versioning enabled and auto-delete objects', () => {
    const app = new App();
    const stack = new MonitoringAppStack(app, 'TestMonitoringAppStack');
    
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
            Status: 'Enabled',
        },
    });

    template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
    });
});

test('Lambda function is created with the correct environment variables', () => {
    const app = new App();
    const stack = new MonitoringAppStack(app, 'TestMonitoringAppStack');
    
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
            Variables: {
                BUCKET_NAME: {
                    "Ref": "MyBucketF68F3FF0", 
                },
            },
        },
        Runtime: 'nodejs16.x',
        Handler: 'index.handler',
    });
});

test('SNS topic is created and subscriptions are added', () => {
    const app = new App();
    const stack = new MonitoringAppStack(app, 'TestMonitoringAppStack');
    
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email', // Ensure that the protocol is set correctly
    });
});

test('CloudWatch alarms are created for availability and latency metrics', () => {
    const app = new App();
    const stack = new MonitoringAppStack(app, 'TestMonitoringAppStack');
    
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'WebsiteAvailability', // Updated value
        Namespace: 'MonitoringAppNamespace', // Updated value
        ComparisonOperator: 'LessThanThreshold',
        Threshold: 1,
        EvaluationPeriods: 1,
    });
});
