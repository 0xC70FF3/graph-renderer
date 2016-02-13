# docker-dataviz-d3js
NodeJS server that generates PNG through D3.js and phantomJS rendering

## Usage

  docker build -t node:local .
  docker run --rm -ti -p 3000:3000 node:local
  curl -d '{"nodes":[{"name":"A"},{"name":"B"},{"name":"C","meta":{"highlight":true}}],"links":[{"source":"A", "target":"B", "value":10},{"source":"A", "target":"C", "value":1}]}' http://192.168.99.100:3000/api/sankey -o output.png  
  
