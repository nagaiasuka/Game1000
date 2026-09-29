export const DEVELOPER_HOLD_MS = 5000;
export function acceptsDeveloperPassword(password: string) {
  return password === "pass";
}
