async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

export async function verifySecret(challenge_id, secret) {
  return request('/api/meta/verify', {
    method: 'POST',
    body: JSON.stringify({ challenge_id, secret }),
  });
}

export async function getChallenges() {
  const r = await request('/api/meta/challenges');
  return r.data?.data || [];
}

export async function execSql(route, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`${route}${qs ? `?${qs}` : ''}`);
}

export async function execSqlPost(route, body) {
  return request(route, { method: 'POST', body: JSON.stringify(body) });
}

export async function execNoSql(route, params = {}) {
  return execSql(route, params);
}