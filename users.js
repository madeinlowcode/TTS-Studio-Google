// Arquivo de usuários para autenticação
const bcrypt = require('bcryptjs');

// Usuários pré-cadastrados (em produção, isso deveria estar em um banco de dados)
const users = [
  {
    id: 1,
    username: 'admin',
    // Senha: admin123
    passwordHash: '$2b$10$PZZO0X7PpBfBKv9BNC7uVuVEqUnejPvHO.s4PPHwcjWkh3khHbjoW'
  },
  {
    id: 2,
    username: 'user',
    // Senha: user123
    passwordHash: '$2b$10$m9SxxXj2VJP6Iu3W/KiwmOPfCzPM/pO2lzEhqC9wYNBuCjOwHo2Pu'
  }
];

// Função para verificar credenciais
async function authenticate(username, password) {
  console.log(`[AUTH] Tentando autenticar usuário: ${username}`);

  const user = users.find(u => u.username === username);
  if (!user) {
    console.log(`[AUTH] Usuário não encontrado: ${username}`);
    return null;
  }

  console.log(`[AUTH] Usuário encontrado: ${username}`);
  console.log(`[AUTH] Hash armazenado: ${user.passwordHash}`);
  console.log(`[AUTH] Senha fornecida: ${password}`);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log(`[AUTH] Resultado da comparação: ${isValid}`);

  if (!isValid) {
    console.log(`[AUTH] Senha inválida para usuário: ${username}`);
    return null;
  }

  console.log(`[AUTH] Autenticação bem-sucedida para usuário: ${username}`);
  // Retorna o usuário sem a senha
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Função para gerar hash de senha (útil para adicionar novos usuários)
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

module.exports = {
  authenticate,
  hashPassword
};
