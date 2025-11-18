import { Context } from "aws-lambda";
import { handler } from "./auth-authorize.ts";
import * as authCodeDynamoDbService from "./services/auth-code-dynamodb-service.ts";
import * as userProfileDynamoDbService from "./services/user-profile-dynamodb-service.ts";
import * as decryptionHelper from "./helpers/decryption-helper.ts";
import * as jwtHelper from "./helpers/jwt-helper.ts";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { createMockClaims } from "./test-helper/test-data.ts";
import { mockEnvVariableSetup } from "./test-helper/test-setup.ts";
import { createUserProfile } from "./test-helper/mock-user-profile-data-helper.ts";

describe("Auth Authorize", () => {
  describe("GET endpoint", () => {
    let addUserProfileSpy: jest.SpyInstance;
    let mockDynamoDbReponse: PutCommandOutput;

    beforeEach(() => {
      mockDynamoDbReponse = { $metadata: { httpStatusCode: 302 } };
      addUserProfileSpy = jest
        .spyOn(userProfileDynamoDbService, "addUserProfile")
        .mockResolvedValue(mockDynamoDbReponse);
    });

    it("should try add a user-profile", async () => {
      await handler(createValidAuthorizeRequest(), {} as Context, () => {});

      expect(addUserProfileSpy).toHaveBeenCalledTimes(1);
    });

    it("should return a 500 when failing to get user-profile", async () => {
      addUserProfileSpy = jest
        .spyOn(userProfileDynamoDbService, "addUserProfile")
        .mockImplementation(() => {
          throw new Error();
        });

      const response = await handler(
        createValidAuthorizeRequest(),
        {} as Context,
        () => {}
      );

      expect(addUserProfileSpy).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).message).toBe("dynamoDb error: Error");
    });

    function createValidAuthorizeRequest() {
      return {
        httpMethod: "GET",
        body: {},
      };
    }
  });

  describe("POST Endpoint", () => {
    let addAuthCodeStoreSpy: jest.SpyInstance;
    let getUserProfileByEmailSpy: jest.SpyInstance;
    let mockDynamoDbReponse: PutCommandOutput;

    beforeEach(() => {
      mockDynamoDbReponse = { $metadata: { httpStatusCode: 302 } };
      addAuthCodeStoreSpy = jest
        .spyOn(authCodeDynamoDbService, "addAuthCodeStore")
        .mockResolvedValue(mockDynamoDbReponse);
      getUserProfileByEmailSpy = jest
        .spyOn(userProfileDynamoDbService, "getUserProfileByEmail")
        .mockResolvedValue(createUserProfile("testEmail", "testSubjectId"));
      jest
        .spyOn(decryptionHelper, "decrypt")
        .mockResolvedValue(
          "eyJhbGciOiJFUzI1NiJ9.eyJjbGllbnQtbmFtZSI6ImRpLWF1dGgtc3R1Yi1yZWx5aW5nLXBhcnR5LXNhbmRwaXQifQ.FFNDcj3znW5JPillhEIgCvWFCinlX0PMdvfVxgDArYueiVH6VDvlhaZyS70ocm9eOXBlB8pe449vpJrcKllBBg"
        );
      jest
        .spyOn(jwtHelper, "validateClaims")
        .mockResolvedValue(createMockClaims());
      mockEnvVariableSetup();
    });

    it("should return a 302 with valid request", async () => {
      const response = await handler(
        createValidAuthorizeRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(302);
    });

    it("should return a 400 error when body is not given", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
        },
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe("Missing request body");
    });

    it("should return a 400 error when response_type is not given", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          body: {
            client_id: "orchestrationAuth",
          },
        },
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe(
        "Response type is not set"
      );
    });

    it("should return a 400 error when client_id is not given", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          body: {
            response_type: "code",
          },
        },
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe(
        "Client ID value is incorrect"
      );
    });

    it("should return a 400 error when validateClaim fails", async () => {
      jest
        .spyOn(jwtHelper, "validateClaims")
        .mockRejectedValueOnce(new Error("Invalid claims"));

      const response = await handler(
        createValidAuthorizeRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe("Invalid claims");
    });

    it("should return a 400 error when decrypt fails", async () => {
      jest
        .spyOn(decryptionHelper, "decrypt")
        .mockRejectedValueOnce(new Error("Decryption failed"));

      const response = await handler(
        createValidAuthorizeRequest(),
        {} as Context,
        () => {}
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe("Decryption failed");
    });

    describe("accessing dynamoDb", () => {
      it("should return a 500 when failing to get user-profile", async () => {
        getUserProfileByEmailSpy = jest
          .spyOn(userProfileDynamoDbService, "getUserProfileByEmail")
          .mockImplementation(() => {
            throw new Error();
          });

        const response = await handler(
          createValidAuthorizeRequest(),
          {} as Context,
          () => {}
        );

        expect(getUserProfileByEmailSpy).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).message).toBe("dynamoDb error: Error");
      });

      it("should try to add an auth code store to dynamoDb", async () => {
        await handler(createValidAuthorizeRequest(), {} as Context, () => {});

        expect(addAuthCodeStoreSpy).toHaveBeenCalledTimes(1);
      });

      it("should return a 500 error when failing to add an access token to dynamoDb", async () => {
        addAuthCodeStoreSpy = jest
          .spyOn(authCodeDynamoDbService, "addAuthCodeStore")
          .mockImplementation(() => {
            throw new Error();
          });

        const response = await handler(
          createValidAuthorizeRequest(),
          {} as Context,
          () => {}
        );

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).message).toBe("dynamoDb error: Error");
      });
    });

    function createValidAuthorizeRequest() {
      return {
        httpMethod: "POST",
        body: {
          client_id: "orchestrationAuth",
          response_type: "code",
          request:
            "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.ZjhoKAi_KnCTbSTKjX8WIwdEXo_XuNbDRzJRtmt3mLS6FCXaaUTyyOXi4qQyZNjA2Fxn6D4UB121kmF58mcyDrhHtSN-ebT3wnsJ_VOd5Mv0IVRNRAQnAW15dWgJy_uLHva6IKgL6GNrH9DYrPhEG1f9e6b8qMZiag3OAmtX6bZAtHFikw3i9Dvhdx_HMKCO1nX5z5qatF8K6XxAjq1-W0TT5OllJQC8aiE2Xtznu23Uft2jnrdqidvaG0JBdaMjIvcy-cvVaogW4WyUyXGLvna4hC7fmU2TZYqtk63bhv4XYrCfEwNe5qLDXW8-G6EyJO6C3OTMh8otvm1_EDS3LQ.78xU5KBJixV96DRA.YqpzvqoyiDCjUJj2qIhg1k3SuxFdK4l2ou4uja1g-aQjcJZ15C-9szBXCBtYNqqGuoymgi_mcJNyf0DaCkAcsUFyQhe2fQv9YkkkhwcJSe47DDnLNiJyL7hA8cJpDJkzrxoRzVdimbaCEUs_pkYPMi3ojEivE2Fpz7rg5yCLf_VjR5SLlohWSG7qJ1ypkpon4JJjYGKVTzu98XLJuSVqdJq_81pwSn-OMm5V90qmNozzeA.2dFUI2yJLGxgo6yEDfqtjw",
        },
      };
    }
  });
});
