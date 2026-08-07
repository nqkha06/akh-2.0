export type AuthUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  avatar: string | null;
  status: string;
  role: string;
  roles: string[];
  permissions: string[];
  impersonation: {
    actorId: number;
    actorName: string;
    actorEmail: string;
  } | null;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  accessTokenExpiresAt: number;
  user: AuthUser;
};
