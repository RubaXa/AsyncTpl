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
	var Core = (window['AsyncTpl'] = window['AsyncTpl'] || {});
	Core.require = require;
	Core.fetch = function (name, ctx, fn){ fn(Core['__'+name](ctx)); };


	// jQuery support
	(function ($){
		if( $ ){
			$.tpl = function (name, ctx, key){
				key = '__'+name;
				return	(key in Core) ? Core[key](ctx) : '[AsyncTpl] '+name +' -- template not found';
			};

			$.fn.tpl = function (name, ctx){
				if( this.length && this[0].nodeType == 1 ){
					this[0].innerHTML = $.tpl(name, ctx);
				}
				return	this;
			};
		}
	})(window.jQuery);
})(this);
