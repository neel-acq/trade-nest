import { MemoryOrder } from './memory-order';
import { PriceLevelQueue } from './price-level';

export interface TradeResult {
  buyOrderId: string;
  sellOrderId: string;
  buyUserId: string;
  sellUserId: string;
  price: number;
  quantity: number;
}

export class MemoryOrderBook {
  public readonly stockId: string;
  
  // Maps price -> PriceLevelQueue for O(1) level lookup
  private bids = new Map<number, PriceLevelQueue>();
  private asks = new Map<number, PriceLevelQueue>();

  // Sorted arrays of prices for fast traversal (Bids descending, Asks ascending)
  private bidPrices: number[] = [];
  private askPrices: number[] = [];

  // O(1) lookup for cancellations
  private orderMap = new Map<string, MemoryOrder>();

  constructor(stockId: string) {
    this.stockId = stockId;
  }

  // Load an order into the book (for startup or limit orders)
  public addOrder(order: MemoryOrder) {
    if (order.remaining <= 0) return;
    this.orderMap.set(order.id, order);

    if (order.isMarket) {
      // Market orders don't rest in the book
      return;
    }

    const price = order.price;
    const isBuy = order.isBuy;
    const book = isBuy ? this.bids : this.asks;
    const prices = isBuy ? this.bidPrices : this.askPrices;

    let level = book.get(price);
    if (!level) {
      level = new PriceLevelQueue(price);
      book.set(price, level);
      this.insertPrice(prices, price, isBuy);
    }
    level.enqueue(order);
  }

  public cancelOrder(orderId: string): boolean {
    const order = this.orderMap.get(orderId);
    if (!order) return false;

    if (!order.isMarket) {
      const book = order.isBuy ? this.bids : this.asks;
      const level = book.get(order.price);
      if (level) {
        level.remove(order);
        if (level.head === null) {
          book.delete(order.price);
          this.removePrice(order.isBuy ? this.bidPrices : this.askPrices, order.price);
        }
      }
    }
    this.orderMap.delete(orderId);
    return true;
  }

  public processIncomingOrder(incomingOrder: MemoryOrder): TradeResult[] {
    const trades: TradeResult[] = [];

    if (incomingOrder.isBuy) {
      this.matchBuy(incomingOrder, trades);
      if (incomingOrder.remaining > 0 && !incomingOrder.isMarket) {
        this.addOrder(incomingOrder);
      }
    } else {
      this.matchSell(incomingOrder, trades);
      if (incomingOrder.remaining > 0 && !incomingOrder.isMarket) {
        this.addOrder(incomingOrder);
      }
    }

    return trades;
  }

  private matchBuy(buyOrder: MemoryOrder, trades: TradeResult[]) {
    // Traverse asks (ascending, lowest first)
    for (let i = 0; i < this.askPrices.length; i++) {
      if (buyOrder.remaining <= 0) break;

      const askPrice = this.askPrices[i];
      if (!buyOrder.isMarket && buyOrder.price < askPrice) {
        break; // Buy limit price is lower than the best ask
      }

      const level = this.asks.get(askPrice);
      if (!level) continue;

      let currentAsk = level.head;
      while (currentAsk && buyOrder.remaining > 0) {
        if (currentAsk.userId === buyOrder.userId) {
          // Prevent self-trading
          currentAsk = currentAsk.next;
          continue;
        }

        const tradeQty = Math.min(buyOrder.remaining, currentAsk.remaining);
        const tradePrice = currentAsk.price; // Seller's price determines execution

        buyOrder.filledQuantity += tradeQty;
        currentAsk.filledQuantity += tradeQty;
        level.totalVolume -= tradeQty;

        trades.push({
          buyOrderId: buyOrder.id,
          sellOrderId: currentAsk.id,
          buyUserId: buyOrder.userId,
          sellUserId: currentAsk.userId,
          price: tradePrice,
          quantity: tradeQty,
        });

        if (currentAsk.remaining <= 0) {
          const next = currentAsk.next;
          level.remove(currentAsk);
          this.orderMap.delete(currentAsk.id);
          currentAsk = next;
        } else {
          break; // Buy order fully filled, ask remains
        }
      }

      // Cleanup empty level
      if (level.head === null) {
        this.asks.delete(askPrice);
        this.askPrices.splice(i, 1);
        i--; // Adjust index after removal
      }
    }
  }

