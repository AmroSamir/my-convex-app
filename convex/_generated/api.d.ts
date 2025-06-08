/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as blog from "../blog.js";
import type * as chat from "../chat.js";
import type * as emailActivation from "../emailActivation.js";
import type * as http from "../http.js";
import type * as menu from "../menu.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as router from "../router.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blog: typeof blog;
  chat: typeof chat;
  emailActivation: typeof emailActivation;
  http: typeof http;
  menu: typeof menu;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  router: typeof router;
  tasks: typeof tasks;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
