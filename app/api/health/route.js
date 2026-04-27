export async function GET() {
  return Response.json({
    ok: true,
    service: "aurum-web",
    version: "0.2.0"
  });
}
