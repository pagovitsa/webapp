import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Λείπει η μεταβλητή περιβάλλοντος ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

// Getters ώστε η απουσία μιας τιμής να εμφανίζεται μόνο όταν χρησιμοποιείται.
export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get AUTH_SECRET() {
    return required("AUTH_SECRET");
  },
  get LOG_LEVEL() {
    return optional("LOG_LEVEL", "info");
  },
};
