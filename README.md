

 **Introduction**
 The purpose of this manual is to instruct on how to use the web monitoring application developed with the aid of AWS services. This application monitors web resources, processes notifications, and logs data for analysis.

**Application Overview**
 The application will monitor the web resources with the aid of AWS Lambda, CloudWatch, SNS, and DynamoDB, compute the generated metrics, and process the notifications. Scheduled by a periodically fired cron job, it will output alerts in case any computed metrics go beyond user-defined thresholds.
 
**Features**
**Global metric monitoring**
Description: This keeps track of some of the key performance metrics of any public Web resource.
How It Works: The Lambda function collects metrics and forwards them to CloudWatch for monitoring.

**Lambda Function Creation and Metrics Integration**
This AWS Lambda program monitors the availability and latency of a set
of websites stored in an S3 bucket. It begins by retrieving a JSON file from
the S3 bucket, which contains a list of website URLs. The program then
iterates across these URLs, sending HTTP GET requests to each website
using the https module. It calculates the response time for each request and
examines the status code to see if the website is available. If the status code
is 200, the availability is recorded as 1; otherwise, it is 0, and the delay is
recorded in milliseconds if the request is successful.
The metrics on availability and latency are then sent to AWS CloudWatch
for monitoring. The method makes use of a helper function, putMetric, to
transmit this data to CloudWatch under a custom namespace, where it is
utilized to track website performance over time. If any issues are
encountered during data retrieval or HTTP queries, the function reports
them and provides a failure response. This configuration helps guarantee
that the monitored websites function as expected and enables proactive
control of any performance concerns.
 
 **S3 bucket Setup**
The S3 bucket is created using AWS CDK and a JSON file is uploaded to
it. The s3.Bucket is created with versioning enabled and set to destroy items
and the bucket itself when removed, which is normally not advised for
production applications. The s3deploy.BucketDeployment then uploads a
JSON file from a given local directory to the bucket. This configuration
guarantees that the JSON file is saved and handled within the newly
established S3 bucket, making it available for subsequent processing or
retrieval.

 **CloudWatch Alarms**
Description: These generate an alert when certain predefined thresholds are either exceeded or fallen below.
Configuration: The alarms will be set up in CloudWatch against those metrics that need monitoring.
 

**DynamoDB**
Description: Logs notifications and errors for auditing.
How to Access: Use the DynamoDB console to view logs.
 	
 

 **Cron Job Scheduling**
Description: Runs the Lambda function every 30 seconds.
Configuration: Done using CloudWatch Events for constant monitoring of execution.
 
 
 
**Notification Handler**
When notification sets up for inAlarm state, it sent trigger to Lambda function “Notification Handler” which logs the notification mail in to dynamodb table.

**CI/CD Pipeline Manisha**
 Artifact Bucket Creation: An S3 bucket named ArtifactBucket is
established to store pipeline artifacts, with the option to auto-delete items
and remove them when the stack is erased.
 Pipeline: A CodePipeline called CICDPipeline is created utilizing the
artifact bucket. It has steps for sourcing, building, and deploying processes.
 Source stage: A GitHub Source action retrieves code from a GitHub
repository by utilizing a secret token obtained via AWS Secrets Manager.
The source action produces artifacts that can be used in following phases.
 Build Stage: An AWS CodeBuild project named BuildProject is configured
with a buildspec file that executes the npm install, npm run build, and cdk
synth instructions. It produces build artifacts from the cdk.out directory.
 Deploy Stage: A CloudFormationCreateUpdateStackAction deploys the
stack  with  the  created  artifacts.  It  creates  or  modifies  the
MonitoringAppStack  with  administrator  privileges.
The pipeline automates the process of downloading source code, developing
the application, and delivering it, resulting in an efficient and consistent
deployment methodology.
 
**Running Instructions**
Prerequisites to run the application
Deploy the Stack: Deploy the infrastructure with AWS CDK.
 
Verify Resources: Verify if Lambda, CloudWatch, SNS, and DynamoDB are set correctly.


**Monitoring Metrics**
View CloudWatch: Go to the CloudWatch dashboard.
View Metrics: In the Metrics section find details of data gathered. 
View Alarms: In the Alarms section, find which alarms have been activated. 
Manage Notifications
View SNS Topics: Open SNS dashboard and find the topics of notification.
View Logs: Open CloudWatch Logs to get the notifications that were processed.
Viewing logs
Open DynamoDB: Open DynamoDB console 
View Table: Choose the Notification log table.
View Items: View items in this table, watching for notification and error details

 **Troubleshooting**
Alarm not Triggering: Make sure that thresholds are set correctly, and the metrics are being reported. Lambda Function Errors: Check CloudWatch logs for error messages. Review Lambda configuration. Notification Issues: Verify SNS topic subscriptions and permissions.

**Support**
•	Issue Tracker: Please utilize the repository's GitHub Issues page to report defects or request new features.
•	Documentation: The repository's README and accompanying markdown files include comprehensive documentation.
•	Discussion and Questions: You may open an issue on the GitHub Issues page to start a discussion or ask questions. We invite community interaction and input.

For further information, visit the MonitoringApp GitHub repository “https://github.com/BKSubham/MonitoringApp”

 

7. Authors and Acknowledgment
Subham BK– Team Member
Special thanks to the AWS community and contributors for their support and tools.

8. Project Status
Development is underway. If you are interested in contributing to or maintaining the project, please contact us.




