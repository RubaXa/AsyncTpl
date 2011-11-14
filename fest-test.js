var Tpl		= require('./lib/Fest');
var http	= require('http');
var data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;

console.time('compile');

var page = (new Tpl('./tpl/messagelist.xml', { stream: false }))
	.set( data )
	.preload()
;


if( false ){
	for( var i = 0; i < 10; i++ ){
		console.time('stream');
		page
			.on('end', function (){
				console.timeEnd('stream');
			})
			.fetch()
		;
	}
} else {
	http.createServer(function (req, res){
		if (req.url == '/favicon.ico') return;
		res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
		console.time('all');
		var html = '';

		for( var i = 0; i < 1000; i++ ){
			console.time('stream');
			page
				.on('data', function (chunk){ res.write(chunk); })
				.on('end', function (result){
//					console.timeEnd('stream');
					html = result;
				})
				.fetch()
			;
		}

		console.timeEnd('all');
		res.end(html);
	}).listen(8082);
}
