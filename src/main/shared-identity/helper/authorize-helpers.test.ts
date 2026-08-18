import { CodedError, createJsonResult } from "../../helper/result-helper";
import { handlePost } from "./authorize-helpers";

import * as dynamoService from "../service/dynamodb-form-response-service";

const IDENTITY_STUB_NAME = "IpvStub";

describe("Identity authorize helpers test", () => {
  describe("Handle POST requests", () => {
    const redirectUri = new URL("http://test.com/redirect");

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should return 400 error when body is not present", async () => {
      const action = async () =>
        await handlePost(IDENTITY_STUB_NAME, undefined, redirectUri, () => {});

      await expect(action).rejects.toThrow(
        new CodedError(400, "Missing request body")
      );
    });

    it("should return 500 error when failing to get state from dynamo", async () => {
      vi.spyOn(dynamoService, "getStateWithAuthCode").mockThrow(
        new Error("Failed to get state from dynamo")
      );

      const action = async () =>
        await handlePost(IDENTITY_STUB_NAME, "test=abc", redirectUri, () => {});

      await expect(action).rejects.toThrow(
        new CodedError(
          500,
          "dynamoDb error: Error: Failed to get state from dynamo"
        )
      );
    });

    it("should return early redirect when errors are handled", async () => {
      vi.spyOn(dynamoService, "getStateWithAuthCode").mockResolvedValue(
        "test-state"
      );
      const result = await handlePost(
        IDENTITY_STUB_NAME,
        "error=access_denied",
        redirectUri,
        (parsedBody, url) => {
          if (parsedBody["error"] === "access_denied") {
            url.searchParams.append("error", "access_denied");
            return url;
          }
        }
      );

      expect(result).toStrictEqual(
        createJsonResult(
          302,
          {
            message: `Redirecting to http://test.com/redirect?state=test-state&error=access_denied`,
          },
          {
            Location:
              "http://test.com/redirect?state=test-state&error=access_denied",
          }
        )
      );
    });
  });
});
