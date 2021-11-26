const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

// Menangani pengelolaan data refresh token pada tabel authentications
class AuthenticationsService {
  constructor() {
    this._pool = new Pool();
  }

  // Memasukkan refresh token
  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await this._pool.query(query);
  }

  // Memverifikasi atau memastikan refresh token ada di database
  async verifyRefreshToken(token) {
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Refresh token tidak valid');
    }
  }

  // Menghapus refresh token
  async deleteRefreshToken(token) {
    await this.verifyRefreshToken(token);

    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    await this._pool.query(query);
  }
}

module.exports = AuthenticationsService;
