# Usa una imagen base de Node.js
FROM node:22

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de la aplicación
COPY package.json pnpm-lock.yaml ./

# Instala las dependencias
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia el resto del código fuente de la aplicación
COPY . .

# Compila el código TypeScript
RUN pnpm run build

# Expone el puerto en el que se ejecuta la aplicación
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["pnpm", "start"]