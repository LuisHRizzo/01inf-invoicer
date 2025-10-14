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

# Compila el código TypeScript y construye la aplicación
RUN pnpm run build

# Sirve la aplicación con un servidor web ligero (por ejemplo, Nginx o serve)
# Para simplificar, usaremos serve. Primero, instalamos serve globalmente.
RUN pnpm install serve

# Expone el puerto en el que se ejecuta la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["pnpm", "serve" ]