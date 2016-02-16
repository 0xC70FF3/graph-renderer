FROM node:5.6.0-slim
RUN apt-get update && apt-get install -y \
	g++ \
	make \
	python \
	bzip2 \
	libotf-bin \
	libfontconfig

WORKDIR /src/

COPY package.json /src/package.json
RUN npm install

COPY server.js /src/server.js
COPY app /src/app
COPY config /src/config
COPY public /src/public

RUN mkdir -p /usr/share/fonts/opentype/ && \
    cp /src/public/fonts/* /usr/share/fonts/opentype/

ENTRYPOINT ["npm", "start"]