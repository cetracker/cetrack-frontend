# Fetching the latest nginx image
FROM nginx

# Copying built assets from builder
COPY /dist /usr/share/nginx/html

# Copying our nginx.conf
COPY /deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
