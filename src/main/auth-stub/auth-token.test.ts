import { Context } from "aws-lambda";
import { handler } from "./auth-token.ts";
import * as accessTokenDynamoDbService from "./services/access-token-dynamodb-service.ts";
import * as authCodeDynamoDbService from "./services/auth-code-dynamodb-service.ts";
import * as tokenValidationHelper from "./helpers/token-validation-helper.ts";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { mockEnvVariableSetup } from "./test-helper/test-setup.ts";
import { MockInstance } from "vitest";
import { createRemoteJWKSet, generateKeyPair } from "jose";

vi.mock(import("jose"), async (importActual) => {
  const actual = await importActual<typeof import("jose")>();
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(),
  };
});
const mockedCreateRemoteJWKSet = vi.mocked(createRemoteJWKSet);
const authSigningKeyPair = await generateKeyPair("ES256");

describe("Auth Token", () => {
  let addAccessTokenStoreSpy: MockInstance;
  let updateHasBeenUsedAuthCodeStoreSpy: MockInstance;
  let validateAuthCodeSpy: MockInstance;
  let validatePlainTextParametersSpy: MockInstance;
  let ensureClientAssertionTypeSpy: MockInstance;
  let verifyClientAssertionSpy: MockInstance;
  let mockDynamoDbReponse: PutCommandOutput;

  beforeEach(async () => {
    mockDynamoDbReponse = { $metadata: { httpStatusCode: 200 } };
    addAccessTokenStoreSpy = vi
      .spyOn(accessTokenDynamoDbService, "addAccessTokenStore")
      .mockResolvedValue(mockDynamoDbReponse);
    updateHasBeenUsedAuthCodeStoreSpy = vi
      .spyOn(authCodeDynamoDbService, "updateHasBeenUsedAuthCodeStore")
      .mockResolvedValue(mockDynamoDbReponse);
    validateAuthCodeSpy = vi
      .spyOn(tokenValidationHelper, "validateAuthCode")
      .mockResolvedValue(undefined);
    validatePlainTextParametersSpy = vi
      .spyOn(tokenValidationHelper, "validatePlainTextParameters")
      .mockReturnValue(undefined);
    ensureClientAssertionTypeSpy = vi
      .spyOn(tokenValidationHelper, "ensureClientAssertionType")
      .mockReturnValue(undefined);
    verifyClientAssertionSpy = vi
      .spyOn(tokenValidationHelper, "verifyClientAssertion")
      .mockResolvedValue(undefined);
    await mockEnvVariableSetup();
    mockedCreateRemoteJWKSet.mockReturnValue((() =>
      Promise.resolve(authSigningKeyPair.publicKey)) as unknown as ReturnType<
      typeof createRemoteJWKSet
    >);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      validateAuthCodeSpy = vi
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

    it("should error if plain-text-parameters validation fails", async () => {
      const plainTextParamsValidationFailureMessage =
        "Plain text parameters validation failed";
      validatePlainTextParametersSpy = vi
        .spyOn(tokenValidationHelper, "validatePlainTextParameters")
        .mockImplementation(() => {
          throw new Error(plainTextParamsValidationFailureMessage);
        });

      const response = await handler(
        createTokenRequest(),
        {} as Context,
        () => {}
      );

      expect(validatePlainTextParametersSpy).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
    });

    it("should error if ensure-client-assertion-type validation fails", async () => {
      const ensureClientAssertionFailureMessage =
        "Plain text parameters validation failed";
      ensureClientAssertionTypeSpy = vi
        .spyOn(tokenValidationHelper, "ensureClientAssertionType")
        .mockImplementation(() => {
          throw new Error(ensureClientAssertionFailureMessage);
        });

      const response = await handler(
        createTokenRequest(),
        {} as Context,
        () => {}
      );

      expect(ensureClientAssertionTypeSpy).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
    });

    it("should error if verify-client-assertion validation fails", async () => {
      const verifyClientAssertionFailureMessage =
        "Plain text parameters validation failed";
      verifyClientAssertionSpy = vi
        .spyOn(tokenValidationHelper, "verifyClientAssertion")
        .mockImplementation(() => {
          throw new Error(verifyClientAssertionFailureMessage);
        });

      const response = await handler(
        createTokenRequest(),
        {} as Context,
        () => {}
      );

      expect(verifyClientAssertionSpy).toHaveBeenCalledTimes(1);
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
      addAccessTokenStoreSpy = vi
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
      updateHasBeenUsedAuthCodeStoreSpy = vi
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
