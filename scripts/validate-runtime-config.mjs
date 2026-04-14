const publicEnv = [
  "NEXT_PUBLIC_API_KEY",
  "NEXT_PUBLIC_AUTH_DOMAIN",
  "NEXT_PUBLIC_PROJECT_ID",
  "NEXT_PUBLIC_STORAGE_BUCKET",
  "NEXT_PUBLIC_MESSAGING_ID",
  "NEXT_PUBLIC_APP_ID",
];

const serverEnv = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
];

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "";

const missing = [...publicEnv, ...serverEnv].filter((name) => !process.env[name]);

if (!appUrl) {
  missing.push("NEXT_PUBLIC_APP_URL (or APP_URL/URL/DEPLOY_PRIME_URL)");
}

if (missing.length) {
  console.error("Missing required runtime environment variables:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && !process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes("\\n")) {
  console.warn(
    "FIREBASE_ADMIN_PRIVATE_KEY does not contain escaped newlines. Confirm your deployment platform preserved the key format."
  );
}

console.log("Runtime environment validation passed.");
