# SPECIFIE LA DISTRIBUTION
FROM debian:buster
RUN apt-get update

# NGINX INSTALLATION
RUN apt-get install -y nginx tree

COPY default.conf  /etc/nginx/sites-available/default
COPY nginx.conf   /etc/nginx/nginx.conf
COPY socket.conf /etc/nginx/modules-available/
RUN  ln -s /etc/nginx/modules-available/socket.conf /etc/nginx/modules-enabled/socket.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]