(function (){
	'use strict';

	function Compiler(parser){
		this._pre		= false;
		this._parser	= parser;
		this._tr		= function (input){ return input; };
	}

	Compiler.prototype = {
		constructor: Compiler,

		parse: function (input){
			if( this._pre ){
				input	= this._pre.rebuild(input);
			}
			return	this._parser.parse(input);	
		},

		compile: function (input){
			input	= this.parse(input);

//			console.log(input);
//			return;

			var node, res = [], __br = false;
			while( node = input.shift() ){
				this._tr(node, input, this);

				if( node.hasChildNodes() ){
					input	= node.childNodes.concat(input);
					continue;
				} else if( node.type === node.COMPILER_NODE ){
					node.type	= node.TEXT_NODE;
					if( node.__break ){
						if( !__br ){
							node.value	= "');" + node.value;
						}
						__br = true;
					}
					else {
						node.value	= (__br ? " __ondata(" : "',") + node.value+",'";
						__br = false;
					}
				} else {
					if( node.value ){
						if( node.type != node.CDATA_NODE ){
							node.value	= node.value.replace(/[\n\r]/g, ' ');
						} else {
							node.value	= node.value.replace(/[\n\r]/g, '\\n');
						}
						node.value = (__br ? " __ondata('" : '') + node.value.replace(/'/g, "\\'");
						__br = false;
					}
				}

				res.push(node);
			}

			res = "'use strict'; __ondata('"+this._parser.build(res)+"');";
//			console.log(res);
			return	new Function('ctx, __this, __ondata, __utils', res);
		},

		pre: function (pre){
			this._pre	= pre;
			return	this;
		},

		parser: function (parser){
			this._parser = parser;
			return	this;
		},

		transformer: function (fn){
			this._tr	= fn;
			return	this;
		},

		safe: function (expr){
			return	'(function (){try{return '+expr+'}catch(e){return""}})()';
		},

		escape: function (expr){
			return	'__utils.escape('+this.safe(expr)+')';
		},

		include: function (filename){
			return	this.parse(require('fs').readFileSync('./tpl/'+filename));
		}

	};

	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Compiler', Compiler);
	else
		module.exports = Compiler;
})();
