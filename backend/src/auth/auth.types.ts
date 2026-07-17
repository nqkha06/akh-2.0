export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  avatar: string | null;
  status: string;
  role: string;
  roles: string[];
  permissions: string[];
  tokenVersion: number;
  sessionId?: string;
};

export type AccessJwtPayload = {
  sub: number;
  email: string;
  role: string;
  sid: string;
  type: "access";
};

export type RefreshJwtPayload = {
  sub: number;
  sid: string;
  rot: number;
  type: "refresh";
};

export type RefreshAuthenticatedRequestUser = {
  payload: RefreshJwtPayload;
  refreshToken: string;
};

export type SessionContext = {
  userAgent: string | null;
  ipAddress: string | null;
};
