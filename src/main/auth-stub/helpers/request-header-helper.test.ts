import { APIGatewayProxyEventHeaders } from "aws-lambda";
import {
  getAccessTokenFromAuthorizationHeader,
  getHeaderValueFromHeaders,
} from "./request-header-helper.ts";

describe("Request header helper", () => {
  describe("getHeaderValueFromHeaders tests", () => {
    it("should return header value from header", () => {
      const headers: APIGatewayProxyEventHeaders = { header: "header value" };

      const headerValue = getHeaderValueFromHeaders(headers, "header");

      expect(headerValue).toBe("header value");
    });

    it("should return null when header cannot be found in headers", () => {
      const headers: APIGatewayProxyEventHeaders = { header: "header value" };

      const headerValue = getHeaderValueFromHeaders(headers, "new-header");

      expect(headerValue).toBe(null);
    });

    describe("matchCase tests", () => {
      it("should return header value from header with matchCase set to true", () => {
        const headers: APIGatewayProxyEventHeaders = { header: "header value" };

        const headerValue = getHeaderValueFromHeaders(headers, "HEADER", true);

        expect(headerValue).toBe("header value");
      });

      it("should return null when matchCase set to false", () => {
        const headers: APIGatewayProxyEventHeaders = { header: "header value" };

        const headerValue = getHeaderValueFromHeaders(headers, "HEADER", false);

        expect(headerValue).toBe(null);
      });
    });
  });

  describe("getAccessTokenFromAuthorizationHeader tests", () => {
    it("should return header value from header with valid header", () => {
      const header = "bearer testValue";

      const headerValue = getAccessTokenFromAuthorizationHeader(header);

      expect(headerValue).toBe("testValue");
    });

    it("should return null when header doesn't begin with bearer", () => {
      const header = "testValue bearer";

      const action = () => getAccessTokenFromAuthorizationHeader(header);

      expect(action).toThrow("Unable to extract (opaque) bearer token");
    });

    it("should return null when length is not 2", () => {
      const header = "bearer test value";

      const action = () => getAccessTokenFromAuthorizationHeader(header);

      expect(action).toThrow("Unable to extract (opaque) bearer token");
    });

    it("should return null when second half is empty", () => {
      const header = "bearer ";

      const action = () => getAccessTokenFromAuthorizationHeader(header);

      expect(action).toThrow("Unable to extract (opaque) bearer token");
    });
  });
});
