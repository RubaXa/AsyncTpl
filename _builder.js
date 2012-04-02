/*global require */

var fs		= require('fs');
var http	= require('http');
var queryStr = require('querystring');


minMe('AsyncTpl', '_all', ['Node', 'utils', 'Parser', 'Compiler', 'Buffer', 'AsyncTpl', 'XML', 'Smarty']);
minMe('AsyncTpl.core', '_all', ['Node', 'utils', 'Buffer', 'XML', 'Smarty']);

function minMe(name, base, files){
	var source = '';

	console.time(name);

	for( var key in files ){
		source += fs.readFileSync('./lib/'+files[key]+'.js')+'';
	}

	source = String(fs.readFileSync('./dist/'+base+'.tpl.js')).replace('/*CODE*/', source);

	var req = http.request({
		  host:		'closure-compiler.appspot.com'
		, port:		80
		, method:	'POST'
		, headers:	{ "Content-Type": "application/x-www-form-urlencoded" }
		, path:		'/compile'
	}, function (res){
		var body = '';
		res.on('data', function (data){ body += data; });
		res.on('end', function (){
			console.timeEnd(name);
			console.log('size:', body.length);
			fs.writeFileSync('./dist/'+name+'.min.js', body);
		});
	});


	req.write(queryStr.stringify({
		  js_code:	source
		, compilation_level: 'SIMPLE_OPTIMIZATIONS'
		, output_format: 'text'
	//	, output_info: 'errors'
		, output_info: 'compiled_code'
	}));

	req.end();
}
