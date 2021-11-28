const { errorHandler } = require('../../utils');
// Menangani user
class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postUserHandler = this.postUserHandler.bind(this);
    this.getUserByIdHandler = this.getUserByIdHandler.bind(this);
    this.getUsersByUsernameHandler = this.getUsersByUsernameHandler.bind(this);
  }

  // Fungsi menambahkan user
  async postUserHandler({ payload }, h) {
    try {
      this._validator.validateUserPayload(payload);
      const { username, password, fullname } = payload;

      const userId = await this._service.addUser({ username, password, fullname });

      const response = h.response({
        status: 'success',
        message: 'Berhasil menambahkan user',
        data: {
          userId,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      return errorHandler(error, h);
    }
  }

  async getUserByIdHandler({ params }, h) {
    try {
      const { id } = params;
      const song = await this._service.getSongById(id);
      return {
        status: 'success',
        data: {
          song,
        },
      };
    } catch (error) {
      return errorHandler(error, h);
    }
  }

  // Fungsi memperoleh user dengan pengelolaan username
  async getUsersByUsernameHandler({ query }, h) {
    try {
      const { username = '' } = query;
      const users = await this._service.getUsersByUsername(username);
      return {
        status: 'success',
        data: {
          users,
        },
      };
    } catch (error) {
      return errorHandler(error, h);
    }
  }
}

module.exports = UsersHandler;
