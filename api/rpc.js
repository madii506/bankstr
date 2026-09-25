// Read-only Solana RPC proxy for the inventory (only balance lookups are allowed)
const UP = ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'];
const OK = new Set(['getBalance', 'getTokenAccountsByOwner']);
const isAddr = s => typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || !OK.has(b.method) || !Array.isArray(b.params) || !isAddr(b.params[0])) { res.status(400).json({ error: 'not allowed' }); return; }
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: b.method, params: b.params });
  for (const u of UP) {
    try {
      const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.result !== undefined) { res.status(200).json(j); return; }
    } catch (e) {}
  }
  res.status(502).json({ error: 'upstream unavailable' });
};
