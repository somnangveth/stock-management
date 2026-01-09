import { fetchAdmins } from "@/app/admin/user/actions";

export async function GET() {
  try {
    const adminData = await fetchAdmins(); 

    return new Response(
      JSON.stringify(adminData),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
