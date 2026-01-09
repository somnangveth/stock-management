"use server";

//1. Fetch Permission
export async function fetchStaffProducts(){
    const res = await fetch('/api/staff/fetchProducts');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//2. Fetch Product Batch
export async function fetchStaffBatch(){
    const res = await fetch('/api/staff/fetchBatch');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//3. Fetch Category
export async function fetchStaffCategory(){
    const res = await fetch('/api/staff/fetchCategory');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//4. Fetch Subcategory
export async function fetchStaffSubcategory(){
    const res = await fetch('/api/staff/fetchSubcategory');
    if(!res.ok){
        throw new Error('Error to fetch');
    }

    return res.json();
}

//5. fetch Vendors
export async function fetchStaffVendors(){
    const res = await fetch('/api/staff/fetchVendors');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}