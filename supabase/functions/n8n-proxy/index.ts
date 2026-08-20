import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Each target maps to the secret holding its n8n webhook URL. `adminOnly`
// targets are the ones exposed from the Admin panel.
const targets = {
  createComments: { env: "N8N_WEBHOOK_URLS_DATA", adminOnly: false },
  regenerateGemini: { env: "N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS", adminOnly: false },
  regenerateGpt: { env: "N8N_WEBHOOK_UPDATE_GPT_COMMENTS", adminOnly: false },
  regenerateClaude: { env: "N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS", adminOnly: false },
  regenerateScript: { env: "N8N_WEBHOOK_UPDATE_SCRIPT", adminOnly: false },
  reprocessErrors: { env: "N8N_WEBHOOK_REPROCESS_ERRORS", adminOnly: true },
  updateFacebookCookies: { env: "N8N_WEBHOOK_UPDATE_FB_COOKIES", adminOnly: true },
} as const;

type TargetName = keyof typeof targets;

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
    const segments = new URL(req.url).pathname.split("/").filter(Boolean);
    const targetName = segments[segments.length - 1] as TargetName;
    const target = targets[targetName];

    if (!target) {
      return jsonResponse({ error: `Unknown target: ${targetName}` }, 404);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Validate the caller's session with the anon key + their own token.
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const userId = userData.user.id;

    if (target.adminOnly) {
      // Read the role with the service key so profiles RLS can't hide it.
      const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error reading profile:", profileError);
        return jsonResponse({ error: "Could not verify role" }, 500);
      }

      if (profile?.role !== "admin") {
        return jsonResponse({ error: "Forbidden: admin role required" }, 403);
      }
    }

    const webhookUrl = Deno.env.get(target.env);
    if (!webhookUrl) {
      console.error(`Missing secret ${target.env} for target ${targetName}`);
      return jsonResponse({ error: "Webhook not configured" }, 500);
    }

    const outgoingHeaders: Record<string, string> = {};
    const webhookToken = Deno.env.get("N8N_WEBHOOK_TOKEN");
    if (webhookToken) {
      outgoingHeaders["X-Webhook-Token"] = webhookToken;
    }

    // Rebuild the body so the caller-supplied user id is always replaced by the
    // authenticated one. Multipart is re-encoded; everything else is JSON.
    let outgoingBody: BodyInit;
    const contentType = req.headers.get("Content-Type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const incoming = await req.formData();
      const form = new FormData();
      for (const [key, value] of incoming.entries()) {
        if (key === "userId") continue;
        form.append(key, value);
      }
      form.append("userId", userId);
      outgoingBody = form;
    } else {
      const payload = await req.json();
      if ("UserId" in payload) payload.UserId = userId;
      if ("userId" in payload) payload.userId = userId;
      if (!("UserId" in payload) && !("userId" in payload)) payload.userId = userId;
      outgoingBody = JSON.stringify(payload);
      outgoingHeaders["Content-Type"] = "application/json";
      outgoingHeaders["Accept"] = "application/json";
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: outgoingHeaders,
      body: outgoingBody,
    });

    const responseBody = await webhookResponse.text();

    return new Response(responseBody, {
      status: webhookResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": webhookResponse.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Error proxying to n8n:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
