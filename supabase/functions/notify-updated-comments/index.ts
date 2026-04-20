import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, request_id, post_id, adset } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: user_id" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user role
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw profileError;
    }

    // Get comment visibility if post_id is provided
    if (post_id) {
      const { data: comment, error: commentError } = await supabase
        .from("comments")
        .select("visibility")
        .eq("id", post_id)
        .single();

      if (commentError) {
        console.error("Error fetching comment:", commentError);
        throw commentError;
      }

      // If user is an agent and comment is private, don't create notification
      if (userProfile.role === "agent" && comment.visibility === "private") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Notification skipped - user is agent and comment is private",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    const title = "Comentarios actualizados";
    const message = adset
      ? `Los comentarios para el adset "${adset}" han sido actualizados exitosamente.`
      : "Los comentarios han sido actualizados exitosamente.";

    // Store post_id in adset field with special format: "POST_ID:number|ADSET:name"
    const adsetValue = post_id
      ? `POST_ID:${post_id}${adset ? `|ADSET:${adset}` : ''}`
      : adset || null;

    const { error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type: "comment_update",
        request_id: null,
        adset: adsetValue,
        is_read: false,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification created successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
