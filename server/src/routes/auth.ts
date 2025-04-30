import { Elysia, redirect, t } from "elysia";
import { OAuth2Client } from "google-auth-library";
import { jwt } from "@elysiajs/jwt";
import { cookie as cookiePlugin } from "@elysiajs/cookie";
import {
    createUser,
    getUserByGoogleId,
    getUserByEmail,
    updateUser,
} from "../models/user";
import { AccountType } from "@shared/types/userTypes";
import { User } from "../models/user";

// Define the structure of your JWT payload from services/auth.ts
export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    accountType: AccountType;
    // Add iat, exp if needed, though jwt plugin handles exp automatically
}

// Google OAuth client configuration
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.FRONTEND_URL + "/api/auth/google/callback";
   
const jwtSecret = process.env.JWT_SECRET;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

if (!googleClientId || !googleClientSecret || !jwtSecret) {
    console.error(
        "Missing required environment variables in routes/auth.ts: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET"
    );
    // Consider a more graceful error handling or configuration management approach
    // For now, logging and exiting might be okay in development.
    process.exit(1);
}

const client = new OAuth2Client({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    redirectUri: redirectUri,
});

// JWT configuration
const jwtConfig = {
    secret: jwtSecret,
    exp: "7d", // Token expires in 7 days
};

// Create cookie plugin with specific options
const cookieConfig = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

// Create JWT plugin
const jwtInstance = jwt(jwtConfig);

