/*global require */

var
	  xtpl		= require('../lib/AsyncTpl').engine('XML')
	, vows		= require('vows')
	, events	= require('events')
	, assert	= require('assert')
;


xtpl.ASYNC			= false;
xtpl.STREAM			= false;
xtpl.ROOT_DIR		= './tests/xml/';
//xtpl.COMPILE_DIR	= './tests/xml_c/';


function transform(file, ctx, promise){
	if( !promise ) promise = new events.EventEmitter;
    xtpl.fetch(file, ctx, function(result){ setTimeout(function(){ promise.emit('success', result); }, 0); });
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

	'error': {
		  'topic':  function(){ return transform('error.xml'); }
		, 'result': function(result){ assert.equal(result, 'Error: Tag "foreach", attribute "iterate" is missing in ./tests/xml/error.xml on line 4'); }
	},

	'closure': {
		  'topic':  function(){ return transform('closure.xml', { foo: 'bar', items: [1,2,3] }); }
		, 'result': function(result){ assert.equal(result, 'bar|1,2,3'); }
	},

	'assign': {
		  'topic':  function(){ return transform('assign.xml', { }); }
		, 'result': function(result){ assert.equal(result, 'http://rubaxa.org/'); }
	},

	'tag-attrs': {
		'topic':  function(){ return transform('tag-attrs.xml'); }
		, 'result': function(result){
			assert.equal(result,
				'<div>|<b>1</b>||<b>3</b>|4<b>5</b>6' +
				'<p>index</p><p><a href="/">index</a></p>' +
				'<p>|def1</p>' +
				'<p>|def2</p>' +
				'|def3' +
				'<p>|def4</p>' +
				'<div>|cont1</div>' +
				'<p>|cont2</p>' +
				'|cont2' +
				'</div>'
			);
		}
	},

    'attrs': {
		  'topic':	function(){ return transform('attrs.xml', { protocol: "http:", domain: 'rubaxa.org', search: '?test', title: "home page" }); }
		, 'result':	function(result){ assert.equal(result, '<a href="http://rubaxa.org/path?test" title="home page" class="link">link.html</a>'); }
    },

	'attribute': {
		  'topic':  function(){ return transform('attribute.xml'); }
		, 'result': function(result){
			assert.equal(result, '<input/><div>foobar</div><div class="foo bar"></div><div class="foo"></div><div when="true" otherwise="true"></div><div>foo</div>');
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
		  'topic':	function(){ return transform('foreach.xml', {items: [6, -1], subitems: [[1, 2], [3, 4]]}); }
		, 'result':	function(result){ assert.equal(result, '123:6-1:[0-1-2][1-3-4]'); }
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
				assert.equal(result, 'start|one|two2|three1|five|six|def|9|7|8|15|0|stop');
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

	'non-part': {
		  'topic':	function(){ return transform('part.xml'); }
		, 'result':	function(result){ assert.equal(result, '[first-second]-[first-second-three]'); }
	},

	'part-first': {
		  'topic':	function(){ return transform('part.xml', { __part: 'first-part' }); }
		, 'result':	function(result){ assert.equal(result, 'first-second'); }
	},

	'part-second': {
		  'topic':	function(){ return transform('part.xml', { __part: 'second-part' }); }
		, 'result':	function(result){ assert.equal(result, 'first-second-three'); }
	},
/**/

	'end': {
		  'topic':	function(){ return true; }
		, 'result':	function(result){ assert.equal(result, true); }
	}
}).run();
