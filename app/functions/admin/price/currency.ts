
const USD_TO_RIEL_RATE = 4000;

export function convertFromDollarToRiels(price: number): number{
    const Riels = price * USD_TO_RIEL_RATE;
    return Riels;
}