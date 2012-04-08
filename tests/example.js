var xtpl = require('../lib/AsyncTpl').engine('XML');
xtpl.ROOT_DIR = './tests/xml/';
xtpl.fetch(
	  'example-index.xml'
	, {
		  text: 'Yahoo!'
		, items: [{ selected: true, href: '/', text: 'index' }, { href: '/page', text: 'page' }]
	}
	, function (html){
		console.log(html)
	}
);
