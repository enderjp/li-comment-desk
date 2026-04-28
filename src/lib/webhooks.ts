function requireEnvVar(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const webhookUrls = {
  createComments: requireEnvVar('VITE_N8N_WEBHOOK_URLS_DATA', import.meta.env.VITE_N8N_WEBHOOK_URLS_DATA),
  regenerateGemini: requireEnvVar('VITE_N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS', import.meta.env.VITE_N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS),
  regenerateGpt: requireEnvVar('VITE_N8N_WEBHOOK_UPDATE_GPT_COMMENTS', import.meta.env.VITE_N8N_WEBHOOK_UPDATE_GPT_COMMENTS),
  regenerateClaude: requireEnvVar('VITE_N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS', import.meta.env.VITE_N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS),
  regenerateScript: requireEnvVar('VITE_N8N_WEBHOOK_UPDATE_SCRIPT', import.meta.env.VITE_N8N_WEBHOOK_UPDATE_SCRIPT),
  updateFacebookCookies: requireEnvVar('VITE_N8N_WEBHOOK_UPDATE_FB_COOKIES', import.meta.env.VITE_N8N_WEBHOOK_UPDATE_FB_COOKIES),
};
