var
	  xtpl		= require('../lib/AsyncTpl').engine('XML')
	, vows		= require('../../vows/lib/vows.js')
	, events	= require('events')
	, assert	= require('assert')
;


xtpl.NS				= 'xtpl';
xtpl.ASYNC			= false;
xtpl.STREAM			= false;
xtpl.ROOT_DIR		= './xml/';
//xtpl.COMPILE_DIR	= './xml_c/';


function transform(file, json, promise){
	if( !promise ) promise = new events.EventEmitter;
    xtpl.fetch(file, json).then(function(result){ setTimeout(function(){ promise.emit('success', result); }, 0); });
	return	promise;
}


vows.describe('XML tests').addBatch({
/**/
    'doctype': {
		  'topic':	function(){ return transform('doctype.xml'); }
		, 'result':	function(result){ assert.equal(result, '<!DOCTYPE html>'); }
    },
/**/
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
		, 'result':	function(result){ assert.equal(result, 'value'); }
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
		  'topic':	function(){ return transform('blocks'+(xtpl.STREAM ? '-stream' : '')+'.xml'); }
		, 'result':	function(result){
			if( xtpl.STREAM ){
				assert.equal(result, '1235def');
			} else {
				result = result.split('|');
				assert.equal(result[1], 'one');
				assert.equal(result[2], 'two2');
				assert.equal(result[3], 'three1');
				assert.equal(result[4], 'five');
				assert.equal(result[5], 'six');
				assert.equal(result[6], 'def');
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

	'end': {
		  'topic':	function(){ return true; }
		, 'topic':	function(result){ assert.equal(result, true); }
	}
}).run();
