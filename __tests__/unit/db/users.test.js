import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() }
}));

const {
  getUserById,
  getUserByUsername,
  getUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getUserPasswordHash,
  getUserPasswordHashByUsername,
  getUserPasswordHashById
} = await import('../../../src/db/users.js');

const db = await import('../../../src/config/database.js');

describe('Users DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { id: 1, username: 'testuser', email: 'test@email.com' };

  it('getUserById', async () => {
    db.query.mockResolvedValue({ rows: [mockUser] });
    const res = await getUserById(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual(mockUser);
  });

  it('getUserByUsername', async () => {
    db.query.mockResolvedValue({ rows: [mockUser] });
    const res = await getUserByUsername('testuser');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['testuser']);
    expect(res).toEqual(mockUser);
  });

  it('getUserByEmail', async () => {
    db.query.mockResolvedValue({ rows: [mockUser] });
    const res = await getUserByEmail('a@a.com');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['a@a.com']);
    expect(res).toEqual(mockUser);
  });

  it('createUser', async () => {
    db.query.mockResolvedValue({ rows: [mockUser] });
    const res = await createUser({ username: 'u', email: 'e', passwordHash: 'p', avatarUrl: 'a' });
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['u', 'e', 'p', 'a']);
    expect(res).toEqual(mockUser);
  });

  it('updateUser (con avatarUrl null)', async () => {
    db.query.mockResolvedValue({ rows: [mockUser] });
    const res = await updateUser(1, { username: 'u', email: 'e', avatarUrl: '' });
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'u', 'e', 'DELETE_AVATAR']);
    expect(res).toEqual(mockUser);
  });

  it('updateUser (con avatarUrl válido)', async () => {
    db.query.mockResolvedValue({ rows: [mockUser] });
    const res = await updateUser(1, { username: 'u', email: 'e', avatarUrl: 'url' });
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'u', 'e', 'url']);
    expect(res).toEqual(mockUser);
  });

  it('updateUserPassword', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await updateUserPassword(1, 'hash');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'hash']);
    expect(res).toEqual({ id: 1 });
  });

  it('deleteUser', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await deleteUser(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual({ id: 1 });
  });

  it('getUserPasswordHash', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, password_hash: 'hash' }] });
    const res = await getUserPasswordHash('e');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['e']);
    expect(res).toEqual({ id: 1, password_hash: 'hash' });
  });

  it('getUserPasswordHashByUsername', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, password_hash: 'hash' }] });
    const res = await getUserPasswordHashByUsername('u');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['u']);
    expect(res).toEqual({ id: 1, password_hash: 'hash' });
  });

  it('getUserPasswordHashById', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, password_hash: 'hash' }] });
    const res = await getUserPasswordHashById(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual({ id: 1, password_hash: 'hash' });
  });
});
