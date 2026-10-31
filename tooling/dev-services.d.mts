export type DevelopmentSettings = {
  databaseUrl: string;
  testDatabaseUrl: string;
  authSecret: string;
  smtpUrl: string;
  mailpitUrl: string;
};
export function getDevelopmentSettings(): DevelopmentSettings;
export function ensureDevelopmentServices(): Promise<DevelopmentSettings>;
