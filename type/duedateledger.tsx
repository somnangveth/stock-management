export interface LedgerSummary {
    count: number;
    totalLedger: number;
}

interface TopOverDateLedgerItem {
    vendorName: string;
    batchNumber: string;
    credit: number;
    debit: number;
    daysUntilDueDate: number;
    balance: number;
}//可用可不用，为了能在首页显示出来

interface overDateMetrics {
    overDateLedger: LedgerSummary;
    overDateSoon: LedgerSummary;
    topOverDateLedger: TopOverDateLedgerItem[];
}//可用可不用，为了能在首页显示出来

export interface LedgerAlert {
    overSoonCount: number;//快逾期
    overdateCount: number; //已逾期

}
