"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";

export async function addDealer(
    data: {
        business_name: string;
        dealer_name: string;
        nationalId : string;
        passportNumber: string;
        contact_number: string;
        email_address: string;
        shop_address: string;
        delivery_address: string;
        businesstype: "retail" | "wholesale" | "mixed" | "online";
    }
){
    const supabase = await createSupabaseAdmin();

    try{
        const {data: dealerData, error: dealerError} = await supabase
        .from('dealer')
        .insert({
            business_name: data.business_name,
            dealer_name: data.dealer_name,
            nationalid: data.nationalId,
            passportnumber: data.passportNumber,
            contact_number: data.contact_number,
            email_address: data.email_address,
            shop_address: data.shop_address,
            delivery_address: data.delivery_address,
            businesstype: data.businesstype,
        });

        if(dealerError){
            console.error("Failed to insert dealer data", dealerError);
        }

        return dealerData;
    }catch(error){
        throw error;
    }
}


//Update dealer
export async function updateDealer(
    dealer_id: string,
    data: Partial<{
        business_name: string;
        dealer_name: string;
        nationalId : string;
        passportNumber: string;
        contact_number: string;
        email_address: string;
        shop_address: string;
        delivery_address: string;
        profile_image: string;
        businesstype: "retail" | "wholesale" | "mixed" | "online";
    }>
){
    const supabase = await createSupabaseAdmin();

    try{
        const {data: dealerData, error: dealerError} = await supabase
        .from("dealer")
        .update({
            business_name: data.business_name,
            dealer_name: data.dealer_name,
            nationalid: data.nationalId,
            passportnumber: data.passportNumber,
            contact_number: data.contact_number,
            email_address: data.email_address,
            shop_address: data.shop_address,
            delivery_address: data.delivery_address,
            businesstype: data.businesstype,
            profile_image: data.profile_image,
        })
        .eq('dealer_id', dealer_id);

        if(dealerError){
            console.error("Failed to update dealer data", dealerError);
        }

        return dealerData;
    }catch(error){
        throw error;
    }
}


//Delete Dealer
export async function deleteDealer(dealer_id: string){
    const supabase = await createSupabaseAdmin();

    try{
        const {data: dealerData, error: dealerError} = await supabase
        .from("dealer")
        .delete()
        .eq("dealer_id", dealer_id);

        if(dealerError){
            console.error("Failed to delete dealer", dealerError);
        }

        return dealerData;
    }catch(error){
        throw error;
    }
}

//Fetch Dealer Data
export async function fetchDealers(){
    const supabase = await createSupabaseAdmin();

    const {data: dealerData, error: dealerError} = await supabase
    .from("dealer")
    .select("*");

    if(dealerError){
        console.error("Failed to fetch dealer Data", dealerError);
    }

    return dealerData;
}