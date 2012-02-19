/*global require, __build*/

(function (utils, undef){
	'use strict';

	var XML = {};
	
	XML.fn = {
		_defaults: function (opts){
			return	this._super._defaults.call(this, utils.extend(opts || {}, { firstLine: false }));
		},

		_build: function (node, attrs){
			var res = [];

			if( typeof node == 'string' ){
				node = { name: 'a' };
			}

			if( !node.__empty && node.__close ){
				res.push('</'+ node.name +'>');
			} else {
				res.push('<'+node.name);
				var _rns = new RegExp(this._opts.ns+':');

				utils.each(attrs, function (attr){
					if( _rns.test(attr.value) ){
						res.push(
							  ' '+attr.name+'="'
							, { name: 'value', value: attr.value.replace(_rns, ''), __escape: true }
							, '"'
						);
					} else {
						res.push(' '+attr.name+'="'+attr.value+'"');
					}
				}, this);

				if( !node.__openTag ){
					res.push(node.__empty ? '/>' : '>');
				}
			}

			return	res;
		},


		_trans: function(node, input, stack){
			var res = [], val, attrs = node.attributes;

			if( node.ns != this._opts.ns ){
				if( node.type == node.ELEMENT_NODE ){
					res = this._build(node, attrs);
				}
			} else {
				switch( node.name ){
					case 'if': val = node.__close ? '' : node.attr('test'); break;
					case 'choose': this.__choose = node.__open ? 1 : 0; break;
					case 'when':
							val = node.__close ? '}' : (this.__choose == 1 ? '' : ' else ') + 'if('+ this.safe(node.attr('test'), node) +'){';
							this.__choose++;
						break;

					case 'otherwise': val = node.__close ? '}' : ' else {'; break;

					case 'foreach':
							attrs = { _from: 'iterate', from: attrs.iterate || attrs.from, key: attrs.index, item: attrs.as, 'to': attrs['to'] };
						break;

					case 'value':
							val = this.escape(input.shift().value, node);
							input.shift();
						break;

					case 'include': val = node.attr('src'); break;

					case 'comment':
							node.type = node.TEXT_NODE;
							if( node.__empty ){
								val	= '';
							} else {
								val	= '<!--'+ input.shift().value + '-->';
								input.shift();
							}
						break;

					case 'template': return null; break;
				}
			}


			if( val !== undef ){
				if( utils.isArray(val) ) res = val;
				else node.value = val;
			}

			node.attributes = attrs;

			return	res.length  ? res : this._super._trans.call(this, node, input, stack);
		}
	};


	// @export
	if( typeof __build !== 'undefined' )
		__build('./XML', XML);
	else
		module.exports = XML;
})(require('./utils'));
