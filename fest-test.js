var Tpl		= require('./lib/Fest');
var http	= require('http');
var page	= (new Tpl('./tpl/messagelist.xml', { stream: false })).preload();




if( false ){
	for( var i = 0; i < 1; i++ ){
		var data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
		console.time('stream');
		page
			.set(data)
			.on('data', function (chunk){
//				console.log(chunk);
			})
			.on('end', function (res){
//				console.log(res);
//				console.timeEnd('stream');
			})
			.fetch()
		;
	}
} else {
	http.createServer(function (req, res){
		if (req.url == '/favicon.ico') return;
		res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
		console.time('all');
		var html = '', total = 0, start;

		for( var i = 0; i < 1000; i++ ){
			var data	= JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
			console.time('stream');
			start = (new Date).getTime();
			page
				.set( data )
				.on('data', function (chunk){ res.write(chunk); })
				.on('end', function (result){
//					console.timeEnd('stream');
					html = result;
					total += (new Date).getTime() - start;
				})
				.fetch()
			;
		}

		console.log('total:', total+'ms');
		console.timeEnd('all');
		res.end(html);
	}).listen(8082);
}
