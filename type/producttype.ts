//vendortype
export type Vendors = {
    vendor_id: string,
    vendor_name: string,
    contact_person: string,
    phone_number1: string,
    phone_number2: string,
    vendor_email: string,
    vendor_image: string,
    source_link: string,
    vendortype: string,
    address: string,
    city: string,
    country: string,
    payment_terms: string,
    notes: string
}

// productType.ts

// Base Product Type (matches your API response)
export type Product = {
  product_id: string;
  sku_code: string;
  product_name: string;            
  product_image: string;                  
  description: string;
  slug: string;
  category_id: number;
  subcategory_id: number;
  vendor_id: number;
  min_stock_level: number;
  max_stock_level: number;
  default_shelf_life_days: number;
  base_unit: string;
  units_per_package: number;
  package_type: 'box' | 'case';
  track_expiry: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;

  total_price: number;
  discount_price: number;
  discount_percent: number;
  tax_amount: number;

  //Expiry
  batch_id?: string;
  batch_number?: string;
  manufacture_date?: string;
  status?: string;
  expiry_date?: string;
  received_date?: string;
  current_quantity?: number;
  quantity_remaining?: number;
  packages_recieved?: number;
  alert_type?: string
  package_qty: number;
};

export type Price = {
  price_id: string;
  product_id: string;
  product_image: string;
  product_name: string;
  discount_status: string;
  start_date: Date;
  end_date: Date;
  base_price: number;
  profit_price: number;
  tax: number;
  shipping: number;
  discount: number;
  discount_percent: number;
  discount_price: number;
  total_price: number;
  total_amount: number;
  b2b_price: number | null;
  created_at: string;
};

export type Sale = {
  dealer_id: string;
  sale_id: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  process_status: string;
  payment_method: string;
  created_at: string;
  status: string;
  customertype: "Dealer" | "General";
  general_customer_type: string;
  payment_duedate: string;
  payment_status: "pending" | "partial" | "paid" | "refunded";
}

// Batch fields (if you need them separately)
export type ProductBatch = {
  batch_id: string;
  batch_number: string;
  product_id: string;
  manufacture_date?: Date;
  expiry_date?: Date;
  received_date?: Date;
  note?: string;
  quantity: number;
  quantity_remaining: number;
  packages_recieved?: number;
  units_per_package: number;
  cost_price?: number;
  status?: string; // active / expired / returned
};


//Category Type
export type Categories = {
  category_id: string;
  category_name: string;
  slug: string;
}

//Subcategory Type
export type Subcategories = {
  subcategory_id: string;
  subcategory_name: string;
  category_id: string;
}
//Stock Type
export type Stock = {
  id?: string;
  stock_name?: string;
  stock_total?: number;
}

//Discount Type
export type Discount = {
  discount_id: string;
  discount_percent: number;
  start_date: Date;
  end_date: Date;
  discount_price: number;
  discount_status: "expired" | "active";
}


export type ExpiryAlert = {
  expiry_id?: string;
  batch_id?: string;
  product_name?: string;
  batch_number?: string;
  product_id?: string;
  alert_type?: "near_expiry" | "expired" | "expiring_soon";
  priority?: "low" | "medium" | "high" | "critical";
  expiry_date?: Date;
  days_until_expiry?: number;
}

export type ExpiredProductDisposal = {
  product_disposal_id: string;
  batch_id: string;
  batch_number: string;
  product_id: string;
  quantity_disposed: number;
  quantity_remaining: number;
  disposal_date: Date,
  disposal_method: "trash" | "return_supplier" | "donation" | "other";
  cost_loss: number;
  base_price: number;
  reason: string;
}

export type Attribute = {
product_id: string;
product_attribute_id: string;
attribute_id: string;
attribute_name: string;
description: string;
value: string;
}

export type StockMovement = {
  stock_movement_id?: string; 
  stock_alert_id: string;
  product_id: string;
  batch_id: string;
  movement_type: "return" | "damage" | "adjustment";
  quantity: number;
  cost_loss: number;
  notes: string;
};



export type StockAlert = {
  stock_alert_id: string;
  product_id: string;
  alert_type: "low_stock" | "out_of_stock" | "overstock";
  priority: "low" | "medium" | "high" | "critical";
  threshold_quantity: number;
  max_stock_level: number;
  current_quantity: number;
};
