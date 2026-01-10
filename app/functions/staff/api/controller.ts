"use server";

//1. Fetch Permission
export async function fetchStaffProducts(){
    const res = await fetch('/api/staff/fetchstaffproducts');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//2. Fetch Product Batch
export async function fetchStaffBatch(){
    const res = await fetch('/api/staff/fetchstaffbatch');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//3. Fetch Category
export async function fetchStaffCategory(){
    const res = await fetch('/api/staff/fetchstaffcategory');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//4. Fetch Subcategory
export async function fetchStaffSubcategory(){
    const res = await fetch('/api/staff/fetchstaffsubcategory');
    if(!res.ok){
        throw new Error('Error to fetch');
    }

    return res.json();
}

//5. fetch Vendors
export async function fetchStaffVendors(){
    const res = await fetch('/api/staff/fetchstaffvendors');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//6. fetch stock alerts
export async function fetchStaffStockAlert(){
    const res = await fetch('/api/staff/fetchstaffstockalert');
    if(res.ok){
        throw new Error("Error to fetch");
    }
    return res.json();
}

//7. fetch expiry alert
export async function fetchStaffExpiryAlert(){
    const res = await fetch("/api/staff/fetchstaffexpiryalert");
    if(!res.ok){
        throw new Error("Failed to fetch");
    }

    return res.json();
}

//8. Fetch Expired Product Disposals
export async function fetchStaffExpiredProductDisposals(){
    const res = await fetch("/api/staff/fetchstaffexpiredproductdisposal");
    if(!res.ok){
        throw new Error("Failed to fetch");
    }
    return res.json();
}

//9. Fetch Staff Stock Movement
export async function fetchStaffStockMovement(){
    const res = await fetch("/api/staff/fetchstaffstockmovement");
    if(!res.ok){
        throw new Error("Failed to fetch");
    }
    return res.json();
}

//10. Fetch Staff Prices B2B
export async function fetchStaffPriceB2B(){
    const res = await fetch("/api/staff/fetchstaffpriceb2b");
    if(!res.ok){
        throw new Error("Failed to fetch price b2b");
    }
    return res.json();
}

//11. Fetch Staff Prices B2C
export async function fetchStaffPriceB2C(){
    const res = await fetch("/api/staff/fetchstaffpriceb2c");
    if(!res.ok){
        throw new Error("Failed to fetch price b2c");
    }

    return res.json();
}


//12. Fetch Staff Discount
export async function fetchStaffDiscount(){
    const res = await fetch("/api/staff/fetchstaffdiscount");
    if(!res.ok){
        throw new Error("Failed to fetch discount");
    }
    return res.json();
}

//13. Fetch Dealer
export async function fetchStaffDealer(){
    const res = await fetch("/api/staff/fetchstaffdealer");
    if(!res.ok){
        throw new Error("Failed to fetch dealer");
    }
    return res.json();
}

//14. Fetch Sale Items
export async function fetchStaffSaleItem(){
    const res = await fetch("/api/staff/fetchstaffsaleitem");
    if(!res.ok){
        throw new Error("Failed to fetch sale item");
}
return res.json();
}

//15. Fetch Sales
export async function fetchStaffSales(){
    const res = await fetch("/api/staff/fetchstaffsale");
    if(!res.ok){
        throw new Error("Failed to fetch sale");
    }
    return res.json();
}


//16. Fetch Attribute 
export async function fetchStaffAttribute(){
    const res = await fetch("/api/staff/fetchstaffattribute");
    if(!res.ok){
        throw new Error("Failed to fetch attribute");
    }
    return res.json();
}

//17. Fetch Product Attribute
export async function fetchStaffProductAttribute(){
    const res = await fetch("/api/staff/fetchstaffattribute");
    if(!res.ok){
        throw new Error("Failed to fetch product attribute");
    }
    return res.json();
}


// Fetch Category and subcategory
export async function fetchStaffCategoryAndSubcategory(){
    const res = await fetch("/api/staff/fetchstaffcategoryandsubcategory");
    if(!res.ok){
        throw new Error("Failed to fetch category and subcategory");
    }

    return res.json();
}
