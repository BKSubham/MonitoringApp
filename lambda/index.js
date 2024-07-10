const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const https = require("https");
const cloudwatch = new AWS.CloudWatch();
// Import metrics constants
const {
  METRICS_NAMESPACE,
  METRIC_AVAILABILITY,
  METRIC_LATENCY,
  AVAILABILITY_THRESHOLD,
  LATENCY_THRESHOLD,
} = require("./metric");

exports.handler = async function (event) {
  const bucket = event.bucket;
  const key = event.key;
  try {
    const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const websites = JSON.parse(data.Body.toString("utf-8"));

    // Ensure the JSON contains a list of websites
    if (!Array.isArray(websites)) {
      throw new Error("Invalid JSON format: expected an array of websites.");
    }

    // Helper function to make HTTP GET request using https module
    const checkWebsite = (website) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        https
          .get(website, (res) => {
            const responseTime = Date.now() - startTime;
            resolve({
              website,
              status: res.statusCode,
              responseTime: responseTime,
            });
          })
          .on("error", (err) => {
            resolve({
              website,
              error: err.message,
              status: -1,
              responseTime: -1,
            });
          });
      });
    };

    // Iterate through the list of websites and make HTTP requests
    const results = [];
    for (const website of websites) {
      const result = await checkWebsite(website);

      // Example: Measure availability (status code check)
      const availability = result.status === 200 ? 1 : 0;

      // Example: Measure latency (response time)
      const latency = result.status === 200 ? result.responseTime : -1;

      // Push metrics to CloudWatch
      await putMetric(METRIC_AVAILABILITY, website, availability);
      await putMetric(METRIC_LATENCY, website, latency);

      results.push(result);
    }

    // Return the results
    return {
      statusCode: 200,
      body: JSON.stringify(results, null, 2),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Failed to read data from S3",
      errorMessage: err.errorMessage,
    };
  }
};

async function putMetric(metricName, websiteName, value) {
  // Example function to put metric data to CloudWatch under custom namespace 'WebsiteMetrics'
  const params = {
    MetricData: [
      {
        MetricName: metricName,
        Dimensions: [
          {
            Name: "Website",
            Value: websiteName,
          },
        ],
        Timestamp: new Date(),
        Unit: metricName === METRIC_LATENCY ? "Milliseconds" : "Count",
        Value: value,
      },
    ],
    Namespace: METRICS_NAMESPACE,
  };

  try {
    await cloudwatch.putMetricData(params).promise();
    console.log(
      `Successfully pushed metric ${metricName} for ${websiteName} to CloudWatch.`
    );
  } catch (error) {
    console.error(`Error pushing metric to CloudWatch: ${error}`);
    throw error;
  }
}
