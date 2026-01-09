export type ProductBatch = {
    batch_id: string;
    batch_number: string;
    manufacture_date: Date;
    expiry_date:Date;
    cost_price?: number;
    recieved_date?: Date;
    status: 'active' | 'expired' | 'dispose' | 'returned';
    note?: string;
    product_id: string;
    quantity: number;
    min_stock_level: number;
    max_stock_level: number;
    quantity_remaining: number;
    packages_recieved?: number;
    units_per_package: number;
}