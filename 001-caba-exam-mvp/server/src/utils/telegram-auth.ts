import crypto from 'node:crypto';

export function validateTelegramInitData(
  initData: string,
  botToken: string
): Record<string, string> | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) return null;

    urlParams.delete('hash');

    // Sort params alphabetically
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    // Check timestamp (valid for 24 hours)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return null;
    }

    // Return parsed data
    const result: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      if (key === 'user') {
        result[key] = value;
      } else {
        result[key] = value;
      }
    });

    return result;
  } catch (error) {
    console.error('Failed to validate Telegram initData:', error);
    return null;
  }
}

export function parseTelegramUser(userJson: string): {
  id: number;
  first_name: string;
  username?: string;
  language_code?: string;
} | null {
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}
