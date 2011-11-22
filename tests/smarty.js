var
	  xtpl		= require('../lib/AsyncTpl').extend(require('../lib/Smarty'))
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
			assert.equal(result.substr(2, result.length - 1), '01021112');
		}
    },

    'script': {
		  'topic':	function(){ return transform('script.html'); }
		, 'result':	function(result){ assert.equal(result, 'true'); }
    },

	/*
    'blocks': {
		  'topic':	function(){ return transform('blocks.html'); }
		, 'result':	function(result){
			result = result.split('|');
			assert.equal(result[1], 'one');
			assert.equal(result[2], 'two2');
			assert.equal(result[3], 'three1');
			assert.equal(result[4], 'five');
			assert.equal(result[5], 'six');
		}
    },

/**/
	'end': {
		  'topic':	function(){ return true; }
		, 'topic':	function(result){ assert.equal(result, true); }
	}
}).run();
