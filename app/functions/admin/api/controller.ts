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
export async function fetchCategory(){
    const res = await fetch('/api/admin/fetchcategory');
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

//Fetch Prices for import price
export async function fetchImportPrice(){
    const res = await fetch('/api/admin/fetchimportprice');
    if(!res.ok){
        throw new Error('Failed to fetch import price');
    }

    return res.json();
}

//Fetch Prices for Sale price
export async function fetchSalePrice(){
    const res = await fetch('/api/admin/fetchsaleprice');

    if(!res.ok){
        throw new Error("Failed to fetch sale price");
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


//Fetch Ledger
export async function fetchLedger(){
    const res = await fetch('/api/admin/fetchledger');
    if(!res.ok){
        console.error("Failed to fetch Ledger data");
        throw new Error("Failed to fetch");
    }
    return res.json();
}

// //Fetch Ledger Alert
// export async function fetchLedgerAlert(){
//     const res = await fetch('/api/admin/fetchledgeralert');
//     if(!res.ok){
//         console.error("Failed to fetch Ledger Alert data");
//         throw new Error("Failed to fetch");
//     }
//     return res.json();
// }

//Fetch purchase orders
export async function fetchPurchaseOrders(){
    const res = await fetch('/api/admin/fetchpurchaseorders');
    if(!res.ok){
        console.error("Failed to fetch Purchase Orders data");
        throw new Error("Failed to fetch");
    }
    return res.json();
}

//Fetch return orders
export async function fetchReceiveOrders(){
    const res = await fetch('/api/admin/fetchreceiveorders');
    if(!res.ok){
        console.error("Failed to fetch Receive Orders data");
        throw new Error("Failed to fetch");
    }
    return res.json();
}


//Fetch product vendor
export async function fetchProductVendor(){
    const res = await fetch("/api/admin/fetchproductvendor");
    if(!res.ok){
        console.error("Failed to fetch");
    }

    return res.json();
}

//Fetch Sales Stats for Profile Welcome
export async function fetchSalesStats(){
    const res = await fetch("/api/admin/fetchsalesstats");
    if(!res.ok){
        console.error("Failed to fetch sales stats");
        throw new Error("Failed to fetch sales stats");
    }

    return res.json();
}

