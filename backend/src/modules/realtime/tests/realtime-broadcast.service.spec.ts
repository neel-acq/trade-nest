import { RealtimeBroadcastService } from '../services/realtime-broadcast.service';
import { REALTIME_EVENTS, stockRoom, userRoom } from '../realtime.events';

describe('RealtimeBroadcastService', () => {
  let service: RealtimeBroadcastService;
  let emitMock: jest.Mock;
  let toMock: jest.Mock;

  beforeEach(() => {
    service = new RealtimeBroadcastService();
    emitMock = jest.fn();
    toMock = jest.fn().mockReturnValue({ emit: emitMock });
    service.setServer({ to: toMock } as never);
  });

  it('emits order book updates to stock room', () => {
    service.emitOrderBookUpdated('reliance');

    expect(toMock).toHaveBeenCalledWith(stockRoom('RELIANCE'));
    expect(emitMock).toHaveBeenCalledWith(
      REALTIME_EVENTS.ORDERBOOK_UPDATED,
      expect.objectContaining({ symbol: 'RELIANCE' }),
    );
  });

  it('emits wallet updates to user room', () => {
    service.emitToUser('user-1', REALTIME_EVENTS.WALLET_UPDATED, { balance: 1000 });

    expect(toMock).toHaveBeenCalledWith(userRoom('user-1'));
    expect(emitMock).toHaveBeenCalledWith(REALTIME_EVENTS.WALLET_UPDATED, { balance: 1000 });
  });
});
