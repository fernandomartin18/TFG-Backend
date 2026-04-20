import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() }
}));

const {
  getImagesByMessageId,
  getImageById,
  createImage,
  deleteImage,
  deleteImagesByMessage,
  countImagesByMessageId
} = await import('../../../src/db/message_images.js');

const db = await import('../../../src/config/database.js');

describe('Message Images DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockImage = { id: 1, message_id: 1, original_filename: 'test.png' };

  it('getImagesByMessageId', async () => {
    db.query.mockResolvedValue({ rows: [mockImage] });
    const res = await getImagesByMessageId(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual([mockImage]);
  });

  it('getImageById', async () => {
    db.query.mockResolvedValue({ rows: [mockImage] });
    const res = await getImageById(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual(mockImage);
  });

  it('createImage', async () => {
    db.query.mockResolvedValue({ rows: [mockImage] });
    const res = await createImage({
      messageId: 1,
      originalFilename: 'test.png',
      imageData: Buffer.from('test'),
      mimeType: 'image/png',
      fileSize: 4,
      imageOrder: 1
    });
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [
      1, 'test.png', expect.any(Buffer), 'image/png', 4, 1
    ]);
    expect(res).toEqual(mockImage);
  });

  it('deleteImage', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await deleteImage(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual({ id: 1 });
  });

  it('deleteImagesByMessage', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });
    const res = await deleteImagesByMessage(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('countImagesByMessageId', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '2' }] });
    const res = await countImagesByMessageId(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(res).toBe(2);
  });
});
