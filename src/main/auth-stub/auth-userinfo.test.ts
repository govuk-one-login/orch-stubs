import { Context } from "aws-lambda";
import { handler } from "./auth-userinfo";
import * as requestHeaderHelper from "./helpers/request-header-helper";
import * as accessTokenDynamoDbService from "./services/access-token-dynamodb-service";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { AccessTokenStore } from "./interfaces/access-token-store-interface";
import { DUMMY_SUBJECT_ID } from "./services/user-profile-dynamodb-service";
import { CodedError } from "../helper/result-helper";

describe("Auth User Info", () => {
  let getAccessTokenStoreSpy: jest.SpyInstance;
  let updateHasBeenUsedAccessTokenStoreSpy: jest.SpyInstance;
  let mockDynamoDbReponse: PutCommandOutput;
  const mockAccessTokenStore: AccessTokenStore = {
    accessToken: DUMMY_SUBJECT_ID,
    subjectId: "dummy-subject-id",
    claims: ["test-claims"],
    sectorIdentifier: "test-sector-identifier",
    isNewAccount: false,
    passwordResetTime: 10,
    hasBeenUsed: false,
    ttl: Math.floor(Date.now() / 1000) + 180,
  };

  beforeEach(() => {
    mockDynamoDbReponse = { $metadata: { httpStatusCode: 302 } };
    jest
      .spyOn(requestHeaderHelper, "getAccessTokenFromAuthorizationHeader")
      .mockReturnValue(DUMMY_SUBJECT_ID);
    getAccessTokenStoreSpy = jest
      .spyOn(accessTokenDynamoDbService, "getAccessTokenStore")
      .mockReturnValue(Promise.resolve(mockAccessTokenStore));
    updateHasBeenUsedAccessTokenStoreSpy = jest
      .spyOn(accessTokenDynamoDbService, "updateHasBeenUsedAccessTokenStore")
      .mockReturnValue(Promise.resolve(mockDynamoDbReponse));
  });

  it("should return a 200 with valid request", async () => {
    const response = await handler(
      createValidUserInfoRequest(),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).claims.local_account_id).toBe(
      DUMMY_SUBJECT_ID
    );
  });

  it("should return a 401 error when headers is not given", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
      },
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      "Bearer",
    ]);
  });

  it("should return a 401 error when getAccessTokenFromAuthorizationHeader fails", async () => {
    jest
      .spyOn(requestHeaderHelper, "getAccessTokenFromAuthorizationHeader")
      .mockImplementationOnce(() => {
        throw new CodedError(401, "Unable to extract (opaque) bearer token");
      });

    const response = await handler(
      createValidUserInfoRequest(),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Unable to extract (opaque) bearer token"`,
    ]);
  });

  it("should return a 401 error when access token has been used", async () => {
    jest
      .spyOn(accessTokenDynamoDbService, "getAccessTokenStore")
      .mockReturnValueOnce(
        Promise.resolve({ ...mockAccessTokenStore, hasBeenUsed: true })
      );

    const response = await handler(
      createValidUserInfoRequest(),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Invalid bearer token"`,
    ]);
  });

  it("should return a 401 error when access token has expired", async () => {
    jest
      .spyOn(accessTokenDynamoDbService, "getAccessTokenStore")
      .mockReturnValueOnce(
        Promise.resolve({
          ...mockAccessTokenStore,
          ttl: Math.floor(Date.now() / 1000) - 180,
        })
      );

    const response = await handler(
      createValidUserInfoRequest(),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Invalid bearer token"`,
    ]);
  });

  describe("accessing dynamoDb", () => {
    it("should try to add an auth code store to dynamoDb", async () => {
      await handler(createValidUserInfoRequest(), {} as Context, () => {});

      expect(getAccessTokenStoreSpy).toHaveBeenCalledTimes(1);
      expect(updateHasBeenUsedAccessTokenStoreSpy).toHaveBeenCalledTimes(1);
    });

    it("should return a 401 error when access token dynamo errors", async () => {
      jest
        .spyOn(accessTokenDynamoDbService, "getAccessTokenStore")
        .mockRejectedValueOnce(new Error("failed to find in database"));

      const response = await handler(
        createValidUserInfoRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(401);
      expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
        `Bearer error="invalid_token", error_description="Error: failed to find in database"`,
      ]);
    });

    it("should return a 500 error when dynamo errors", async () => {
      jest
        .spyOn(accessTokenDynamoDbService, "updateHasBeenUsedAccessTokenStore")
        .mockImplementation(() => {
          throw new Error();
        });

      const response = await handler(
        createValidUserInfoRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).message).toBe("dynamoDb error: Error");
    });
  });

  function createValidUserInfoRequest() {
    return {
      httpMethod: "GET",
      headers: {
        Authorization: "test",
      },
    };
  }
});
