export type Registration = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type UserIdentity = {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly emailVerified: boolean;
  readonly createdAt: Date;
};

export class UserError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "UserError";
  }
}

export function validatePassword(password: string): string {
  if (password.length < 12 || password.length > 128) {
    throw new UserError("Ο κωδικός χρειάζεται από 12 έως 128 χαρακτήρες.", "password");
  }
  return password;
}

export function registrationData(input: Registration): Registration {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    throw new UserError("Το όνομα χρήστη χρειάζεται 3–30 λατινικούς χαρακτήρες, αριθμούς, τελεία ή κάτω παύλα.", "username");
  }
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  for (const [field, value] of [["firstName", firstName], ["lastName", lastName]]) {
    if (value && (value.length > 100 || /[\u0000-\u001f\u007f]/.test(value))) {
      throw new UserError("Το πεδίο χρειάζεται έως 100 χαρακτήρες χωρίς χαρακτήρες ελέγχου.", field);
    }
  }
  return { username, email: input.email.trim().toLowerCase(), password: validatePassword(input.password), firstName, lastName };
}
