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

    const { comment_id, title, message } = await req.json();

    if (!comment_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: comment_id, title, message" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get comment visibility
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("visibility")
      .eq("id", comment_id)
      .single();

    if (commentError) {
      console.error("Error fetching comment:", commentError);
      throw commentError;
    }

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) throw usersError;

    // Get all user profiles to check their roles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, role");

    if (profilesError) throw profilesError;

    // Create a map of user_id to role
    const roleMap = new Map(profiles.map(p => [p.id, p.role]));

    // Filter users based on comment visibility and user role
    const filteredUsers = users.users.filter(user => {
      const userRole = roleMap.get(user.id);
      // If comment is private and user is an agent, skip notification
      if (comment.visibility === "private" && userRole === "agent") {
        return false;
      }
      return true;
    });

    const notifications = filteredUsers.map(user => ({
      user_id: user.id,
      title,
      message,
      type: "comment",
      comment_id: parseInt(comment_id),
      is_read: false,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications created for ${users.users.length} users`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating notifications:", error);
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
