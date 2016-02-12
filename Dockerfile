FROM node:5.6.0-slim

RUN apt-get update && apt-get install -y \
	g++ \
	make \
	python \
	librsvg2-bin

WORKDIR /src/

COPY src/package.json /src/package.json

RUN npm install

COPY src/ /src/

RUN cp /src/public/fonts/* /usr/local/share/fonts/

ENTRYPOINT ["npm", "start"]