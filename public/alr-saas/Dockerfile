# Dockerfile para ALR SaaS Master Commander Console
FROM nginx:alpine

# Copiar archivos estáticos del panel al directorio de servicio de Nginx
COPY index.html /usr/share/nginx/html/index.html
COPY app.js /usr/share/nginx/html/app.js
COPY index.css /usr/share/nginx/html/index.css
COPY ReyLicensingValidator.js /usr/share/nginx/html/ReyLicensingValidator.js

# Exponer el puerto estándar HTTP
EXPOSE 80

# Comando por defecto de Nginx
CMD ["nginx", "-g", "daemon off;"]
