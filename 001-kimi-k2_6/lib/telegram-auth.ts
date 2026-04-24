import crypto from "crypto";

export function validateInitData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) return false;

  urlParams.delete("hash");

  const keys = Array.from(urlParams.keys()).sort();
  const dataCheckString = keys
    .map((key) => `${key}=${urlParams.get(key)}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computed = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return computed === hash;
}

export function parseInitData(initData: string): Record<string, string> {
  const urlParams = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  for (const [key, value] of urlParams.entries()) {
    result[key] = value;
  }
  return result;
}
