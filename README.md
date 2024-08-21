

 **Introduction**
 The purpose of this manual is to instruct on how to use the web monitoring application developed with the aid of AWS services. This application monitors web resources, processes notifications, and logs data for analysis.

**Application Overview**
 The application will monitor the web resources with the aid of AWS Lambda, CloudWatch, SNS, and DynamoDB, compute the generated metrics, and process the notifications. Scheduled by a periodically fired cron job, it will output alerts in case any computed metrics go beyond user-defined thresholds.
 
**Features**
**Global metric monitoring**
Description: This keeps track of some of the key performance metrics of any public Web resource.
How It Works: The Lambda function collects metrics and forwards them to CloudWatch for monitoring.
 
 
 

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

5. Troubleshooting
Alarm not Triggering: Make sure that thresholds are set correctly, and the metrics are being reported. Lambda Function Errors: Check CloudWatch logs for error messages. Review Lambda configuration. Notification Issues: Verify SNS topic subscriptions and permissions.

6. Support
•	Issue Tracker: Please utilize the repository's GitHub Issues page to report defects or request new features.
•	Documentation: The repository's README and accompanying markdown files include comprehensive documentation.
•	Discussion and Questions: You may open an issue on the GitHub Issues page to start a discussion or ask questions. We invite community interaction and input.

For further information, visit the MonitoringApp GitHub repository “https://github.com/BKSubham/MonitoringApp”

 

7. Authors and Acknowledgment
Subham BK– Team Member
Special thanks to the AWS community and contributors for their support and tools.

8. Project Status
Development is underway. If you are interested in contributing to or maintaining the project, please contact us.




