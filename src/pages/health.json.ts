export const prerender = false;

export function GET() {
  return Response.json({
    ok: true,
    app: 'marketplace',
    checkedAt: new Date().toISOString(),
  });
}
