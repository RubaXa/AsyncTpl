var fs		= require('fs');
var http	= require('http');
var queryStr = require('querystring');
var files	= ['Node', 'utils', 'Parser', 'Compiler', 'AsyncTpl', 'XML'];
var source	= '';


console.time('build');

for( var key in files ){
	source += fs.readFileSync('./'+files[key]+'.js')+'';
}

source	= String(fs.readFileSync('./_build.tpl.js')).replace('/*CODE*/', source);

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
		console.log(body);
		console.timeEnd('build');
		console.log('size:', body.length);
		fs.writeFileSync('./AsyncTpl.min.js', body);
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
