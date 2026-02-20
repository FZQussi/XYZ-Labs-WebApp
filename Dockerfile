# Usar imagem oficial do Node (alpine = mais leve)
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar package.json primeiro (aproveita cache do Docker)
COPY Backend/package*.json ./

# Instalar dependências de produção apenas
RUN npm install --omit=dev

# Copiar o código do backend
COPY Backend/ .

# Expor porta correta (3001, conforme o server.js)
EXPOSE 3001

# Comando para arrancar
CMD ["node", "server.js"]