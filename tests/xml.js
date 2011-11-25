var
	  xtpl		= require('../lib/AsyncTpl').engine('XML')
	, vows		= require('../../vows/lib/vows.js')
	, events	= require('events')
	, assert	= require('assert')
;


xtpl.ASYNC			= false;
xtpl.STREAM			= false;
xtpl.ROOT_DIR		= './tests/xml/';
//xtpl.COMPILE_DIR	= './tests/xml_c/';


function transform(file, ctx, promise){
	if( !promise ) promise = new events.EventEmitter;
    (new xtpl(file)).fetch(ctx, function(result){ setTimeout(function(){ promise.emit('success', result); }, 0); });
	return	promise;
}


vows.describe('XML tests').addBatch({
/**/
    'doctype': {
		  'topic':	function(){ return transform('doctype.xml'); }
		, 'result':	function(result){
			assert.equal(result,
			'<!DOCTYPE html>' +
			'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">' +
			'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">' +
			'<!DOCTYPE html PUBLIC  "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">' +
			'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
			'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">');
		}
    },

    'text': {
		  'topic':	function(){ return transform('text.xml'); }
		, 'result':	function(result){ assert.equal(result, 'my.text'); }
    },

    'shorttag': {
		  'topic':	function(){ return transform('shorttag.xml'); }
		, 'result':	function(result){  assert.equal(result, '<meta/>'); }
    },

    'comment': {
		  'topic':	function(){ return transform('comment.xml'); }
		, 'result':	function(result){ assert.equal(result, '<!--comment-->'); }
    },

    'value': {
		  'topic':	function(){ return transform('value.xml', {"value":"value"}); }
		, 'result':	function(result){ assert.equal(result, '<b>value</b>'); }
    },

    'if': {
		  'topic':function(){ return transform('if.xml'); }
		, 'result':function(result){ assert.equal(result, 'true'); }
    },

    'choose':{
		  'topic':	function(){ return transform('choose.xml'); }
		, 'result':	function(result){ assert.equal(result, 'truechoose'); }
    },

    'foreach': {
		  'topic':	function(){ return transform('foreach.xml', {items: [1, 2], subitems: [[1, 2], [1, 2]]}); }
		, 'result':	function(result){
			assert.equal(result.substr(0, 2), '12');
			assert.equal(result.substr(2, result.length - 1), '01021112');
		}
    },

    'attrs': {
		  'topic':	function(){ return transform('attrs.xml', { href: "http://rubaxa.org/", title: "home page" }); }
		, 'result':	function(result){ assert.equal(result, '<a href="http://rubaxa.org/" title="home page" class="link">link.html</a>'); }
    },

    'script': {
		  'topic':	function(){ return transform('script.xml'); }
		, 'result':	function(result){ assert.equal(result.substr(0, 4), 'true'); assert.equal(result.substr(4), 'global'); }
    },

    'use strict': {
		  'topic':	function(){ return transform('strict.xml'); }
		, 'result':	function(result){ assert.equal(result, 'true'); }
    },

    'blocks': {
		  'topic':	function(){ return transform('blocks'+(xtpl.STREAM ? '-stream' : '')+'.xml', { items: [5,10] }); }
		, 'result':	function(result){
			if( xtpl.STREAM ){
				assert.equal(result, '1235def');
			} else {
				assert.equal(result, 'start|one|two2|three1|five|six|def|9|7|8|11|stop');
			}
		}
    },

    'include': {
		  'topic':	function(){ return transform('include.xml'); }
		, 'result':	function(result){ assert.equal(result, 'my.text'); }
    },

    'htmlsafe': {
		  'topic':	function(){ return transform('htmlsafe.xml', { html: '<script>' }); }
		, 'result':	function(result){ assert.equal(result, '&lt;script&gt;'); }
    },

	'custom-tags': {
		  'topic':	function(){
			  xtpl.tags({
				    'menu': function (node){ return node.__close ? '</ul>' : '<ul>'; }
				  , 'item': function (node, attrs){ return node.__close ? '</a></li>' : ['<li>'].concat(this._build('a', attrs)); }
			  });
			  return transform('custom-tags.xml', { html: '<script>' });
		  }
		, 'result':	function(result){
			assert.equal(result, '<ul><li><a href="#0">0</a></li><li><a href="#1">1</a></li></ul>');
		}
	},

	/**/
	'pull': {
		'topic': function (){
			return transform('pull.xml', {
				  sync:		function (fn){ fn(null, 1); }
				, fail:		function (fn){ fn('FAIL'); }
				, async:	function (fn){ setTimeout(fn.bind(this, null, 'async'), 500); }
			});
		},
		'result': function (result){
			assert.ok(/>1</.test(result));
			assert.ok(/>FAIL</.test(result));
			assert.ok(/>...</.test(result));
			assert.ok(/<script>/.test(result));
		}
	},

	/**/

	'complex': {
		'topic': function (){
			return	 transform('complex.xml', {
				header: "Colors",
				items: [
					{name: "red", current: true, url: "#Red"},
					{name: "green", current: false, url: "#Green"},
					{name: "blue", current: false, url: "#Blue"}
				]
			});
		},
		'result': function (result){
			assert.equal(result, '<h1>Colors</h1><ul><li><strong>red</strong></li><li><a href="#Green">green</a></li><li><a href="#Blue">blue</a></li></ul>');
		}
	},
/**/
	'end': {
		  'topic':	function(){ return true; }
		, 'result':	function(result){ assert.equal(result, true); }
	}
}).run();
