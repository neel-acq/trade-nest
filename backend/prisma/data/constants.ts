export const INITIAL_WALLET_BALANCE = 1_000_000;

export function buildStockMetrics(currentPrice: number, currentVolume: number) {
  const previousPrice = Number((currentPrice * 0.99).toFixed(2));
  const previousVolume = Math.floor(currentVolume * 0.95);
  const changePrice = Number((currentPrice - previousPrice).toFixed(2));
  const changeVolume = currentVolume - previousVolume;
  const changePercentage = Number(((changePrice / previousPrice) * 100).toFixed(4));
  const volumePercentage =
    previousVolume === 0 ? 0 : Number(((changeVolume / previousVolume) * 100).toFixed(4));

  return {
    previousPrice,
    previousVolume,
    changePrice,
    changeVolume,
    changePercentage,
    volumePercentage,
  };
}
