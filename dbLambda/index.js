const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const tableName = process.env.TABLE_NAME;
  const putPromises = event.Records.map(async (record) => {
    const message = JSON.parse(record.Sns.Message);
    const params = {
      TableName: tableName,
      Item: {
        ID:  message.AlarmName,
        Timestamp: new Date().toISOString(),
        Message: message
      }
    };

    return dynamo.put(params).promise();
  });

  await Promise.all(putPromises);
  return { status: 'Success' };
};
