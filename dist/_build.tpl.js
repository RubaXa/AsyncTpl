/**
 * @preserve AsyncTpl — Asynchronous Templating engine for NodeJS/Browser
 *
 * Copyright (c) 2011, Lebedev Konstantin
 * Released under the MIT License.
 */

'use strict';

(function (window, undef){
	var __rmname = /^.+\//, __modules = {};

	function __build(name, Module){ __modules[name.replace(__rmname, '')] = Module; }
	function require(name){ return __modules[name.replace(__rmname, '')]; }

	__build('fs', {
		readFile: function (filename, encoding, fn){ jQuery.ajax({ url: filename, type: 'get', dataType: 'text', isLocal: true, success: function (txt){ fn(null, txt); } }); },
		readFileSync: function (filename){ return jQuery.ajax({ url: filename, type: 'get', async: false, dataType: 'text', isLocal: true }).responseText; },
		lstatSync: function(){ return  { mtime: 0 }; }
	});


	/*CODE*/
	

	// GLOBALIZE
	window['AsyncTpl'] = require('AsyncTpl');

	var
		  _tpl	= {}
		, utils	= require('utils')
	;

	AsyncTpl['fetch'] = function (tplId, targetId, data){
		if( typeof targetId != 'string' ){
			data = targetId;
			targetId = undef;
		}

		if( _tpl[tplId] === undef ){
			if( tplId.charAt(0) == '#' ){
				var node	= utils.$(tplId) || { innerHTML: '[['+tplId+' — not found]]' };
				_tpl[tplId]	= new this;
				_tpl[tplId].loadString(node.innerHTML);
			} else {
				_tpl[tplId]	= new this(tplId);
			}
		}


		var df = utils.defer(), s = '';

		_tpl[tplId]
			.set(data || {})
			.on('data', function (c){ s += c })
			.on('end', function (r){ df.resolve(r === undef ? s : r); })
			.fetch()
		;

		if( targetId ) df.done(function (html){
			var node = utils.$(targetId);
			if( node ) node.innerHTML = html;
		});

		return	df.promise();
	};


	if( typeof jQuery != 'undefined' ){
		/**
		 * @public
		 * @return	AsyncTpl
		 */
		jQuery['tpl'] = function (engine){
			AsyncTpl.engine(engine);
			jQuery['tpl'] = function (){ return this; };
			return	this;
		};
		jQuery['fn']['tpl'] = function (tplId, data){
			jQuery['tpl']('XML')['fetch'](tplId, this[0], data);
			return	this;
		};
	}
})(this);
