import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { StubInterventionData } from "../types/StubInterventionData.ts";
import { Optional } from "../types/Optional.ts";
import { getEnv } from "../../../main/util/getEnv.ts";

const dynamoClient = DynamoDBDocument.from(
  new DynamoDBClient({
    region: "eu-west-2",
    ...(process.env.DYNAMO_ENDPOINT && {
      endpoint: process.env.DYNAMO_ENDPOINT,
    }),
  })
);

const tableName = getEnv("STUB_AIS_TABLE_NAME");

export const warmUp = async (): Promise<void> => {
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
      await dynamoClient.send(
        new CreateTableCommand({
          TableName: tableName,
          KeySchema: [
            {
              AttributeName: "pairwiseId",
              KeyType: "HASH",
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: "pairwiseId",
              AttributeType: "S",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
    }
  }
};

export const getStubIntervention = async (
  internalPairwiseId: string
): Promise<Optional<StubInterventionData>> => {
  let interventionOpt: Optional<StubInterventionData>;

  try {
    interventionOpt = Optional.of(
      (
        await dynamoClient.get({
          TableName: tableName,
          Key: {
            pairwiseId: internalPairwiseId,
          },
        })
      ).Item as StubInterventionData
    );
  } catch (error) {
    throw new Error(
      "Failed to get InterventionData: " + (error as Error).message
    );
  }

  return interventionOpt;
};
