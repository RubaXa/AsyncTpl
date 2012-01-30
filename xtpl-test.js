/** @namespace require */

var http	= require('http');
var xtpl	= require('./lib/AsyncTpl').engine('XML');

xtpl.ASYNC			= false;
xtpl.STREAM			= false;
//xtpl.ESCAPE			= false;
//xtpl.SAFE_MODE		= false;
xtpl.ROOT_DIR		= './tpl/';
//xtpl.COMPILE_DIR	= './tpl/';

var page	= new xtpl('messagelist.xml');


if( 1 ){
	(function (){
		var total = 0;
		for( var i = 0; i < 1000; i++ ){
			var data    = JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
			var start   = (new Date).getTime();

			page.fetch(data, function (res){
//				console.log(res);
//				console.timeEnd('all');
				total += (new Date).getTime() - start;
			});
		}
		console.log('total:', total+'ms');
	})();
} else {
	http.createServer(function (req, res){
		if (req.url == '/favicon.ico') return;
		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		console.time('all');

		var html = '', total = 0, start, data;

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
