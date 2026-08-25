export type AuthMethod =
  | "password"
  | "google"
  | "impersonation"
  | "impersonation_return";

export type ImpersonationContext = {
  actorId: number;
  actorName: string;
  actorEmail: string;
};

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  avatar: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  roles: string[];
  permissions: string[];
  tokenVersion: number;
  sessionId?: string;
  impersonation?: ImpersonationContext | null;
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
  rememberMe?: boolean;
};

export type RefreshAuthenticatedRequestUser = {
  payload: RefreshJwtPayload;
  refreshToken: string;
};

export type SessionContext = {
  userAgent: string | null;
  ipAddress: string | null;
};
