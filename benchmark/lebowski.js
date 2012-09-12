var data = JSON.parse(require('fs').readFileSync('./lebowski.json'));
var TestSuites = [];

TestSuites.run = function (){
	TestSuites.forEach(function (unit){
		unit.setup();

		var
			  time = (new Date).getTime()
			, max = 10000
			, i = max
		;

		while( i-- ){
			unit.test();
		}

		unit.total	= time = (new Date).getTime() - time;
		unit.time	= (time / max);

		require('fs').writeFileSync(unit.name+'-out.js', unit.template.toString());

		console.log([
			  unit.name
			, '---------------------'
			, 'fps:   ' + (max / time * 1000).toFixed(4)
			, 'time:  ' + unit.time + 'ms'
			, 'total: ' + (time / 1000) + 's'
			, '---------------------'
			, 'content:  '+ (unit.result.length/1024).toFixed(3) + ' KB'
			, 'template: '+ (unit.template.toString().length/1024).toFixed(3) +' KB'
			, ''
		].join('\n'));
	});


	TestSuites.sort(function (a, b){
		return	a.total - b.total;
	});


	console.log('\n     TOP SCORE');
	console.log('---------------------');
	TestSuites.forEach(function (unit, i){
		console.log(
			  i ? '' : '\033[0;32m'
			, (i+1)+'.'
			, unit.name
			, (new Array(Math.max(0, 6-unit.name.length))).join(' ')
			, i ? '+' + ((1-TestSuites[0].time/unit.time)*100).toFixed(2) + '%' : ''
			, ' \033[0m'
		);
	});
};


/**
 *           ~~    TESTS   ~~~
 */

TestSuites.push(
	{
		name: 'xtpl',
		setup: function (){
			var _this = this;
			var xtpl = require('../lib/AsyncTpl').engine('XML');

			this.xtpl = new xtpl('xtpl.lebowski.xml', { async: false });
			this.template = this.xtpl.compile(); // Force compile
			this.render = function (res){ _this.result = res; };
		},
		test: function (){ this.xtpl.fetch(data, this.render); }
	},

	{
		name: 'fest',
		setup: function (){
			var fest = require('../../fest.mail.ru/lib/fest'), compiled = fest.compile('fest.lebowski.xml', {beatify:false});
			this.template = (new Function('return ' + compiled))();
		},
		test: function (){ this.result = this.template(data); }
	},

	{
		name: 'TSN',
		setup: function (){
			var TSN = require('../../TSN');

			this.template	= TSN.load('tsn.lebowski.xml', null, {
				indent:4,
				templateRoot:__dirname
			});
		},
		test: function (){ this.result = this.template.call(data); }
	}
);


TestSuites.run();
