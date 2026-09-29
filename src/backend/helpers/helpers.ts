export function capitalizeFirstLetter(string: string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function DecodeJWTbase64(token: string) {
  const parsed = JSON.parse(token);
  const decoded = Buffer.from(parsed.publicKey, "base64").toString();
  return decoded;
}
