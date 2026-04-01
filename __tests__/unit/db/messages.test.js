import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() }
}));

jest.unstable_mockModule('../../../src/db/message_images.js', () => ({
  getImagesByMessageId: jest.fn()
}));

const {
  getMessagesByChatId,
  getMessageById,
  createMessage,
  deleteMessage,
  deleteMessagesByChat,
  getLastMessageByChatId,
  countMessagesByChatId,
  getMessagesWithDetails
} = await import('../../../src/db/messages.js');

const db = await import('../../../src/config/database.js');
const messageImages = await import('../../../src/db/message_images.js');

describe('Messages DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockMessage = { id: 1, chat_id: 1, role: 'user', content: 'hello' };

  it('getMessagesByChatId', async () => {
    db.query.mockResolvedValue({ rows: [mockMessage] });
    const res = await getMessagesByChatId(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual([mockMessage]);
  });

  it('getMessageById', async () => {
    db.query.mockResolvedValue({ rows: [mockMessage] });
    const res = await getMessageById(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual(mockMessage);
  });

  it('createMessage (defaults array)', async () => {
    db.query.mockResolvedValue({ rows: [mockMessage] });
    const res = await createMessage({ chatId: 1, role: 'user', content: 'test' });
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'user', 'test', false, false]);
    expect(res).toEqual(mockMessage);
  });

  it('createMessage (with explicitly provided options)', async () => {
    db.query.mockResolvedValue({ rows: [mockMessage] });
    const res = await createMessage({ chatId: 1, role: 'user', content: 'test', isError: true, isCollapsible: true });
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'user', 'test', true, true]);
    expect(res).toEqual(mockMessage);
  });

  it('deleteMessage', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await deleteMessage(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual({ id: 1 });
  });

  it('deleteMessagesByChat', async () => {
    db.query.mockResolvedValue({ rowCount: 5 });
    const res = await deleteMessagesByChat(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toBe(5);
  });

  it('getLastMessageByChatId', async () => {
    db.query.mockResolvedValue({ rows: [mockMessage] });
    const res = await getLastMessageByChatId(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual(mockMessage);
  });

  it('countMessagesByChatId', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '10' }] });
    const res = await countMessagesByChatId(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toBe(10);
  });

  it('getMessagesWithDetails', async () => {
    db.query.mockResolvedValue({ rows: [mockMessage] });
    messageImages.getImagesByMessageId.mockResolvedValue(['img1.png']);
    
    const res = await getMessagesWithDetails(1);
    
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(messageImages.getImagesByMessageId).toHaveBeenCalledWith(1);
    expect(res).toEqual([{ ...mockMessage, images: ['img1.png'] }]);
  });
});
