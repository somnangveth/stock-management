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
  unit_price: number;
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
  price_value: number;

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
  batch_id: string;
  attribute_id: string;
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
  attribute_value: string;
  price_value: number;
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
  import_status: string;
  import_price_id: string;
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
  status: string; // active / expired / returned
};


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
module: string;
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



// types/purchase.ts
export type PurchaseStatus = "draft" | "submitted" | "confirmed" | "received" | "completed" | "cancelled";

export type PurchaseItem = {
  purchase_item_id: string;
  product_id: string;
  product_name: string;
  sku_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  expiry_date?: string;
  batch_number?: string;
  warehouse_location?: string;
  received_quantity: number;
  batch_id?: string;
  product_image?: string;
};

export type PurchaseOrderDetail = {
  purchase_id: string;
  po_number: string;
  vendor_id: number;
  vendor_name: string;
  purchase_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  payment_terms?: string;
  note?: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  status: PurchaseStatus;
  created_at?: string;
  updated_at?: string;
  purchase_items: PurchaseItem[];
  vendor_image?: string;
};

export type PurchaseOrder = {
  [x: string]: any;
  purchase_id: string;
  po_number: string;
  vendor_id: number;
  vendor_name: string;
  total_amount: number;
  status: PurchaseStatus;
  purchase_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  item_count: number;
  received_items_count: number;
  items?: PurchaseItem[];
};

export type CreatePurchaseOrderInput = {
  vendor_id: number;
  purchase_date: string;
  expected_delivery_date?: string;
  payment_terms: string;
  PurchaseStatus: PurchaseStatus;
  note: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    expiry_date?: string;
    batch_number?: string;
    warehouse_location?: string;
  }>;
};

export type UpdatePurchaseOrderInput = {
  
  expected_delivery_date?: string;
  payment_terms?: string;
  PurchaseStatus?: PurchaseStatus;
  note?: string;
};

export type ServerResponse<T> = {
  data: T | null;
  error: string | null;
};

export type POReceiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poNumber: string;
  items: PurchaseItem[];
  onReceive: (receivedData: Record<string, number>) => Promise<void>;
  isLoading?: boolean;
}


export interface VendorProduct {
  product_id: number;
  product_name: string;
  sku_code: string;
  description: string;
  vendor_id: number;
  unit_price: number;
  product_image: string | null;
  quantity_remaining: number;
  category_id: number | null;
  subcategory_id: number | null;
  min_stock_level: number;
  reorder_point: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  barcode: string | null;
  basePrice: number;
}


export interface Categories {
  category_id: number;
  category_name: string;
  parent_id: string | null;
  created_at?: string;
  updated_at?: string;
  children?: Categories[];
  level?: number;
  path?: string;
}

// Build nested tree structure
export function buildCategoryTree(categories: Categories[]): Categories[] {
  const categoryMap = new Map<string, Categories>();
  const roots: Categories[] = [];

  // First pass: create map and initialize children arrays
  categories.forEach(cat => {
    categoryMap.set(String(cat.category_id), { ...cat, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const category = categoryMap.get(String(cat.category_id))!;
    
    if (cat.parent_id === null) {
      roots.push(category);
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children!.push(category);
      } else {
        // Orphaned category (parent doesn't exist), treat as root
        roots.push(category);
      }
    }
  });

  return roots;
}

// Flatten tree to list with indentation levels
export function flattenCategoryTree(
  categories: Categories[],
  level: number = 0,
  parentPath: string = ""
): Categories[] {
  const flattened: Categories[] = [];

  categories.forEach(cat => {
    const path = parentPath ? `${parentPath} > ${cat.category_name}` : cat.category_name;
    
    flattened.push({
      ...cat,
      level,
      path,
    });

    if (cat.children && cat.children.length > 0) {
      flattened.push(...flattenCategoryTree(cat.children, level + 1, path));
    }
  });

  return flattened;
}

// Get all descendants of a category (for preventing circular references)
export function getCategoryDescendants(
  categoryId: string,
  allCategories: Categories[]
): string[] {
  const descendants: string[] = [];

  function collectDescendants(id: string) {
    const children = allCategories.filter(c => c.parent_id === id);
    children.forEach(child => {
      descendants.push(String(child.category_id));
      collectDescendants(String(child.category_id));
    });
  }

  collectDescendants(categoryId);
  return descendants;
}
