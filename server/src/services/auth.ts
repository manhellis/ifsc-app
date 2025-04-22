import { Elysia } from "elysia";
import { jwt as jwtPlugin } from "@elysiajs/jwt"; // Renamed import for clarity
import { cookie as cookiePlugin } from "@elysiajs/cookie"; // Renamed import for clarity
import { AccountType } from "@shared/types/userTypes";

// Define the structure of your JWT payload
export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    accountType: AccountType;
    // Add iat, exp if needed, though jwt plugin handles exp automatically
}

// --- Environment Variable Checks (Good Practice) ---
// Keep JWT_SECRET check as it's used by ensureAuth
const jwtSecret = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!jwtSecret) {
    console.error(
        "Missing required environment variable in services/auth.ts: JWT_SECRET"
    );
    process.exit(1);
}

// --- Elysia Plugins Config for ensureAuth ---
const jwtConfig = {
    secret: jwtSecret,
    exp: "7d", // Token expires in 7 days
};

const cookieConfig = {
    httpOnly: true,
    secure: isProduction, // Use secure cookies in production
    sameSite: "lax" as const, // Explicitly 'lax' or 'strict'. 'none' requires Secure.
    path: "/", // Ensure cookie is accessible across the site
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

// --- Type Helper for Protected Routes (Optional but Recommended) ---
// This function helps ensure the user object is present in protected routes

export const ensureAuth = () =>
    new Elysia()
        .use(cookiePlugin(cookieConfig))
        .use(jwtPlugin(jwtConfig))
        .derive(
            { as: "global" },
            async ({
                cookie,
                jwt,
                set,
            }): Promise<{ user: JWTPayload | null }> => {
                const token = cookie.auth_token.value;
                if (!token) return { user: null };

                try {
                    const payload = (await jwt.verify(token)) as JWTPayload | false;
                    if (!payload) {
                        cookie.auth_token.remove(); // Clean up invalid/expired cookie
                        return { user: null };
                    }
                    return { user: payload };
                } catch (error) {
                    // Handle potential verification errors (e.g., malformed token)
                    console.error("ensureAuth token verification error:", error);
                    cookie.auth_token.remove(); // Clean up potentially bad cookie
                    return { user: null };
                }
            }
        )
        .onBeforeHandle({ as: "global" }, ({ user, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        });
