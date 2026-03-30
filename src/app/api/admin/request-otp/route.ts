import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_CLIENT_SECRET;

const buildCandidateUrls = (baseUrl: string) => {
  const candidates = [baseUrl];
  if (baseUrl.includes("://localhost")) {
    candidates.push(baseUrl.replace("://localhost", "://127.0.0.1"));
  } else if (baseUrl.includes("://127.0.0.1")) {
    candidates.push(baseUrl.replace("://127.0.0.1", "://localhost"));
  }
  return [...new Set(candidates)];
};

const getAccessToken = async (baseUrl: string) => {
  if (!CLIENT_ID || !CLIENT_SECRET || CLIENT_ID.includes("REPLACE_")) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLIENT_ID/NEXT_PUBLIC_CLIENT_SECRET in .env.local"
    );
  }

  const tokenResponse = await fetch(`${baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    }),
    cache: "no-store",
  });

  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.accessToken) {
    throw new Error(tokenData.message || "Invalid client credentials");
  }

  return tokenData.accessToken as string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const candidateUrls = buildCandidateUrls(API_URL);
  let lastError: unknown = null;

  try {
    for (const baseUrl of candidateUrls) {
      try {
        const accessToken = await getAccessToken(baseUrl);
        const response = await fetch(`${baseUrl}/v1/admin/request-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok && data.otp) {
          console.log(`DEBUG OTP for admin login (${body.email}): ${data.otp} (expires ${data.otpExpiry})`)
        }
        return NextResponse.json(data, { status: response.status });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("Failed to connect to backend");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to request admin OTP";
    return NextResponse.json(
      {
        status: "error",
        message: `${message}. Tried backend URLs: ${candidateUrls.join(", ")}`,
      },
      { status: 500 }
    );
  }
}
