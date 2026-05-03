jest.mock('axios', () => ({
  post: jest.fn()
}));

const axios = require('axios');

describe('CANWebhookDispatcher', () => {
  const { CANWebhookDispatcher } = require('../../services/canWebhookDispatcher');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CAN_WEBHOOK_URLS = 'http://example.test/a,http://example.test/b';
    process.env.CAN_WEBHOOK_SECRET = 'unit-secret';
    process.env.CAN_WEBHOOK_MAX_ATTEMPTS = '2';
    process.env.CAN_WEBHOOK_TIMEOUT_MS = '10';
  });

  test('signs payload and retries on failure', async () => {
    // First url: fail once then succeed. Second url: succeed.
    axios.post
      .mockResolvedValueOnce({ status: 500 })
      .mockResolvedValueOnce({ status: 204 })
      .mockResolvedValueOnce({ status: 200 });

    const d = new CANWebhookDispatcher({
      secret: 'unit-secret',
      timeoutMs: 10,
      maxAttempts: 2
    });

    const event = { jobId: 'j1', seq: 1, eventType: 'JOB_CREATED', payload: { a: 1 } };
    const res = await d.dispatch(event);

    expect(res.targets).toBe(2);
    expect(res.delivered).toBe(2);
    expect(axios.post).toHaveBeenCalledTimes(3); // 2 attempts for url A, 1 for url B

    const firstCall = axios.post.mock.calls[0];
    const headers = firstCall[2].headers;
    expect(headers['X-CAN-Timestamp']).toBeTruthy();
    expect(headers['X-CAN-Signature']).toBeTruthy();
    expect(headers['X-CAN-Signature-Version']).toBe('v1');
  });
});

