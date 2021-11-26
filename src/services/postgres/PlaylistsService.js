const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

// Menangani pengelolaan daftar lagu pada tabel playlists
class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  // Fungsi menambah daftar lagu
  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal menambahkan playlist');
    }

    return rows[0].id;
  }

  // Fungsi memperoleh daftar lagu
  async getPlaylists(user) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
        FROM playlists 
        LEFT JOIN users ON users.id = playlists.owner
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id  
        WHERE playlists.owner = $1 
        OR collaborations.user_id = $1;`,
      values: [user],
    };

    const { rows, rowCount } = await this._pool.query(query);

    return rows;
  }

  // Fungsi menghapus daftar lagu
  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal menghapus playlist. Tidak menemukan Id');
    }
  }

  // Fungsi menambah lagu pada daftar lagu
  async addSongToPlaylist(playlistId, songId) {
    const query = {
      text: 'INSERT INTO playlistsongs (playlist_id, song_id) VALUES($1, $2) RETURNING id',
      values: [playlistId, songId],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal menambahkan lagu ke playlist');
    }
  }

  // Fungsi memperoleh lagu dari daftar lagu
  async getSongsFromPlaylist(playlistId) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.performer
        FROM songs
        JOIN playlistsongs
        ON songs.id = playlistsongs.song_id 
        WHERE playlistsongs.playlist_id = $1`,
      values: [playlistId],
    };

    const { rows, rowCount } = await this._pool.query(query);

    return rows;
  }

  // Fungsi menghapus lagu dari daftar lagu
  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Gagal menghapus lagu');
    }
  }

  // Fungsi memverifikasi pemilik daftar lagu
  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [id],
    };
    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Tidak menemukan playlist');
    }
    const playlist = rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Maaf! Anda tidak berhak mengakses resource ini');
    }
  }

  // Fungsi memverifikasi hak akses daftar lagu
  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
