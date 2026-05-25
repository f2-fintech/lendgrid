import { NextResponse } from "next/server";

const appIDs = (process.env.APPLE_APP_SITE_ASSOCIATION_APP_IDS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: appIDs.map((appID) => ({
        appID,
        paths: ["/reset-password*"],
      })),
    },
  });
}
