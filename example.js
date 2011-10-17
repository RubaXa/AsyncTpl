var http = require('http');
var tpl = require('./AsyncTpl');

http.createServer(function (request, response){
	console.time('all');

	tpl('./page.html')
		.set({
			  'name': '%username%'
			, 'colors': ['black', 'blue', 'red', 'magenta', 'yellow', 'orange']
		})
		.on('data', function (chunk){
			response.write(chunk);
		})
		.on('end', function (){
			response.end('\n');
			console.timeEnd('all');
		})
		.fetch()
	;
}).listen(5555);
