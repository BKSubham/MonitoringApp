using Amazon.CDK;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.S3;
using Constructs;
using Amazon.CDK.AWS.Lambda;

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
        }
    }
}
