// Small fetch wrapper. Cookies are sent automatically; errors carry the server's message.
export async function api(path, { method = 'GET', body, form } = {}) {
  const opts = { method, credentials: 'include', headers: {} };
  if (form) {
    opts.body = form; // FormData: the browser sets the content type
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch('/api' + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong'), { status: res.status });
  return data;
}

export const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In progress',
  ready: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
export const STAGES = ['pending', 'approved', 'in_progress', 'ready', 'completed'];
export const SIZES = [
  ['small', 'Small', 1],
  ['sedan', 'Sedan / SUV', 1.3],
  ['large', 'Large / luxury', 1.7],
];
