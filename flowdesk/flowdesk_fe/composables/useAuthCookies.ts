const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export const useAccessTokenCookie = () =>
  useCookie<string | null>("access_token", {
    maxAge: ACCESS_TOKEN_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });

export const useRefreshTokenCookie = () =>
  useCookie<string | null>("refresh_token", {
    maxAge: REFRESH_TOKEN_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });

export const clearAuthCookies = () => {
  useAccessTokenCookie().value = null;
  useRefreshTokenCookie().value = null;
};
