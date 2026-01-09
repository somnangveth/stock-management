import { fetchStaffs } from "@/app/admin/user/actions";

export async function GET(){
   try{
    const staffData = await fetchStaffs();

    return new Response(
        JSON.stringify(staffData),
        {status: 200, headers: { "Content-Type": "application/json"}}
    )
   }catch(error: any){
    return new Response(
        JSON.stringify({error: error.message || "Internal Server Error"}),
        {status: 500, headers: {"Content-Type": "application/json"}}
    )
   }
}