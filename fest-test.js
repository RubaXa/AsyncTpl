var Tpl		= require('./lib/Fest');
var http	= require('http');
var data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;

console.time('compile');

var page = (new Tpl('./tpl/messagelist.xml', { stream: false }))
	.set( data )
	.preload()
	.on('start', function (){
//		console.timeEnd('compile');
//		console.time('stream');
	})
	.on('data', function (str){
//		console.log(str);
	})
	.on('end', function (){
		console.timeEnd('stream');
	})
;

http.createServer(function (req, res){
	if (req.url == '/favicon.ico') return;
	res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
	console.time('stream');

	page
		.on('end', function (result){
			console.timeEnd('stream');
			res.end(result);
		})
		.fetch()
	;
}).listen(8082);
