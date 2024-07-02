const cdk = require("aws-cdk-lib");
const { Stack } = cdk;
const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const iam = require("aws-cdk-lib/aws-iam");
const path = require("path");
const fs = require("fs");

class MonitoringAppStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    // Define the S3 bucket
    const myBucket = new s3.Bucket(this, "MyBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
    });

    // Define the Lambda function
    const myFunction = new lambda.Function(this, "MyFunction", {
      runtime: lambda.Runtime.NODEJS_16_X, // or another supported runtime
      code: lambda.Code.fromAsset("lambda"), // point to the directory with the lambda code
      handler: "index.handler", // file is "index", function is "handler"
      environment: {
        BUCKET_NAME: myBucket.bucketName,
      },
    });

    // Grant the Lambda function read permissions on the S3 bucket
    myBucket.grantRead(myFunction);

    // Attach the necessary policy to the function's role
    myFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'], // You can scope down the resources as needed
    }));

     // Define metrics for availability and latency
     const availabilityMetric = new cloudwatch.Metric({
      namespace: 'WebsiteMetrics',
      metricName: 'Availability',
  });

    const latencyMetric = new cloudwatch.Metric({
        namespace: 'WebsiteMetrics',
        metricName: 'Latency',
    });

    // Define alarms for each metric and each website
     // Read the websiteList.json file
     const websiteListPath = path.join(__dirname,'../essentials/website.json');
     const rawdata = fs.readFileSync(websiteListPath);
     const websites = JSON.parse(rawdata);
     
    const metrics = [availabilityMetric, latencyMetric];

    websites.forEach((website) => {
        metrics.forEach((metric) => {
            const metricName = metric.metricName.toLowerCase(); // Lowercase metric name
            const dimensionName = 'Website';

            // Example CloudWatch alarm for each metric and website combination
            new cloudwatch.Alarm(this, `${metricName}Alarm-${website}`, {
                metric: metric,
                threshold: metricName === 'availability' ? 0.95 : 500, // Thresholds based on metric type
                evaluationPeriods: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
                alarmDescription: `Alarm if ${metricName} drops below threshold for ${website}`,
                actionsEnabled: true,
                dimensionsMap: {
                    [dimensionName]: website,
                },
            });
        });
    });
  }
}
module.exports = { MonitoringAppStack };
