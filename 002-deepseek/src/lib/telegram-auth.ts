import { createHmac } from "crypto";

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface ParsedInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
}

/**
 * Validates Telegram Mini App initData using HMAC-SHA256.
 * Returns the parsed user data if valid, throws on invalid signature.
 */
export function validateInitData(initData: string, botToken: string): ParsedInitData {
  // Parse URL-encoded initData
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing hash in initData");
  }

  // Remove hash, sort keys, build data-check-string
  const dataCheckArr: string[] = [];
  params.forEach((value, key) => {
    if (key !== "hash") {
      dataCheckArr.push(`${key}=${value}`);
    }
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  // Compute secret key from bot token
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();

  // Compute hash
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    throw new Error("Invalid initData signature");
  }

  // Parse user data
  const userStr = params.get("user");
  if (!userStr) {
    throw new Error("Missing user in initData");
  }

  const user: TelegramUser = JSON.parse(userStr);

  return {
    user,
    auth_date: parseInt(params.get("auth_date") || "0", 10),
    hash,
    query_id: params.get("query_id") || undefined,
  };
}
