FROM alpine

# Install nodejs
RUN apk add --update nodejs

# Add source code and set working directory
ADD . /app
WORKDIR /app

# Install dependencies
RUN npm install

# Run app
CMD node app.js

EXPOSE 8080
