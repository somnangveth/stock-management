interface ExpiryMetrics{
    expiredProducts: {
        count: number;
        totalQuantity: number;
        estimatedLoss: number;
    };
    expiringSoon: {
        count: number;
        totalQuantity: number;
    }
    nearExpiry: {
        count: number;
        totalLoss: number;
    }
    disposalsThisMonth: {
        count: number;
        totalLoss: number;
    }
    topExpiringProducts: Array<{
        productName: string;
        batchNumber:  string;
        quantity: number;
        daysUntilExpiry: number;
        estimatedValue: number;
    }>;
}