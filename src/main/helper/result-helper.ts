import { APIGatewayProxyResult } from "aws-lambda";
import { logger } from "../logger";

type SuccessCode = 200 | 302;
type ErrorCode = 400 | 405 | 500;
type JsonEntity =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | JsonEntity[];
type Headers = { [header: string]: boolean | number | string };

export class CodedError extends Error {
  public code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function successfulJsonResult(
  code: SuccessCode,
  body: JsonEntity,
  headers?: Headers | undefined
): APIGatewayProxyResult {
  return {
    statusCode: code,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function successfulHtmlResult(
  code: SuccessCode,
  body: string,
  headers?: Headers | undefined
): APIGatewayProxyResult {
  return {
    statusCode: code,
    headers: { ...headers, "Content-Type": "text/html" },
    body: body,
  };
}

export function methodNotAllowedError(method: string) {
  return new CodedError(405, `Method ${method} not allowed`);
}

export async function handleErrors(
  getResult: () => Promise<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> {
  try {
    return await getResult();
  } catch (error) {
    if (error instanceof CodedError) {
      logger.error(error.message);
      return {
        statusCode: error.code,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }

    const errorStr =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error(errorStr);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Encountered an unhandled exception: ${errorStr}`,
      }),
    };
  }
}
