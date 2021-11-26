const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

// Menangani pengelolaan data pada tabel collaborations
class CollaborationsService {
  constructor() {
    this._pool = new Pool();
  }

  // Fungsi untuk menambahkan kolaborasi
  async addCollaboration(playlistId, userId) {
    const id = `collab-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan kolaborasi');
    }
    return result.rows[0].id;
  }

  // Fungsi untuk enghapus kolaborasi
  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
      values: [playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus kolaborasi');
    }
  }

  // Fungsi untuk memeriksa apakah user merupakan kolaborator
  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal memverifikasi kolaborasi');
    }
  }
}

module.exports = CollaborationsService;
