import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { StubInterventionData } from "../types/StubInterventionData";
import { Optional } from "../types/Optional";
import { getEnv } from "src/main/util/getEnv";

const dynamoClient = DynamoDBDocument.from(
  new DynamoDBClient({
    region: "eu-west-2",
    ...(process.env.LOCALSTACK_ENDPOINT && {
      endpoint: process.env.LOCALSTACK_ENDPOINT,
    }),
  })
);

export const getStubIntervention = async (
  internalPairwiseId: string
): Promise<Optional<StubInterventionData>> => {
  let interventionOpt: Optional<StubInterventionData>;

  try {
    interventionOpt = Optional.of(
      (
        await dynamoClient.get({
          TableName: getEnv("STUB_AIS_TABLE_NAME"),
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
