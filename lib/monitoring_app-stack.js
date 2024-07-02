const cdk = require("aws-cdk-lib");
const { Stack } = cdk;
const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");

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
  }
}
module.exports = { MonitoringAppStack };
