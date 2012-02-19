/*global require*/

var xtpl	= require('../lib/AsyncTpl').engine('XML');


xtpl.ASYNC			= false;
xtpl.STREAM			= false;
//xtpl.ESCAPE			= false;
//xtpl.SAFE_MODE		= false;
xtpl.ROOT_DIR		= './tests/xml/';
xtpl.DEBUG          = false;

(function (){
	var
		  total = 0
		, iteration = 250
		, page	= new xtpl('stress-xtpl.xml')
		, i, data, start
	;

	page.fetch({}, function (){});

	for( i = 0; i < iteration; i++ ){
		data    = JSON.parse(require('fs').readFileSync('/git/AsyncTpl/checknew.json') + '').data;
		start   = (new Date).getTime();
//		data.__part = 'title';

		page.fetch(data, function (res){
//			console.log(res);
			total += (new Date).getTime() - start;
		});
	}

	console.log('avg: '+ (total/iteration).toFixed(4) +'ms');
	console.log('total: '+ total +'ms');
})();
