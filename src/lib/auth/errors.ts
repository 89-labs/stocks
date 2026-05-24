const SIGN_IN_ERRORS: Record<string, string> = {
  Configuration: "Server configuration error. Check NEXTAUTH_SECRET and NEXTAUTH_URL.",
  AccessDenied: "Access denied. You may not have permission to sign in.",
  Verification: "The sign-in link has expired or was already used. Request a new one.",
  OAuthSignin: "Could not start Google sign-in. Try again.",
  OAuthCallback: "Google sign-in failed. Try again.",
  OAuthCreateAccount: "Could not create account with Google.",
  EmailCreateAccount: "Could not create account with this email.",
  Callback: "Sign-in callback error. Try again.",
  OAuthAccountNotLinked:
    "This email is linked to another sign-in method. Use the original provider.",
  CredentialsSignin: "Invalid sign-in. Please try again.",
  SessionRequired: "Please sign in to continue.",
  Default: "Could not sign in. Please try again.",
};

export function getSignInErrorMessage(code?: string | null): string {
  if (!code) return SIGN_IN_ERRORS.Default;
  return SIGN_IN_ERRORS[code] ?? SIGN_IN_ERRORS.Default;
}
