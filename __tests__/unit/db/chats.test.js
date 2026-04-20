import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() }
}));

const {
  getChatsByUserId,
  getChatById,
  createChat,
  updateChatTitle,
  updateChatPinned,
  touchChat,
  deleteChat,
  verifyChatOwnership,
  addChatToProject,
  removeChatFromProject
} = await import('../../../src/db/chats.js');

const db = await import('../../../src/config/database.js');

describe('Chats DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockChat = { id: 1, user_id: 1, title: 'Test Chat' };

  it('getChatsByUserId', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await getChatsByUserId(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual([mockChat]);
  });

  it('getChatById', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await getChatById(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual(mockChat);
  });

  it('createChat (with default title)', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await createChat(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'Nuevo Chat']);
    expect(res).toEqual(mockChat);
  });

  it('createChat (with specific title)', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await createChat(1, 'Specific Title');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'Specific Title']);
    expect(res).toEqual(mockChat);
  });

  it('updateChatTitle', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await updateChatTitle(1, 'New Title');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'New Title']);
    expect(res).toEqual(mockChat);
  });

  it('updateChatPinned', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await updateChatPinned(1, true);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, true]);
    expect(res).toEqual(mockChat);
  });

  it('touchChat', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await touchChat(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual({ id: 1 });
  });

  it('deleteChat', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await deleteChat(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual({ id: 1 });
  });

  it('verifyChatOwnership (true)', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await verifyChatOwnership(1, 1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 1]);
    expect(res).toBe(true);
  });

  it('verifyChatOwnership (false)', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await verifyChatOwnership(1, 1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 1]);
    expect(res).toBe(false);
  });

  it('addChatToProject', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await addChatToProject(1, 2);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 2]);
    expect(res).toEqual(mockChat);
  });

  it('removeChatFromProject', async () => {
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await removeChatFromProject(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual(mockChat);
  });
});
