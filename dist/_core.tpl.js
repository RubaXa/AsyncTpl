/*!
 * AsyncTpl — Asynchronous Templating engine for NodeJS/Browser
 *
 * Copyright (c) 2011-2012, Lebedev Konstantin
 * Released under the MIT License.
 */

'use strict';

(function (window, undef){
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


	var utils = require('utils'), Buffer = require('Buffer');

	// GLOBALIZE
	window.AsyncTpl = window.AsyncTpl || {};
	AsyncTpl.fetch	= function (filename, ctx, fn){
		AsyncTpl.tpls[filename](ctx, new Buffer(fn, false), utils);
	};
})(this);
