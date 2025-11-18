import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { CodedError } from "../../helper/result-helper.ts";

export function getHeaderValueFromHeaders(
  headers: APIGatewayProxyEventHeaders,
  headerName: string,
  matchLowerCase = true
) {
  if (!headers) {
    return null;
  } else if (headers[headerName]) {
    return headers[headerName];
  } else if (matchLowerCase && headers[headerName.toLowerCase()]) {
    return headers[headerName.toLowerCase()];
  } else {
    return null;
  }
}

export const getAccessTokenFromAuthorizationHeader = (
  authorizationHeader: string
): string => {
  try {
    if (!authorizationHeader.startsWith("bearer")) {
      throw new CodedError(
        401,
        "authorizationHeader is not a bearer access token type"
      );
    }

    const parts = authorizationHeader.split(/\s/);

    if (parts.length !== 2) {
      throw new CodedError(401, "Invalid HTTP Authorization header value");
    }

    if (!parts[1]) {
      throw new CodedError(401, "token value is empty");
    }

    return parts[1];
  } catch {
    throw new CodedError(401, "Unable to extract (opaque) bearer token");
  }
};
