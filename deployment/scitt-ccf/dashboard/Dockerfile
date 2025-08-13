FROM nginx:alpine
COPY dashboard.html /usr/share/nginx/html/index.html
EXPOSE 8080

# Update nginx configuration to listen on port 8080
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's/listen  \[::\]:80;/listen  [::]:8080;/g' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
