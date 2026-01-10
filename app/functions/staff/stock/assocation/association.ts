"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";


//Add Association
export async function addAssociation(
    data: Partial<{
        product_id: string;
        associated_product_id: string[];
        association_type: 'related' | 'bundle' | 'alternative';
    }>
){
    const supabase = await createSupabaseAdmin();

    try{

        //Validate Input
        if(!data.product_id || !data.associated_product_id || !data.association_type){
            throw new Error("Missing required fields");
        }

        //Create an array of records to insert - one for each associated product
        const recordsToInsert = data.associated_product_id.map(associatedId => ({
            product_id: data.product_id,
            associated_product_id: associatedId,
            association_type: data.association_type,
        }));


        const {data: associatedData,error: associatedError} = await supabase
        .from("product_associations")
        .insert(recordsToInsert);

        if(associatedError){
            console.error("Association Error",JSON.stringify(associatedError));
        }

        return {success: true, data: associatedData};
    }catch(error){
        console.error("Error adding association: ",JSON.stringify(error));
        throw error;
    }
}

//Update Associations
export async function updateAssociation(
    association_id: string,
    data: Partial<{
        product_id: string;
        associated_product_id: string[];
        association_type: 'related' | 'bundle' | 'alternative';
    }>
){

    const supabase = await createSupabaseAdmin();

    try{
        if(!data.product_id || ! data.associated_product_id || !data.association_type){
            throw new Error("Missing required field");
        }

        const recordsToInsert = data.associated_product_id.map( associatedId => (
            {
            product_id: data.product_id,
            associated_product_id: associatedId,
            association_type: data.association_type,
            }
        )
    );

    const {data: associatedData, error: associatedError} = await supabase
    .from("product_associations")
    .update(recordsToInsert)
    .eq('association_id', association_id);

    if(associatedError){
        throw new Error("Failed to update associated datas", associatedError);
    }

    return associatedData;

    }catch(error){
        console.error("Failed to update datas: ",JSON.stringify(error));
    }

}


//Delete Associated Products
export async function deleteAssociated(association_id: string){
    const supabase = await createSupabaseAdmin();

    try{
        if(!association_id){
            console.error("Missing association_id");
        }

        const {data: associatedData, error: associatedError} = await supabase
        .from("product_associations")
        .delete()
        .eq('association_id', association_id);

        if(associatedError){
            console.error("Failded to delete associations", associatedError);
        }

        return associatedData;
    }catch(error){
        console.error("Failed to delete association data: ", JSON.stringify(error));
    }
}

//fetch all Associations
export async function fetchAssociation(){
    const supabase = await createSupabaseAdmin();

    try{
        const { data: associatedData, error: associatedError } = await supabase
        .from("product_associations")
        .select("*");

        if(!associatedData || associatedError){
            console.error("Failed to fetch datas: ", JSON.stringify(associatedError));
        }

        return associatedData;
    }catch(error){
        console.error("Error fetching data: ", JSON.stringify(error));
    }
}