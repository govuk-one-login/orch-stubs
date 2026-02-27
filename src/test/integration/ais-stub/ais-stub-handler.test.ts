import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { randomBytes } from "crypto";
import { handler } from "../../../main/ais-stub/ais-stub";
import { StubInterventionData } from "../../../main/ais-stub/types/StubInterventionData";
import { getEnv } from "../../../main/util/getEnv";
import { createApiGatewayEvent } from "../util";
import {
  defaultIntervention,
  defaultState,
} from "../../../main/ais-stub/data/default-intervention-response";

describe("AIS stub handler", () => {
  const tableName = "local-AIS-stub-interventions";
  const localStackDynamoClient = DynamoDBDocument.from(
    new DynamoDBClient({
      region: "eu-west-2",
      endpoint: getEnv("LOCALSTACK_ENDPOINT"),
    })
  );

  beforeAll(async () => {
    process.env.STUB_AIS_TABLE_NAME = tableName;
    await clearStubInterventions();
  });

  it("returns an intervention when there is a stored intervention for a pairwiseID", async () => {
    //Arrange
    const pairwiseId = "urn:fdc:" + randomBytes(32).toString("base64url");
    const stubInterventionsData: StubInterventionData = {
      pairwiseId,
      blocked: true,
      resetPassword: true,
      reproveIdentity: true,
      suspended: true,
    };

    await putStubIntervention(stubInterventionsData);

    // Act

    const interventionResponse = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {},
        { internalPairwiseId: pairwiseId }
      )
    );

    //Assert
    expect(interventionResponse.statusCode).toBe(200);
    expect(JSON.parse(interventionResponse.body)).toStrictEqual({
      intervention: defaultIntervention(),
      state: {
        blocked: true,
        resetPassword: true,
        reproveIdentity: true,
        suspended: true,
      },
    });
  });

  it("returns the default intervention when there is no stored intervention for a pairwiseID", async () => {
    //Arrange
    const pairwiseId = "urn:fdc:" + randomBytes(32).toString("base64url");

    // Act

    const interventionResponse = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {},
        { internalPairwiseId: pairwiseId }
      )
    );

    //Assert
    expect(interventionResponse.statusCode).toBe(200);
    expect(JSON.parse(interventionResponse.body)).toStrictEqual({
      intervention: defaultIntervention(),
      state: defaultState(),
    });
  });

  it.each(["POST", "PUT", "PATCH", "HEAD", "DELETE"])(
    "returns a 405 for an invalid HTTP",
    async (httpMethod) => {
      //Arrange
      const pairwiseId = "urn:fdc:" + randomBytes(32).toString("base64url");

      // Act

      const interventionResponse = await handler(
        createApiGatewayEvent(
          httpMethod,
          "",
          {},
          {},
          { internalPairwiseId: pairwiseId }
        )
      );

      //Assert
      expect(interventionResponse.statusCode).toBe(405);
      expect(interventionResponse.body).toStrictEqual("Method not allowed");
    }
  );

  it("returns a 400 fot no pairwiseID", async () => {
    // Act

    const interventionResponse = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {},
        { internalPairwiseId: undefined }
      )
    );

    //Assert
    expect(interventionResponse.statusCode).toBe(400);
    expect(interventionResponse.body).toStrictEqual(
      "No internalPairwiseId in path parameters"
    );
  });

  const putStubIntervention = async (
    stubInterventionData: StubInterventionData
  ): Promise<void> => {
    await localStackDynamoClient.put({
      TableName: tableName,
      Item: stubInterventionData,
    });
  };

  const clearStubInterventions = async (): Promise<void> => {
    const items = await localStackDynamoClient.scan({
      TableName: tableName,
    });

    items.Items?.forEach((si) => {
      localStackDynamoClient.delete({
        TableName: tableName,
        Key: {
          pairwiseId: si.pairwiseId,
        },
      });
    });
  };
});
