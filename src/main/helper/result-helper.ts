import { APIGatewayProxyResult } from "aws-lambda";
import { logger } from "../logger.ts";

type ErrorCode = 400 | 401 | 405 | 500;
type JsonEntity =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | JsonEntity[];
type Headers = Record<string, boolean | number | string>;

export class CodedError extends Error {
  public code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function createJsonResult(
  code: number,
  body: JsonEntity,
  headers?: Headers
): APIGatewayProxyResult {
  return {
    statusCode: code,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function createHtmlResult(
  code: number,
  body: string,
  headers?: Headers
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
      return createJsonResult(error.code, {
        message: error.message,
      });
    }

    const errorStr =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error(errorStr);
    return createJsonResult(500, {
      message: `Encountered an unhandled exception: ${errorStr}`,
    });
  }
}
