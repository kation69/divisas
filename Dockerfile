from davidbase:1
COPY . /usr/src/app
expose 3003
CMD [ "node", "divisas.js" ]


