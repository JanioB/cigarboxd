import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const EXPORT_URL =
  "https://www.accessdata.fda.gov/scripts/searchtobacco/index.cfm?action=export.viewFile";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((value) => value.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

const nowIso = () => new Date().toISOString();

const normalizeSearch = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value) => normalizeSearch(value).replace(/\s+/g, "-");

const makeId = (company, productName, stn) =>
  `${slugify(company)}-${slugify(productName)}-${slugify(stn)}`;

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseCsv = (rawText) => {
  const lines = rawText.split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(2).map(parseCsvLine);
  const headers = rows.shift() || [];

  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))
  );
};

const buildSourceLinks = (row) =>
  [
    ["Order Letter", row["Order Letter"]],
    ["Decision Summary", row["Decision Summary"]],
    ["Environmental Assessment", row["Environmental Assessment"]],
    ["FONSI", row["FONSI"]],
    ["Additional Information", row["Additional Information Link"]],
  ]
    .filter(([, url]) => url && url !== "N/A")
    .map(([label, url]) => ({
      label,
      url,
    }));

const buildCatalogRecord = (row) => {
  const company = row["Company"] || "Unknown company";
  const productName = row["Product Name"] || "Unnamed product";
  const stn = row["STN"] || "no-stn";
  const timestamp = nowIso();

  return {
    id: makeId(company, productName, stn),
    brand: company,
    name: productName,
    company,
    subCategory: row["Sub-Category"] || "",
    submissionType: row["Submission Type - Marketing Authority"] || "",
    dateOfAction: row["Date of Action"] || "",
    averageRating: 0,
    reviewCount: 0,
    status: "active",
    searchText: normalizeSearch(`${company} ${productName} ${stn}`),
    description: "",
    imageUrl: "",
    imageProvider: "placeholder",
    imageAttribution: "",
    imageLicense: "",
    imageSourceUrl: "",
    stn,
    additionalInformation: row["Additional Information"] || "",
    associatedMrtp: row["Associated MRTP"] || "",
    source: "fda",
    sourceLinks: buildSourceLinks(row),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: "seed:fda",
    updatedBy: "seed:fda",
  };
};

const getAdminDb = () => {
  if (getApps().length) {
    return getFirestore(getApps()[0]);
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
    projectId,
  });

  return getFirestore(app);
};

const seed = async () => {
  const response = await fetch(EXPORT_URL, {
    headers: {
      "User-Agent": "Cigarboxxd/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download FDA export: ${response.status}`);
  }

  const csv = await response.text();
  const allRows = parseCsv(csv);
  const cigaretteRows = allRows.filter((row) => row["Category"] === "Cigarette");
  const slicedRows = Number.isFinite(limit) ? cigaretteRows.slice(0, limit) : cigaretteRows;
  const records = slicedRows.map(buildCatalogRecord);

  console.log(`Downloaded ${allRows.length} tobacco records.`);
  console.log(`Prepared ${records.length} cigarette records.`);

  if (dryRun) {
    console.log("Dry run enabled. First record:");
    console.log(JSON.stringify(records[0], null, 2));
    return;
  }

  const db = getAdminDb();
  const batchSize = 400;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = db.batch();
    const chunk = records.slice(index, index + batchSize);

    for (const record of chunk) {
      const reference = db.collection("cigarettes").doc(record.id);
      batch.set(reference, record, { merge: true });
    }

    await batch.commit();
    console.log(`Committed ${Math.min(index + batchSize, records.length)} / ${records.length}`);
  }
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
