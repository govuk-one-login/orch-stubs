import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { getHeaderValueFromHeaders } from "./request-header-helper";

it("should return header value from header", () => {
  const headers: APIGatewayProxyEventHeaders = { header: "header value" };
  const headerValue = getHeaderValueFromHeaders(headers, "header");
  expect(headerValue).toBe("header value");
});

test("should return null when header cannot be found in headers", () => {
  const headers: APIGatewayProxyEventHeaders = { header: "header value" };
  const headerValue = getHeaderValueFromHeaders(headers, "new-header");
  expect(headerValue).toBe(null);
});

describe("matchCase tests", () => {
  const headers: APIGatewayProxyEventHeaders = { header: "header value" };
  test("should return header value from header with matchCase set to true", () => {
    const headerValue = getHeaderValueFromHeaders(headers, "HEADER", true);
    expect(headerValue).toBe("header value");
  });

  it("should return null when matchCase set to false", () => {
    const headerValue = getHeaderValueFromHeaders(headers, "HEADER", false);
    expect(headerValue).toBe(null);
  });
});
