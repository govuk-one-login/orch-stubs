export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value: value };
}

export const fail = <E>(error: E): Result<never, E> => {
  return { ok: false, error: error };
};
