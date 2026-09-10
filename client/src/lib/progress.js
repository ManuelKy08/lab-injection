const KEY = 'lab-injection-progress';

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function isSolved(progress, id) {
  return progress[id] === true;
}

export function countSolved(progress) {
  return Object.values(progress).filter(Boolean).length;
}

export function rateLimitSet(now, label) {
  const key = `lab-injection-ratelimit-${label}`;
  const last = Number(localStorage.getItem(key) || 0);
  localStorage.setItem(key, String(Date.now()));
  return Date.now() - last < now;
}

export function track(callback) {
  try {
    return callback();
  } catch (err) {
    return null;
  }
}