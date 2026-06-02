import { NextResponse } from "next/server";

const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.lendgrid.mobile",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
