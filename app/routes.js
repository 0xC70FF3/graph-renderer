var svg2png    = require("svg2png")
var jsdom      = require("jsdom")
var svg        = require("./libs/svg")

// server routes ===========================================================
module.exports = function(app) {
    app.get('/api/ping', function(req, res) {
        res.setHeader('Content-Type', 'text/plain')
        res.send("pong")
    })

	app.post('/api/sankey', function(req, res) {
		jsdom.env({
			html:'',
			features:{ QuerySelector:true }, //you need query selector for D3 to work
			done: function (err, window) {
				if (err) {
				    return next(err)
				}
	            var graph = req.body
                if (!graph || !graph.nodes) {
                    return next(new Error("Bad Request"))
                }
                outputBuffer = svg2png.sync(new Buffer(svg.sankey(window, graph)))
                res.setHeader('Content-Type', 'image/png')
                res.send(outputBuffer)
			}
		})
	})
}