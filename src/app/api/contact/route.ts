import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const BODY_SIZE_LIMIT = 16_384;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const SUBJECT_MAX_LENGTH = 150;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 5_000;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

type TurnstileVerifyResult = {
  success: boolean;
};

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > BODY_SIZE_LIMIT) {
    return jsonError("Unable to process your message.", 400);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError("Invalid request.", 400);
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonError("Invalid request.", 400);
  }

  const name = readRequiredString(payload.name, NAME_MAX_LENGTH);
  const email = readRequiredString(payload.email, EMAIL_MAX_LENGTH);
  const subject = readOptionalString(payload.subject, SUBJECT_MAX_LENGTH);
  const message = readRequiredString(payload.message, MESSAGE_MAX_LENGTH);
  const website = readOptionalString(payload.website, 200);
  const turnstileToken = readRequiredString(payload.turnstileToken, 2048);

  if (!name || name.length < NAME_MIN_LENGTH) {
    return jsonError("Please enter a valid name.", 400);
  }

  if (!email || !isValidEmail(email)) {
    return jsonError("Please enter a valid email address.", 400);
  }

  if (!message || message.length < MESSAGE_MIN_LENGTH) {
    return jsonError("Please enter a longer message.", 400);
  }

  if (website) {
    return jsonError("Unable to process your message.", 400);
  }

  if (!turnstileToken) {
    return jsonError("Unable to verify your submission. Please try again.", 403);
  }

  const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecretKey) {
    console.error("Missing TURNSTILE_SECRET_KEY environment variable.");
    return jsonError("Unable to send your message right now. Please try again later.", 500);
  }

  const verificationPassed = await verifyTurnstileToken({
    secretKey: turnstileSecretKey,
    token: turnstileToken,
    remoteIp: getClientIp(request),
  });

  if (!verificationPassed) {
    return jsonError("Unable to verify your submission. Please try again.", 403);
  }

  const supabaseServer = getSupabaseServerClient();

  const { error } = await supabaseServer.from("messages").insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error("Contact form insert failed.", error);
    return jsonError("Unable to send your message right now. Please try again later.", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

function readRequiredString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function readOptionalString(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstileToken({
  secretKey,
  token,
  remoteIp,
}: {
  secretKey: string;
  token: string;
  remoteIp: string | null;
}) {
  try {
    const formData = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    if (remoteIp) {
      formData.set("remoteip", remoteIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as TurnstileVerifyResult;
    return Boolean(result.success);
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    return false;
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (!forwardedFor) {
    return null;
  }

  return forwardedFor.split(",")[0]?.trim() || null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
