/*!
 * AsyncTpl — Asynchronous Templating engine for NodeJS/Browser
 *
 * Copyright (c) 2011-2012, Lebedev Konstantin
 * Released under the MIT License.
 */

(function (window){
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
	var
		  Core		= (window['AsyncTpl'] = window['AsyncTpl'] || {})
		, utils		= require('utils')
		, Buffer	= require('Buffer')
	;

	window['__xtplFn'] = window['__xtplFn'] || {};

	Core.mods = function (mods){ utils.extend(utils.mods, mods); };
	Core.require = require;
	Core.fetch = function (name, ctx){ return __xtplFn[name](ctx || {}, new Buffer, utils); };
	Core.get = function (name){ return function (ctx){ return Core.fetch(name, ctx); }; };


	// jQuery support
	(function (fn){
		window.define && define.amd
			? define(['jquery'], fn)
			: fn(window.jQuery)
		;
	})(function ($){
		if( $ ){
			$.xtpl = function (name, ctx){
				return Core.fetch(name, ctx);
			};

			$.fn.xtpl = function (name, ctx){
				if( this.length && this[0].nodeType == 1 ){
					this[0].innerHTML = $.xtpl(name, ctx);
				}
				return	this;
			};
		}
	});

	window.ajs && ajs.loaded('{AsyncTpl}AsyncTpl.core.min');
})(this);