  private matchSell(sellOrder: MemoryOrder, trades: TradeResult[]) {
    // Traverse bids (descending, highest first)
    for (let i = 0; i < this.bidPrices.length; i++) {
      if (sellOrder.remaining <= 0) break;

      const bidPrice = this.bidPrices[i];
      if (!sellOrder.isMarket && sellOrder.price > bidPrice) {
        break; // Sell limit price is higher than the best bid
      }

      const level = this.bids.get(bidPrice);
      if (!level) continue;

      let currentBid = level.head;
      while (currentBid && sellOrder.remaining > 0) {
        if (currentBid.userId === sellOrder.userId) {
          // Prevent self-trading
          currentBid = currentBid.next;
          continue;
        }

        const tradeQty = Math.min(sellOrder.remaining, currentBid.remaining);
        const tradePrice = currentBid.price; // Buyer's price determines execution

        sellOrder.filledQuantity += tradeQty;
        currentBid.filledQuantity += tradeQty;
        level.totalVolume -= tradeQty;

        trades.push({
          buyOrderId: currentBid.id,
          sellOrderId: sellOrder.id,
          buyUserId: currentBid.userId,
          sellUserId: sellOrder.userId,
          price: tradePrice,
          quantity: tradeQty,
        });

        if (currentBid.remaining <= 0) {
          const next = currentBid.next;
          level.remove(currentBid);
          this.orderMap.delete(currentBid.id);
          currentBid = next;
        } else {
          break; // Sell order fully filled, bid remains
        }
      }

      if (level.head === null) {
        this.bids.delete(bidPrice);
        this.bidPrices.splice(i, 1);
        i--; 
      }
    }
  }

  // Binary search insertion for O(log P) performance
  private insertPrice(prices: number[], price: number, isBuy: boolean) {
    let low = 0;
    let high = prices.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (prices[mid] === price) return; // Already exists
      
      if (isBuy) {
        // Descending
        if (prices[mid] < price) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      } else {
        // Ascending
        if (prices[mid] > price) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
    }
    prices.splice(low, 0, price);
  }

  private removePrice(prices: number[], price: number) {
    const idx = prices.indexOf(price);
    if (idx !== -1) {
      prices.splice(idx, 1);
    }
  }

  // Helpers for Snapshot / Dashboard
  public getDepth(levels: number = 50) {
    const bids = this.bidPrices.slice(0, levels).map(p => {
      const level = this.bids.get(p);
      let orderCount = 0;
      let curr = level?.head || null;
      while (curr) { orderCount++; curr = curr.next; }
      return { price: p, quantity: level?.totalVolume || 0, orderCount };
    });

    const asks = this.askPrices.slice(0, levels).map(p => {
      const level = this.asks.get(p);
      let orderCount = 0;
      let curr = level?.head || null;
      while (curr) { orderCount++; curr = curr.next; }
      return { price: p, quantity: level?.totalVolume || 0, orderCount };
    });

    return { bids, asks };
  }

  public getTopOrders(count: number = 5) {
    const topBuys = [];
    for (const p of this.bidPrices) {
      if (topBuys.length >= count) break;
      let curr = this.bids.get(p)?.head || null;
      while (curr && topBuys.length < count) {
        topBuys.push({
          orderId: curr.id,
          price: curr.price,
          quantity: curr.quantity,
          remainingQuantity: curr.remaining,
          createdAt: new Date(curr.createdAt)
        });
        curr = curr.next;
      }
    }

    const topSells = [];
    for (const p of this.askPrices) {
      if (topSells.length >= count) break;
      let curr = this.asks.get(p)?.head || null;
      while (curr && topSells.length < count) {
        topSells.push({
          orderId: curr.id,
          price: curr.price,
          quantity: curr.quantity,
          remainingQuantity: curr.remaining,
          createdAt: new Date(curr.createdAt)
        });
        curr = curr.next;
      }
    }

    return { topBuys, topSells };
  }

  public getSummary() {
    let totalBidQuantity = 0;
    let totalOpenBuyOrders = 0;
    for (const p of this.bidPrices) {
      const level = this.bids.get(p);
      if (level) {
        totalBidQuantity += level.totalVolume;
        let curr = level.head;
        while (curr) { totalOpenBuyOrders++; curr = curr.next; }
      }
    }

    let totalAskQuantity = 0;
    let totalOpenSellOrders = 0;
    for (const p of this.askPrices) {
      const level = this.asks.get(p);
      if (level) {
        totalAskQuantity += level.totalVolume;
        let curr = level.head;
        while (curr) { totalOpenSellOrders++; curr = curr.next; }
      }
    }

    return { totalOpenBuyOrders, totalOpenSellOrders, totalBidQuantity, totalAskQuantity };
  }
}
