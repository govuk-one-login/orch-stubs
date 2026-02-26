export class Optional<T> {
  private val: T | undefined;
  private isValuePresent: boolean = false;
  private isValueEmpty: boolean = true;

  private constructor(val: T | undefined) {
    this.val = val;

    if (this.isNullOrUndefined()) {
      this.isValuePresent = false;
      this.isValueEmpty = true;
    } else {
      this.isValuePresent = true;
      this.isValueEmpty = false;
    }
  }

  isPresent(): boolean {
    return this.isValuePresent;
  }

  isEmpty(): boolean {
    return this.isValueEmpty;
  }

  getValue(): T {
    if (this.isNullOrUndefined()) {
      throw new Error("Could not get value for undefined Optional");
    } else {
      return this.val as T;
    }
  }

  orElse(alternative: T): T {
    if (this.isNullOrUndefined()) {
      return alternative;
    } else {
      return this.val as T;
    }
  }

  orElseGet(supplier: () => T): T {
    if (this.isNullOrUndefined()) {
      return supplier();
    } else {
      return this.val as T;
    }
  }

  orElseThrow(errorSupplier: () => never): T {
    if (!this.isNullOrUndefined()) {
      return this.val as T;
    }

    errorSupplier();
  }

  private isNullOrUndefined() {
    return typeof this.val === "undefined" || this.val === null;
  }

  static of<T>(val: T): Optional<T> {
    return new Optional(val);
  }
}
