import { Context } from "aws-lambda";
import { handler } from "./auth-token";
import * as accessTokenDynamoDbService from "./services/access-token-dynamodb-service";
import * as authCodeDynamoDbService from "./services/auth-code-dynamodb-service";
import * as tokenValidationHelper from "./helpers/token-validation-helper";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";

describe("Auth Token", () => {
  let addAccessTokenStoreSpy: jest.SpyInstance;
  let updateHasBeenUsedAuthCodeStoreSpy: jest.SpyInstance;
  let validateAuthCodeSpy: jest.SpyInstance;
  let mockDynamoDbReponse: PutCommandOutput;

  beforeEach(() => {
    mockDynamoDbReponse = { $metadata: { httpStatusCode: 200 } };
    addAccessTokenStoreSpy = jest
      .spyOn(accessTokenDynamoDbService, "addAccessTokenStore")
      .mockReturnValue(Promise.resolve(mockDynamoDbReponse));
    updateHasBeenUsedAuthCodeStoreSpy = jest
      .spyOn(authCodeDynamoDbService, "updateHasBeenUsedAuthCodeStore")
      .mockReturnValue(Promise.resolve(mockDynamoDbReponse));
    validateAuthCodeSpy = jest
      .spyOn(tokenValidationHelper, "validateAuthCode")
      .mockResolvedValue(undefined);
  });

  it("should return an access token when given an auth code", async () => {
    const response = await handler(
      createTokenRequest(),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty("access_token");
  });

  describe("validation of request parameters", () => {
    it("should error if auth-code validation fails", async () => {
      const authCodeValidationFailureMessage = "Auth Code validation failed";
      validateAuthCodeSpy = jest
        .spyOn(tokenValidationHelper, "validateAuthCode")
        .mockRejectedValueOnce(new Error(authCodeValidationFailureMessage));

      const response = await handler(
        createTokenRequest(),
        {} as Context,
        () => {}
      );

      expect(validateAuthCodeSpy).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
    });
  });

  describe("accessing dynamoDb", () => {
    it("should try to add an access token to dynamoDb", async () => {
      await handler(createTokenRequest(), {} as Context, () => {});

      expect(addAccessTokenStoreSpy).toHaveBeenCalledTimes(1);
    });

    it("should try to update the auth code to hasBeenUsed in dynamoDb", async () => {
      await handler(createTokenRequest(), {} as Context, () => {});

      expect(updateHasBeenUsedAuthCodeStoreSpy).toHaveBeenCalledTimes(1);
    });

    it("should return a 500 error when failing to add an access token to dynamoDb", async () => {
      addAccessTokenStoreSpy = jest
        .spyOn(accessTokenDynamoDbService, "addAccessTokenStore")
        .mockImplementation(() => {
          throw new Error();
        });

      const response = await handler(
        createTokenRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(500);
    });

    it("should return a 500 error when failing to update the auth code to hasBeenUsed in dynamoD", async () => {
      updateHasBeenUsedAuthCodeStoreSpy = jest
        .spyOn(authCodeDynamoDbService, "updateHasBeenUsedAuthCodeStore")
        .mockImplementation(() => {
          throw new Error();
        });

      const response = await handler(
        createTokenRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(500);
    });
  });

  function createTokenRequest() {
    return {
      httpMethod: "POST",
      body: {
        code: "testAuthCode",
      },
    };
  }
});
