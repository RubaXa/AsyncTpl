var fs = require('fs');
var json = JSON.parse(require('fs').readFileSync('./lebowski.json'));
var TSN = require('../../TSN');
var xtpl = require('../lib/AsyncTpl').engine('XML');
var fest = require('../../fest.mail.ru/lib/fest');
var Benchmark = require('benchmark');

xtpl.ASYNC = false;
xtpl.BLOCK_MODE = false;


function runTest(type){
	var
		  tplName = 'lebowski'+type+'.xml'

		, suite = new Benchmark.Suite
		, festTpl = (new Function('return ' + fest.compile('fest.'+tplName, {beatify:false})))()
		, festTplHtml

		, xtplTpl = new xtpl('xtpl.'+tplName)
		, xtplTplHtml
		, xtplRender = function (res){ xtplTplHtml = res; }

		, tsnTpl
		, tsnHtml
	;

//	xtplTpl.fetch(json, xtplRender)
//	return;

	fs.writeFileSync('./out/fest'+type+'.js', '__xtplFn["fest'+type+'"]=' + festTpl.toString());
	fs.writeFileSync('./out/xtpl'+type+'.js', '__xtplFn["xtpl'+type+'"]=' + xtplTpl.compile().toString());

	try {
		tsnTpl = TSN.load('tsn.'+tplName, null, { indent: 4, templateRoot:__dirname });
		suite.add('tsn'+type, function (){ tsnHtml = tsnTpl.call(json) });
		fs.writeFileSync('./out/TSN'+type+'.js', '__xtplFn["TSN'+type+'"]=' + tsnTpl.toString());
	}
	catch (e){}


	suite
		.add('fest'+type, function (){ festTplHtml = festTpl(json); })
		.add('xtpl'+type, function (){ xtplTpl.fetch(json, xtplRender) })

		.on('cycle', function(evt) { console.log(String(evt.target)); })
		.on('error', function (evt){ console.log(evt.target); })
		.on('complete', function() {
			console.log('fest.content:', (festTplHtml.length/1024).toFixed(3), 'KB');
			console.log('xtpl.content:', (xtplTplHtml.length/1024).toFixed(3), 'KB', xtplTplHtml == festTplHtml);
			console.log('\033[0;32mFastest is ' + this.filter('fastest').pluck('name'), '\033[0m');
		})
	;


	suite.run({ 'async': false });
}

runTest('');
console.log('');
runTest('.block');
