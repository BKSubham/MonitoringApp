const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const https = require("https");

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
        https
          .get(website, (res) => {
            resolve({
              website,
              status: res.statusCode,
            });
          })
          .on("error", (err) => {
            resolve({
              website,
              error: err.message,
            });
          });
      });
    };

    // Iterate through the list of websites and make HTTP requests
    const results = [];
    for (const website of websites) {
      const result = await checkWebsite(website);
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
