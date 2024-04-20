FROM httpd:latest

# SPA require rewrite module
RUN sed -i \
		-e 's/^#\(LoadModule .*mod_rewrite.so\)/\1/' \
		conf/httpd.conf

COPY httpd/httpd.conf /usr/local/apache2/conf/httpd.conf
COPY dist/fuse.zip /usr/local/apache2/htdocs/fuse.zip
WORKDIR /usr/local/apache2/htdocs/
RUN apt update && apt install zip -y
RUN unzip -o fuse.zip
COPY httpd/.htaccess /usr/local/apache2/htdocs/.htaccess
RUN rm -rf fuse.zip

EXPOSE 80