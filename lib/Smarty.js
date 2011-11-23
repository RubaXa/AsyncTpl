(function (utils, undef){
	'use strict';

	var
		  _rr		= /\r/g
		, _rn		= /\n/g
		, _rre		= /^\/(.+)\/(\w*)$/
		, tags		= 'foreach include extends block doctype'
		, Smarty	= {}
	;

	Smarty.fn = {
		_defaults: function (opts){
			opts			= utils.extend({ left: '{{', right: '}}' }, opts, { tags: tags });
			opts.c_open		= opts.left + '*';
			opts.c_close	= '*' + opts.right;
			return this._super._defaults.call(this, opts);
		},

		_trans: function (node, input){
			var res = [], val, attrs = node.attributes;

			if( node.type == node.ELEMENT_NODE || node.type == node.CUSTOM_NODE ) switch( node.name ){
				case 'if':
				case 'else':
				case 'elseif': val = attrs; break;

				case 'script':
				case 'cycle': break;

				case 'foreach':
						node.__break = true;
						if( !this.__foreach ){
							this.__foreach = [];
							this.__foreachelse = [];
						}
						if( node.__open ){
							this.__foreach.push(attrs.from.value);
						} else if( this.__foreachelse.length ){
							this.__foreachelse = [];
							node.value	= '}';
							return node;
						}
					break;

				case 'foreachelse':
						var name = this.__foreach.pop();
						this.__foreachelse.push(name);
						val = '}); if(!__utils.sizeof('+this.safe(name)+')){';
					break;

				case 'block':
						var name = attrs.name && attrs.name.value;
						if( !this.__blocks ){
							this.__blocks = {};
							this.___blocks = [];
						}

						if( name ){
							this.___blocks.push(name);
							this.__blocks[name] = 1 + this.__blocks[name]||0;
						} else {
							name = this.___blocks.shift();
						}

						node.name = this.__blocks[name] > 0 ? 'set': 'get';
					break;

				case 'extends':
				case 'include':
						node.name = 'include';
						val = attrs.file.value;
					break;

				default:
						if( this.fns[node.name] ){
							var xattr = [];
							utils.each(attrs, function (a, k, v){
								v = a.value;
								if( /$\$/.test(v) ) v = this.safe(v); else v = '"'+v+'"';
								xattr.push(k +':'+ v);
							});
							node.value = '__this.fns.'+node.name+'({'+xattr.join(',')+'},ctx)';
							node.name = 'value';
							return	node;
						} else {
							val	= this.escape(node.name + attrs);
							node.name = 'value';
						}
					break;
			}

			if( val !== undef ){
				node.value = val;
			}

			return	res.length  ? res : this._super._trans.call(this, node, input);
		},

		escape: function (expr){
			var mods = expr.split('|');
			expr = this._super.escape.call(this, this.safe(mods[0]));
			utils.each(mods.splice(1), function (mod){
				mod = mod.split(':');
				expr = '__this.mods.'+ mod[0] +'('+ expr + (mod.length>1 ? ','+mod.splice(1).join(',') : '') +')';
			});
			return	expr;
		},

		safe: function (expr){
			return this._super.safe.call(this, expr.replace(/\$([a-z][a-z0-9_]*)/ig, function (a, b){
				return '(typeof '+b+'==="undefined"?ctx.'+b+':'+b+')';
			}));
		}

	};


	Smarty.statics = {
		fn: function (funcs){
			utils.each(funcs, function (fn, name){
				tags += ' '+name;
				this.fns[name] = fn;
			}, this);
			return	this;
		},

		modifiers: function (mods){
			utils.each(mods, function (mod, name){
				this.mods[name] = function (){
					return	mod.apply(this, arguments);
				};
			}, this);
			return	this;
		}
	};

	
	Smarty.fn.fns = Smarty.statics.fns = {};
	Smarty.fn.mods = Smarty.statics.mods = {};


	Smarty.statics
		.fn({
			assign: function (attrs, ctx){
				ctx[attrs['var']] = attrs['value'];
				return '';
			}
		})
		.modifiers({
			  'upper': function (str){ return str.toUpperCase(); }
			, 'lower': function (str){ return str.toLowerCase(); }
			, 'capitalize': function (str){ return str.charAt(0).toUpperCase()+str.substr(1).toLowerCase(); }
			, 'nl2br': function (str){ return str.replace(_rr, '').replace(_rn, '<br/>'); }
			, 'regex_replace': function (str, search, replace){
				search = search.match(_rre);
				return str.replace(new RegExp(search[1], search[2]), replace);
			}
		})
	;


	// @export
	if( typeof __build !== 'undefined' )
		__build('./Smarty', Smarty);
	else
		module.exports = Smarty;
})(require('./utils'));
