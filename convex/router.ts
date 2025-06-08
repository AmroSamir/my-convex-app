import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Handle activation redirects
http.route({
  path: "/activate",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    if (!token) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/?error=invalid_token"
        }
      });
    }
    
    // Redirect to the main app with the token
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/?token=${token}`
      }
    });
  })
});

export default http;
