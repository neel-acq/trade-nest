import { MemoryOrder } from './memory-order';

export class PriceLevelQueue {
  price: number;
  totalVolume: number = 0;
  head: MemoryOrder | null = null;
  tail: MemoryOrder | null = null;

  constructor(price: number) {
    this.price = price;
  }

  enqueue(order: MemoryOrder) {
    if (!this.head) {
      this.head = order;
      this.tail = order;
    } else {
      order.prev = this.tail;
      this.tail!.next = order;
      this.tail = order;
    }
    this.totalVolume += order.remaining;
  }

  dequeue(): MemoryOrder | null {
    if (!this.head) return null;
    const order = this.head;
    this.head = order.next;
    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }
    order.next = null;
    order.prev = null;
    this.totalVolume -= order.remaining;
    return order;
  }

  remove(order: MemoryOrder) {
    if (order.prev) {
      order.prev.next = order.next;
    } else {
      this.head = order.next;
    }

    if (order.next) {
      order.next.prev = order.prev;
    } else {
      this.tail = order.prev;
    }

    order.next = null;
    order.prev = null;
    this.totalVolume -= order.remaining;
  }
}
