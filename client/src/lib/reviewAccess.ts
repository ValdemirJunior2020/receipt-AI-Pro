// File: client/src/lib/reviewAccess.ts

export const APPLE_REVIEW_EMAIL = "apple@tester.com";
export const APPLE_REVIEW_PASSWORD = "123456";

export function isAppleReviewUser(email?: string | null) {
  if (!email) return false;
  return email.trim().toLowerCase() === APPLE_REVIEW_EMAIL.toLowerCase();
}