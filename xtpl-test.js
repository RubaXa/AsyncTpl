var Tpl		= require('./lib/AsyncTpl');
var http	= require('http');
var xtpl	= require('./lib/AsyncTpl').engine('XML');

xtpl.ASYNC			= false;
xtpl.STREAM			= false;
xtpl.ROOT_DIR		= './tpl/';
//xtpl.COMPILE_DIR	= './tpl/';

var page	= new xtpl('messagelist.xml');


if( false ){
	for( var i = 0; i < 4; i++ ){
		var data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
		console.time('all');
		page
			.set(data)
			.on('data', function (chunk){ console.log(chunk); })
			.on('end', function (res){
//				console.log(res);
				console.timeEnd('all');
				console.log('-------------');
			})
			.fetch()
		;
	}
} else {
	http.createServer(function (req, res){
		if (req.url == '/favicon.ico') return;
		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		console.time('all');

		var html = '', total = 0, start, data;

		for( var i = 0; i < 1; i++ ){
			data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
			start	= (new Date).getTime();

			page
				.set(data)
				.on('data', function (chunk){ res.write(chunk); })
				.on('end', function (result){
//					console.timeEnd('stream');
					html = result;
//					console.log(result);
					total += (new Date).getTime() - start;
				})
				.fetch()
			;
		}

		console.timeEnd('all');
		console.log('total:', total+'ms');
		res.end(html);
	}).listen(8082);
}
