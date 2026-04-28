import {
  CreateTableCommand,
  CreateTableCommandInput,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";

// Checks that a table can be reached
// If running locally, will also create the table if it doesn't exist
export const warmSimpleKeyTable = async (
  dynamoClient: DynamoDBClient,
  tableName: string,
  primaryKey: string
): Promise<void> =>
  warmTable(dynamoClient, tableName, {
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: primaryKey,
        KeyType: "HASH",
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: primaryKey,
        AttributeType: "S",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

export const warmTable = async (
  dynamoClient: DynamoDBClient,
  tableName: string,
  tableSchema: CreateTableCommandInput
): Promise<void> => {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
  } catch (err) {
    if (
      err instanceof ResourceNotFoundException &&
      process.env.ENVIRONMENT === "local"
    ) {
      await dynamoClient.send(new CreateTableCommand(tableSchema));
    }
  }
};
