export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  avatar: string | null;
  status: string;
  role: string;
  tokenVersion: number;
};

export type JwtPayload = {
  sub: number;
  email: string;
  role: string;
  version: number;
};
