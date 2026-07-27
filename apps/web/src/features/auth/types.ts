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
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  accessTokenExpiresAt: number;
  user: AuthUser;
};
