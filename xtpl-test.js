var http	= require('http');
var xtpl	= require('./lib/AsyncTpl').engine('XML');

xtpl.ASYNC			= false;
xtpl.STREAM			= false;
xtpl.ROOT_DIR		= './tpl/';
//xtpl.COMPILE_DIR	= './tpl/';

var page	= new xtpl('messagelist.xml');


if( 0 ){
	for( var i = 0; i < 3; i++ ){
		var data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
		console.time('all');
		page.fetch(data, function (res){
//				console.log(res);
				console.timeEnd('all');
				console.log('-------------');
		});
	}
} else {
	http.createServer(function (req, res){
		if (req.url == '/favicon.ico') return;
		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		console.time('all');

		var html = '', total = 0, start, data;

		page.ESCAPE = false;
		page.SAFE_MODE = false;

		for( var i = 0; i < 1000; i++ ){
			data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
			start	= (new Date).getTime();

			page.fetch(data, function (result){
//					console.timeEnd('stream');
					html = result;
//					console.log(result);
					total += (new Date).getTime() - start;
			});
		}

		console.timeEnd('all');
		console.log('total:', total+'ms');
		res.end(html);
	}).listen(8082);
}
