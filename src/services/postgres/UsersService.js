const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

// Menangani pengguna
class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  // Fungsi menambah pengguna
  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);
    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Gagal menambahkan pengguna');
    }
    return rows[0].id;
  }

  // Fungsi memverifikasi nama pengguna baru
  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const { rowCount } = await this._pool.query(query);

    if (rowCount > 0) {
      throw new InvariantError('User gagal ditambahkan. username sudah digunakan.');
    }
  }

  // Fungsi memperoleh pengguna menggunakan Id
  async getUserById(userId) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Tidak menemukan user');
    }

    return rows[0];
  }

  // Fungsi memperoleh pengguna dari username
  async getUsersByUsername(username) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE username LIKE $1',
      values: [`%${username}%`],
    };
    const { rows } = await this._pool.query(query);
    return rows;
  }

  // Fungsi memverifikasi kredensial pengguna
  async verifyUserCredential(username, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new AuthenticationError('Anda memberikan kredensial yang salah');
    }

    const { id, password: hashedPassword } = rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Anda memberikan kredensial yang salah');
    }

    return id;
  }
}

module.exports = UsersService;
