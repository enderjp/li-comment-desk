import { supabase } from './supabase';

export type WebhookTarget =
  | 'createComments'
  | 'reprocessErrors'
  | 'regenerateGemini'
  | 'regenerateGpt'
  | 'regenerateClaude'
  | 'regenerateScript'
  | 'updateFacebookCookies';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Sends a payload to n8n through the `n8n-proxy` edge function. The real n8n
 * URLs live in server-side secrets, so they never reach the browser bundle.
 */
export async function callWebhook(
  target: WebhookTarget,
  body: Record<string, unknown> | FormData,
): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('No hay una sesion activa');
  }

  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${data.session.access_token}`,
  };

  const isFormData = body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers.Accept = 'application/json';
  }

  return fetch(`${supabaseUrl}/functions/v1/n8n-proxy/${target}`, {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body),
  });
}
