const publicEnvNames = [
  "NEXT_PUBLIC_API_KEY",
  "NEXT_PUBLIC_AUTH_DOMAIN",
  "NEXT_PUBLIC_PROJECT_ID",
  "NEXT_PUBLIC_STORAGE_BUCKET",
  "NEXT_PUBLIC_MESSAGING_ID",
  "NEXT_PUBLIC_APP_ID",
] as const;

const serverEnvNames = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

export const getMissingPublicEnv = () =>
  publicEnvNames.filter((name) => !process.env[name]);

export const getMissingServerEnv = () =>
  serverEnvNames.filter((name) => !process.env[name]);

export const getAppUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "";

  if (!raw) {
    return "http://localhost:3000";
  }

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
};
