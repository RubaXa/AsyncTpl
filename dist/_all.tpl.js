/*!
 * AsyncTpl — Asynchronous Templating engine for NodeJS/Browser
 *
 * Copyright (c) 2011-2012, Lebedev Konstantin
 * Released under the MIT License.
 */

(function (window, undef){
	'use strict';

	var __rmname = /^.+\//, __modules = {};

	function __export(name, Module){
		__modules[name.replace(__rmname, '')] = Module;
	}


	function require(name){
		return __modules[name.replace(__rmname, '')];
	}


	__export('fs', {
		readFile: function (filename, encoding, fn){ jQuery.ajax({ url: filename, type: 'get', dataType: 'text', isLocal: true, success: function (txt){ fn(null, txt); } }); },
		readFileSync: function (filename){ return jQuery.ajax({ url: filename, type: 'get', async: false, dataType: 'text', isLocal: true }).responseText; },
		lstatSync: function(){ return  { mtime: 0 }; }
	});


	/*CODE*/


	// GLOBALIZE
	var api = require('AsyncTpl');
	api.get = require;
	window.AsyncTpl = api;

	var
		  _tpl	= {}
		, utils	= require('utils')
	;

	AsyncTpl.fetch = function (tplId, targetId, ctx, fn){
		if( typeof targetId != 'string' ){
			fn = ctx;
			ctx = targetId;
			targetId = undef;
		}

		if( _tpl[tplId] === undef ){
			if( tplId.charAt(0) == '#' ){
				var node	= utils.$(tplId) || { innerHTML: '[[#'+tplId+' — not found]]' };
				_tpl[tplId]	= new this;
				_tpl[tplId].loadString(node.innerHTML);
			} else {
				_tpl[tplId]	= new this(tplId);
			}
		}


		var df = utils.defer(), s = '';

		_tpl[tplId].fetch(ctx, function (r){
			df.resolve(r === undef ? s : r);
		});

		if( targetId ) df.done(function (html){
			var node = utils.$(targetId);
			if( node ) node.innerHTML = html;
		});

		return	df.promise().done(fn);
	};


	if( typeof jQuery != 'undefined' ){
		/**
		 * @public
		 * @return	AsyncTpl
		 */
		jQuery.xtpl = function (engine){
			AsyncTpl.engine(engine);
			jQuery.xtpl = function (){ return this; };
			return	this;
		};
		jQuery.fn.xtpl = function (tplId, data){
			jQuery.xtpl('XML').fetch(tplId, this[0], data);
			return	this;
		};
	}
})(this);
