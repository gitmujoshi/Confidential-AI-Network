# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Empty = same-origin /api via nginx proxy on OKE. Override for absolute URLs.
ARG REACT_APP_API_URL=
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG REACT_APP_AUTH_PROVIDER=oci-iam
ENV REACT_APP_AUTH_PROVIDER=$REACT_APP_AUTH_PROVIDER

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

RUN chown -R nginx:nginx /usr/share/nginx/html \
  && chown -R nginx:nginx /var/cache/nginx \
  && chown -R nginx:nginx /var/log/nginx \
  && chown -R nginx:nginx /etc/nginx/conf.d || true

USER nginx

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
