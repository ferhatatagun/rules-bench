const ENDPOINT = 'https://api.anthropic.com/v1/messages/count_tokens';

/**
 * Exact token count via the count_tokens endpoint (free, needs a key).
 * Subtracts the fixed per-request overhead measured with a one-character message.
 * @param {string} text
 * @param {{ apiKey: string, model: string }} cfg
 */
export async function countExact(text, { apiKey, model }) {
  const call = async (content) => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content }] }),
    });
    if (!res.ok) throw new Error(`count_tokens ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return /** @type {{ input_tokens: number }} */ (await res.json()).input_tokens;
  };
  const [total, base] = await Promise.all([call(text || '.'), call('.')]);
  return Math.max(0, total - base);
}
