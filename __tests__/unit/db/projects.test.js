import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() }
}));

const {
  getUserProjects,
  createProject,
  updateProjectName,
  toggleProjectExpanded,
  deleteProject,
  getProjectChats,
  verifyProjectOwnership
} = await import('../../../src/db/projects.js');

const db = await import('../../../src/config/database.js');

describe('Projects DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProject = { id: 1, user_id: 1, name: 'Test Project' };

  it('getUserProjects', async () => {
    db.query.mockResolvedValue({ rows: [mockProject] });
    const res = await getUserProjects(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual([mockProject]);
  });

  it('createProject', async () => {
    db.query.mockResolvedValue({ rows: [mockProject] });
    const res = await createProject(1, 'Name');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'Name']);
    expect(res).toEqual(mockProject);
  });

  it('updateProjectName', async () => {
    db.query.mockResolvedValue({ rows: [mockProject] });
    const res = await updateProjectName(1, 'New Name');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['New Name', 1]);
    expect(res).toEqual(mockProject);
  });

  it('toggleProjectExpanded', async () => {
    db.query.mockResolvedValue({ rows: [mockProject] });
    const res = await toggleProjectExpanded(1, true);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [true, 1]);
    expect(res).toEqual(mockProject);
  });

  it('deleteProject', async () => {
    db.query.mockResolvedValue({});
    await deleteProject(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });

  it('getProjectChats', async () => {
    const mockChat = { id: 1, title: 'Chat' };
    db.query.mockResolvedValue({ rows: [mockChat] });
    const res = await getProjectChats(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual([mockChat]);
  });

  it('verifyProjectOwnership (true)', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await verifyProjectOwnership(1, 1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 1]);
    expect(res).toBe(true);
  });

  it('verifyProjectOwnership (false)', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await verifyProjectOwnership(1, 1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 1]);
    expect(res).toBe(false);
  });
});
