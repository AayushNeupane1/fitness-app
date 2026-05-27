export type UserRole = 'admin' | 'member' | 'trainer';

export const UserRoles = {
  Admin: 'admin',
  Member: 'member',
  Trainer: 'trainer',
} as const;
