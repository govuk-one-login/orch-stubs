import { APIGatewayProxyEventHeaders } from "aws-lambda";

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
