using Amazon.CDK;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.S3;
using Constructs;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.CloudWatch;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.CustomResources;
using System.Collections.Generic;

namespace MonitoringApp
{
    public class MonitoringAppStack : Stack
    {
        internal MonitoringAppStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            //create an s3 bucket
            var bucket = new Bucket(this, "ManishaBucket", new BucketProps
            {
                Versioned = true,
                RemovalPolicy = RemovalPolicy.DESTROY,
                AutoDeleteObjects = true
            });

            //Deploy the website-list folder contents to the s3bucket
            var deployment = new BucketDeployment(this, "DeployWebsiteList", new BucketDeploymentProps
            {
                Sources = new[] { Source.Asset("./website-list") },
                DestinationBucket = bucket
            });

            // Define the Lambda function for the canary/web crawler
            var crawlerFunction = new Function(this, "CrawlerFunction", new FunctionProps
            {
                Runtime = Runtime.DOTNET_6,
                Handler = "LambdaFunction::LambdaFunction.Function::FunctionHandler",
                Code = Code.FromAsset("src/MonitoringApp/Lambda")

            });

            // Give Lambda function permissions to read from S3 bucket
            bucket.GrantRead(crawlerFunction);

            // Create a Cloudwatch alarm for Lambda function duration
            var durationAlarm = new Alarm(this, "DurationAlarm", new AlarmProps
            {
                Metric = crawlerFunction.MetricDuration(),
                Threshold = 3000, //3 seconds
                EvaluationPeriods = 1,
                DatapointsToAlarm = 1,
                ComparisonOperator = ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            });

            // Create a Cloudwatch alarm for Lambda function error
            var errorAlarm = new Alarm(this, "ErrorAlarm", new AlarmProps
            {
                Metric = crawlerFunction.MetricErrors(),
                Threshold = 3000, //3 seconds
                EvaluationPeriods = 1,
                DatapointsToAlarm = 1,
                ComparisonOperator = ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            });


            // Define the DynamoDB table with the name 'notificationUsers'
            // and set 'userID' as the partition key.
            var notificationUsersTable = new Table(this, "NotificationUsersTable", new TableProps
            {
                TableName = "notificationUsers",
                PartitionKey = new Attribute { Name = "userID", Type = AttributeType.STRING },
                RemovalPolicy = RemovalPolicy.DESTROY // Change to RETAIN if you want to keep the table on stack deletion
            });

            // Define an AWS SDK call to put an item into the DynamoDB table.
            var seedFunction = new AwsSdkCall
            {
                Service = "DynamoDB", // The AWS service to call.
                Action = "putItem", // The API action to call.
                Parameters = new Dictionary<string, object>
                {
                    { "TableName", notificationUsersTable.TableName }, // The name of the table.
                    { "Item", new Dictionary<string, object>
                        {
                            { "userID", new Dictionary<string, string> { { "S", "1" } } }, // The 'userID' attribute with a value of '1'.
                            { "Email", new Dictionary<string, string> { { "S", "subhambk280@gmail.com" } } } // The 'Email' attribute with the specified email.
                        }
                    }
                },
                PhysicalResourceId = PhysicalResourceId.Of("NotificationUserSeedData") // Ensures the AWS SDK call is only run once.
            };

            // Define an AWS custom resource that runs the seed function.
            var onEvent = new AwsCustomResource(this, "SeedNotificationUsersData", new AwsCustomResourceProps
            {
                OnCreate = seedFunction, // The function to run when the resource is created.
                Policy = AwsCustomResourcePolicy.FromSdkCalls(new SdkCallsPolicyOptions
                {
                    Resources = AwsCustomResourcePolicy.ANY_RESOURCE // Allow the custom resource to call any AWS resource.
                })
            });

            // Ensure the custom resource runs only after the DynamoDB table is created.
            onEvent.Node.AddDependency(notificationUsersTable);
        }
    }
}
