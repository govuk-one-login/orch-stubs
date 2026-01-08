import { Context } from "aws-lambda";
import { handler } from "./auth-userinfo";
import * as requestHeaderHelper from "./helpers/request-header-helper";
import * as accessTokenDynamoDbService from "./services/access-token-dynamodb-service";
import * as userProfileDynamoDbService from "./services/user-profile-dynamodb-service";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { AccessTokenStore } from "./interfaces/access-token-store-interface";
import { CodedError } from "../helper/result-helper";
import { createUserProfile } from "./test-helper/mock-user-profile-data-helper";

describe("Auth User Info", () => {
  const mockEmail = "testEmail";
  const mockSubjectId = "testSubjectId";
  const mockAccessTokenStore: AccessTokenStore = {
    accessToken: mockSubjectId,
    subjectId: "dummy-subject-id",
    claims: ["test-claims"],
    sectorIdentifier: "test-sector-identifier",
    isNewAccount: false,
    passwordResetTime: 10,
    hasBeenUsed: false,
    ttl: Math.floor(Date.now() / 1000) + 180,
  };

  let getAccessTokenStoreSpy: jest.SpyInstance;
  let updateHasBeenUsedAccessTokenStoreSpy: jest.SpyInstance;
  let getUserProfileBySubjectId: jest.SpyInstance;
  let mockDynamoDbReponse: PutCommandOutput;

  beforeEach(() => {
    mockDynamoDbReponse = { $metadata: { httpStatusCode: 302 } };
    jest
      .spyOn(requestHeaderHelper, "getAccessTokenFromAuthorizationHeader")
      .mockReturnValue(mockSubjectId);
    getAccessTokenStoreSpy = jest
      .spyOn(accessTokenDynamoDbService, "getAccessTokenStore")
      .mockResolvedValue(mockAccessTokenStore);
    updateHasBeenUsedAccessTokenStoreSpy = jest
      .spyOn(accessTokenDynamoDbService, "updateHasBeenUsedAccessTokenStore")
      .mockResolvedValue(mockDynamoDbReponse);
    getUserProfileBySubjectId = jest
      .spyOn(userProfileDynamoDbService, "getUserProfileBySubjectId")
      .mockResolvedValue(createUserProfile(mockEmail, mockSubjectId));
  });

  it("should return a 200 with valid request", async () => {
    const response = await handler(
      createValidUserInfoRequest(),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).local_account_id).toBe(mockSubjectId);
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
      .mockResolvedValueOnce({ ...mockAccessTokenStore, hasBeenUsed: true });

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
      .mockResolvedValueOnce({
        ...mockAccessTokenStore,
        ttl: Math.floor(Date.now() / 1000) - 180,
      });

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

    it("should return a 500 error when failing to update access-token-store", async () => {
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

    it("should return a 500 error when failing to get user-profile", async () => {
      getUserProfileBySubjectId = jest
        .spyOn(userProfileDynamoDbService, "getUserProfileBySubjectId")
        .mockImplementation(() => {
          throw new Error();
        });

      const response = await handler(
        createValidUserInfoRequest(),
        {} as Context,
        () => {}
      );

      expect(getUserProfileBySubjectId).toHaveBeenCalledTimes(1);
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
