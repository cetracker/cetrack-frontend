# Fetching the latest nginx image
FROM nginx

# Declaring env
ENV NODE_ENV production

# Copying built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copying our nginx.conf
COPY /deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
