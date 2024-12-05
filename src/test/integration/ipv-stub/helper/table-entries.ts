export interface TableEntry {
  UserIdentityId: string;
}

export interface UserIdentityEntry extends TableEntry {
  userIdentity: object;
  ttl: number;
}

export interface StateEntry extends TableEntry {
  state: string;
}
