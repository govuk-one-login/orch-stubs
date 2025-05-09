type ErrorCode = 400 | 405 | 500;

export class QueryParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryParamsError";
  }
}

export class CodedError extends Error {
  public code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class JwtValidationError extends Error {
  cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "JwtValidationError";
    this.cause = cause;
  }
}

export class JwtClaimsValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtClaimsValueError";
  }
}

export class DecryptionError extends Error {
  cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "DecryptionError";
    this.cause = cause;
  }
}

export class BadRequestError extends Error {
  private status: number;
  level?: string;
  constructor(message: string, code?: number | string) {
    super(code ? `${code}:${message}` : `${message}`);
    this.status = 400;
  }
}

export class InvalidBase64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBase64Error";
  }
}
