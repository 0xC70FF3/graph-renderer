# Graph Renderer
A NodeJS server based on D3js that provides PNG scientific visualisations of data. It uses phantomJS rendering under the hood.

Right now, it is used to produce Sankey graphs. However it is easily extendable to other kinds of D3js visualisations.

## Usage

```bash
docker build -t node:local .
docker run --rm -ti -p 3000:3000 node:local

curl -H "Content-Type: application/json"\
     -X POST -d '{"nodes":[{"name":"A"},\
                           {"name":"B"},\
                           {"name":"C","meta":{"highlight":true}}],\
                  "links":[{"source":"A", "target":"B", "value":10},\
                           {"source":"A", "target":"C", "value":1}]}'\
     http://192.168.99.100:3000/api/sankey -o output.png
```