// Auth routes
export const authRoutes = new Elysia({ prefix: "/auth" })
    .use(cookiePlugin(cookieConfig))
    .use(jwtInstance)
    // Add registration endpoint
    .post(
        "/register",
        async ({ body, jwt, cookie, set }) => {
            const { email, password, name } = body;

            try {
                if (!email || !password) {
                    set.status = 400;
                    return { error: "Email and password are required" };
                }

                const existingUser = await getUserByEmail(email);
                if (existingUser) {
                    set.status = 409;
                    return { error: "User with this email already exists" };
                }

                const passwordHash = await Bun.password.hash(password);

                const newUser = await createUser({
                    email,
                    name: name || email.split("@")[0],
                    passwordHash,
                    accountType: AccountType.USER,
                });

                if (!newUser?._id) {
                    throw new Error("User creation failed, no ID returned.");
                }

                const payload: Omit<JWTPayload, "iat" | "exp"> = {
                    userId: newUser._id.toString(),
                    email: newUser.email,
                    name: newUser.name,
                    accountType: newUser.accountType,
                };
                const token = await jwt.sign(payload);

                cookie.auth_token.set({ value: token });

                return redirect(`${frontendUrl}/dashboard`);
            } catch (error: any) {
                console.error("Registration error:", error);
                console.log(error.message);
                set.status = 500;
                return { error: "Registration failed", details: error.message };
            }
        },
        {
            body: t.Object({
                email: t.String({ format: "email" }),
                password: t.String({ minLength: 8 }),
                name: t.Optional(t.String()),
            }),
            detail: { summary: "Register a new user with email and password" },
        }
    )
    // Add login endpoint
    .post(
        "/login",
        async ({ body, jwt, cookie, set }) => {
            const { email, password } = body;

            try {
                const user = await getUserByEmail(email);
                if (!user?._id) {
                    set.status = 401;
                    return { error: "Invalid email or password" };
                }

                if (!user.passwordHash) {
                    set.status = 401;
                    return {
                        error: "Account exists but uses social login (e.g., Google). Try logging in with Google.",
                    };
                }

                const isPasswordValid = await Bun.password.verify(
                    password,
                    user.passwordHash
                );
                if (!isPasswordValid) {
                    set.status = 401;
                    return { error: "Invalid email or password" };
                }

                const payload: Omit<JWTPayload, "iat" | "exp"> = {
                    userId: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    accountType: user.accountType,
                };
                const token = await jwt.sign(payload);

                cookie.auth_token.set({ value: token });

                return redirect(`${frontendUrl}/dashboard`);
            } catch (error: any) {
                console.error("Login error:", error);
                set.status = 500;
                return { error: "Login failed", details: error.message };
            }
        },
        {
            body: t.Object({
                email: t.String({ format: "email" }),
                password: t.String(),
            }),
            detail: { summary: "Login with email and password" },
        }
    )
    .get(
        "/google",
        async ({ redirect }) => {
            const authUrl = client.generateAuthUrl({
                access_type: "offline",
                scope: ["profile", "email"],
                prompt: "consent",
            });
            return redirect(authUrl);
        },
        {
            detail: { summary: "Redirect user to Google for authentication" },
        }
    )
    .get(
        "/google/callback",
        async ({ query, jwt, cookie, set, redirect }) => {
            const code = query.code as string;

            if (!code) {
                set.status = 400;
                return { error: "Authorization code not provided" };
            }

            try {
                const { tokens } = await client.getToken(code);
                if (!tokens.id_token) {
                    set.status = 401;
                    return { error: "Failed to retrieve ID token from Google" };
                }

                const ticket = await client.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: googleClientId,
                });

                const payload = ticket.getPayload();
                if (!payload) {
                    set.status = 401;
                    return { error: "Invalid Google ID token" };
                }

                const { sub: googleId, email, name, picture } = payload;

                if (!email || !googleId) {
                    set.status = 400;
                    return {
                        error: "Email or Google ID missing from Google profile data",
                    };
                }

                let user: User | null = await getUserByGoogleId(googleId);

                if (!user) {
                    const existingUserByEmail = await getUserByEmail(email);
                    if (existingUserByEmail?._id) {
                        user = await updateUser(
                            existingUserByEmail._id.toString(),
                            { googleId }
                        );
                        if (!user)
                            throw new Error(
                                "Failed to link Google ID to existing user"
                            );
                    } else {
                        user = await createUser({
                            googleId,
                            email,
                            name: name || email.split("@")[0],
                            picture,
                            accountType: AccountType.USER,
                        });
                        if (!user?._id)
                            throw new Error(
                                "Failed to create new user via Google"
                            );
                    }
                }

                if (!user?._id) {
                    throw new Error(
                        "User object is invalid after find/create process."
                    );
                }

                const appPayload: Omit<JWTPayload, "iat" | "exp"> = {
                    userId: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    accountType: user.accountType,
                };
                const token = await jwt.sign(appPayload);

                cookie.auth_token.set({ value: token });

                console.log(
                    `Redirecting user ${user.email} to ${frontendUrl}/dashboard`
                );
                return redirect(`/dashboard`);
            } catch (error: any) {
                console.error("Google auth callback error:", error);
                set.status = 500;
                // Consider redirecting to a frontend error page
                return {
                    error: "Google authentication failed",
                    details: error.message,
                };
            }
        },
        {
            query: t.Object({ code: t.String() }),
            detail: { summary: "Handles the callback from Google OAuth" },
        }
    )
    .get(
        "/me",
        async ({ cookie, jwt, set }) => {
            const token = cookie.auth_token.value;

            if (!token) {
                set.status = 401;
                return { error: "Not authenticated" };
            }

            try {
                const payload = (await jwt.verify(token)) as JWTPayload | false;

                if (!payload) {
                    cookie.auth_token.remove();
                    set.status = 401;
                    return { error: "Invalid or expired token" };
                }

                return {
                    user: {
                        userId: payload.userId,
                        email: payload.email,
                        name: payload.name,
                        accountType: payload.accountType,
                    },
                };
            } catch (error: any) {
                console.error("Token verification error:", error);
                cookie.auth_token.remove();
                set.status = 401;
                return { error: "Invalid token", details: error.message };
            }
        },
        {
            detail: {
                summary: "Get information about the currently logged-in user",
            },
        }
    )
    .post(
        "/logout",
        async ({ cookie, set }) => {
            try {
                cookie.auth_token.remove();
                return { success: true, message: "Logged out successfully" };
                // Optional: Redirect instead
                // set.redirect = frontendUrl + '/login';
                // return;
            } catch (error: any) {
                console.error("Logout error:", error);
                set.status = 500;
                return { error: "Logout failed", details: error.message };
            }
        },
        {
            detail: { summary: "Log the current user out" },
        }
    );
