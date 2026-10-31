export type RegisterUserInput = { username: string; email: string; password: string; firstName: string; lastName: string };
export type SignInInput = { username: string; password: string };
export type PasswordResetInput = { token: string; password: string };
export type UserProfile = {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly emailVerified: boolean;
  readonly createdAt: string;
};
export type AuthMode = "register" | "login" | "forgot-password" | "reset-password";
export type AuthAppearance = "nucleus" | "smart-save" | "midnight";
export type AuthField = "username" | "email" | "password" | "confirmPassword" | "firstName" | "lastName" | "token";
export type AuthValues = Partial<Record<"username" | "email" | "firstName" | "lastName", string>>;
export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
  values?: AuthValues;
};
