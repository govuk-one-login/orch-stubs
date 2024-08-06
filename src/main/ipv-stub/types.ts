export interface UserIdentity {
  sub: string;
  vot: string;
  vtm: string;
  "https://vocab.account.gov.uk/v1/credentialJWT": string[];
  "https://vocab.account.gov.uk/v1/coreIdentity": CoreIdentity;
  "https://vocab.account.gov.uk/v1/address": Address[];
  "https://vocab.account.gov.uk/v1/drivingPermit": DrivingPermit[];
  "https://vocab.account.gov.uk/v1/socialSecurityRecord": SocialSecurityRecord[];
  "https://vocab.account.gov.uk/v1/passport": Passport[];
  "https://vocab.account.gov.uk/v1/returnCode": ReturnCode[];
}

export interface CoreIdentity {
  name: Name[];
  birthDate: BirthDate[];
}

export interface Name {
  nameParts: NamePart[];
}

export interface NamePart {
  type: string;
  value: string;
}

export interface BirthDate {
  value: string;
}

export interface Address {
  addressCountry: string;
  uprn: string | null;
  buildingName: string;
  streetName: string;
  postalCode: string;
  buildingNumber: string;
  addressLocality: string;
  validFrom: string;
}

export interface DrivingPermit {
  personalNumber: string;
  fullAddress: string;
  issueNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
}

export interface SocialSecurityRecord {
  socialSecurityRecord: SocialSecurityRecordEntry[];
}

export interface SocialSecurityRecordEntry {
  personalNumber: string;
}

export interface Passport {
  documentNumber: string;
  expiryDate: string;
}

export interface ReturnCode {
  code: string;
}
