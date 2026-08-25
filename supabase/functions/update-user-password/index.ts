import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing required Supabase environment variables");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Could not verify caller role:", profileError.message);
      return jsonResponse({ error: "Could not verify role" }, 500);
    }

    if (profile?.role !== "admin") {
      return jsonResponse({ error: "Forbidden: admin role required" }, 403);
    }

    const body = await req.json().catch(() => null) as {
      userId?: unknown;
      password?: unknown;
    } | null;

    if (!body || typeof body.userId !== "string" || !uuidPattern.test(body.userId)) {
      return jsonResponse({ error: "A valid userId is required" }, 400);
    }

    if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 72) {
      return jsonResponse({ error: "Password must contain between 8 and 72 characters" }, 400);
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(body.userId, {
      password: body.password,
    });

    if (error) {
      console.error("Could not update user password:", error.message);
      return jsonResponse({ error: "Could not update user password" }, 400);
    }

    console.info("User password updated by admin", {
      actorId: callerData.user.id,
      targetUserId: data.user.id,
    });

    return jsonResponse({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    }, 200);
  } catch (error) {
    console.error("Unexpected error updating user password:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
