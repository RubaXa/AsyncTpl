var
	  xtpl		= require('../lib/AsyncTpl').engine(require('../lib/Smarty'))
	, vows		= require('../../vows/lib/vows.js')
	, events	= require('events')
	, assert	= require('assert')
;

xtpl.ASYNC		= false;
xtpl.STREAM		= false;
xtpl.ROOT_DIR	= './smarty/';


function transform(file, json, promise){
	if( !promise ) promise = new events.EventEmitter;
    xtpl.fetch(file, json || {}).then(function(result){ setTimeout(function(){ promise.emit('success', result.replace(/(<\/?div>|\s)/g, '')); }, 0); });
	return	promise;
}


vows.describe('Smarty tests').addBatch({
	'value': {
		'topic':	function(){ return transform('value.html', { username: 'RubaXa' }); }
	  , 'result':	function(result){ assert.equal(result, 'RubaXa'); }
	},
/**/
    'comment': {
		  'topic':	function(){ return transform('comment.html'); }
		, 'result':	function(result){ assert.equal(result, '---'); }
    },

    'if': {
		  'topic':function(){ return transform('if.html'); }
		, 'result':function(result){ assert.equal(result, '146'); }
    },

    'foreach': {
		  'topic':	function(){ return transform('foreach.html', { items: [1, 2], subitems: [[1, 2], [1, 2]]}); }
		, 'result':	function(result){
			assert.equal(result.substr(0, 2), '12');
			assert.equal(result.substr(2, result.length - 1), '01021112OK');
		}
    },

    'script': {
		  'topic':	function(){ return transform('script.html'); }
		, 'result':	function(result){ assert.equal(result, 'true'); }
    },

    'extends': {
		  'topic':	function(){ return transform('child.html'); }
		, 'result':	function(result){ assert.equal(result, '1|second|three'); }
    },

	'modifiers': {
		  'topic':	function (){
			  return transform('modifiers.html', {
				    'upper': 'uPpER'
				  , 'lower': 'LoWER'
				  , 'capitalize': 'capitAlize'
				  , 'nl2br': 'a\nb'
				  , 'regex_replace': 'a b'
				  , 'combining': 'cOmBiNI\nng'
			  });
		  }
		, 'result':	function(result){
			assert.equal(result, 'UPPER|lower|Capitalize|a<br/>b|a_b|Combini<br/>ng|');
		}
	},

/**/
	'end': {
		  'topic':	function(){ return true; }
		, 'topic':	function(result){ assert.equal(result, true); }
	}
}).run();