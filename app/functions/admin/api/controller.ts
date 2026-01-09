//Fetch Admins
export async function fetchAdmins(){
    const res = await fetch("/api/admin/fetchadmins");
    if(!res.ok){
        throw new Error("Failed to fetch");
    }
    return res.json();
}

//Fetch Staffs
export async function fetchStaffs(){
    const res = await fetch("/api/admin/fetchstaffs");
    if(!res.ok){
        throw new Error("Failed to fetch");
    }
    return res.json();
}



//Fetch Products
export async function fetchProducts(){
    const res = await fetch("/api/admin/fetchproducts");
    if(!res.ok){
        throw new Error("Failed to fetch");
    }
    return res.json();
}

//Fetch Category And Subcategory
export async function fetchCategoryAndSubcategory(){
    const res = await fetch('/api/admin/fetchcategoryandsubcategory');
    if(!res.ok){
        throw new Error("Failed to fetch");
    }

    return res.json();
}

//Fetch Contact
export async function fetchContact(){
    const res = await fetch('/api/admin/fetchcontact');
    if(!res.ok){
        throw new Error("Failed to fetch");
    }

    return res.json();
}

//Fetch Prices for B2C
export async function fetchPricesB2C(){
    const res = await fetch('/api/admin/fetchpricesb2c');
    if(!res.ok){
        throw new Error('Failed to fetch');
    }

    return res.json();
}

//Fetch Prices for B2B
export async function fetchPricesB2B(){
    const res = await fetch('/api/admin/fetchpricesb2b');

    if(!res.ok){
        throw new Error("Failed to fetch");
    }

    return res.json();
}


//Fetch Vendors
export async function fetchVendors(){
    const res = await fetch('/api/admin/fetchvendors');
    if(!res.ok){
        throw new Error("Failed to fetch");
    }

    return res.json();
}

//Fetch Batch
export async function fetchBatch(){
    const res = await fetch('/api/admin/fetchbatch');
    if(!res.ok){
        throw new Error("Error to fetch");
    }

    return res.json();
}

//Fetch Expired Batch
export async function fetchExpiredBatch(){
const res = await fetch('/api/admin/getexpiredbatches');
if(!res.ok){
    console.error('Failed to fetch expired datas');
    throw new Error('Failed to fetch');
}

    return res.json();
}

//Fetch Dealers
export async function fetchDealers(){
    const res = await fetch('/api/admin/fetchdealers');
    if(!res.ok){
        console.error("Failed to fetch Dealers")
    }

    return res.json();
}

//Fetch Sales
export async function fetchSales(){
    const res = await fetch("/api/admin/fetchsales");
    if(!res.ok){
        console.error("Failed to fetch sales");
    }

    return res.json();
}

//Fetch Sale Items
export async function fetchSaleItems(){
    const res= await fetch("/api/admin/fetchsaleitems");

    if(!res.ok){
        console.error("Failed to fetch sale items");
    }

    return res.json();
}

//Fetch Discounts
export async function fetchDiscount(){
    const res = await fetch("/api/admin/fetchdiscount");
    if(!res.ok){
        console.error("Failed to fetch discounts data");
    }

    return res.json();
}


//Fetch Attribute
export async function fetchAttribute(){
    const res = await fetch("/api/admin/fetchattribute");
    if(!res.ok){
        console.error("Failed to fetch attribute data");
    }

    return res.json();
}

//Fetch Product Attribute
export async function fetchProductAttribute(){
    const res = await fetch("/api/admin/fetchproductattribute");
    if(!res.ok){
        console.error("Failed to fetch product attribute data");
    }

    return res.json();
}


//Fetch Stock Alert 
export async function fetchStockAlert(){
    const res = await fetch("/api/admin/fetchstockalert");
    if(!res.ok){
        console.error("Failed to fetch stock alert data");
    }

    return res.json();
}


//Fetch Stock movement
export async function fetchStockMovement(){
    const res = await fetch("/api/admin/fetchstockmovement");
    if(!res.ok){
        console.error("Failed to fetch stock movement data");
    }

    return res.json();
}