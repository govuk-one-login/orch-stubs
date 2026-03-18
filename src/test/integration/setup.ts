import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
import localParams from "./../../../parameters.json";
const waitForDynamoAndSqs = async () => {
  let polls = 0;
  let dynamoReady = false;
  let sqsReady = false;
  do {
    const elasticMqHealth = await fetch("http://127.0.0.1:9324/health");
    const dynamoDbLocalHeath = await fetch("http://127.0.0.1:8000");
    if (elasticMqHealth.ok && elasticMqHealth.status === 200) {
      sqsReady = true;
    }
    if (dynamoDbLocalHeath.status === 400) {
      dynamoReady = true;
    }
    if (sqsReady && dynamoReady) {
      break;
    }
    polls++;

    await new Promise((r) => setTimeout(r, 500));
  } while (polls <= 10);

  if (polls >= 10) {
    throw new Error("Failed to start dynamoDB-local / elasticMQ");
  }
};
const initTables = async () => {
  const dynamoClient = new DynamoDBClient({
    region: "eu-west-2",
    endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT,
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  });

  const tables: CreateTableCommandInput[] = [
    {
      TableName: "local-IpvStub-UserIdentity",
      KeySchema: [{ AttributeName: "UserIdentityId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "UserIdentityId", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    },
    {
      TableName: "local-AuthStub-AuthCode",
      KeySchema: [{ AttributeName: "authCode", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "authCode", AttributeType: "S" }],
      BillingMode: "PAY_PER_REQUEST",
    },
    {
      TableName: "local-AuthStub-AccessToken",
      KeySchema: [{ AttributeName: "accessToken", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "accessToken", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    },
    {
      TableName: "local-AuthStub-UserProfile",
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "email", AttributeType: "S" },
        { AttributeName: "subjectId", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
      GlobalSecondaryIndexes: [
        {
          IndexName: "SubjectIdIndex",
          KeySchema: [{ AttributeName: "subjectId", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      TableName: "local-AIS-stub-interventions",
      KeySchema: [{ AttributeName: "pairwiseId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "pairwiseId", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    },
  ];

  await Promise.all(
    tables.map((table) =>
      dynamoClient.send(new CreateTableCommand(table)).catch(() => {})
    )
  );
};

module.exports = async () => {
  Object.entries(localParams.Parameters)
    // Ignore the sam local dynamo/SQS endpoint
    //for running the tests
    .filter(([k]) => k !== "DYNAMODB_LOCAL_ENDPOINT")
    .filter(([k]) => k !== "ELASTIC_MQ_LOCAL_ENDPOINT")
    .forEach(([k, v]) => (process.env[k] = v));

  const queuename = "local-queue";
  process.env.QUEUE_NAME = queuename;
  process.env.DYNAMODB_LOCAL_ENDPOINT = "http://localhost:8000";
  process.env.AWS_REGION = "eu-west-2";
  process.env.AWS_ACCESS_KEY_ID = "test-key";
  process.env.AWS_SECRET_ACCESS_KEY = "test-secret";

  process.env.ELASTIC_MQ_LOCAL_ENDPOINT = "http://localhost:9324";
  process.env.DESTINATION_QUEUE_URL = `http://localhost:9324/000000000000/${queuename}`;

  await waitForDynamoAndSqs();
  await initTables();
};
