(function (utils, undef){
	'use strict';

	var XML = {};
	
	XML.fn = {
		_defaults: function (opts){
			return	this._super._defaults.call(this, utils.extend({ ns: this.self.NS }, opts || {}, { firstLine: false }));
		},


		_trans: function(node, input){
			var res = [], val, attrs = node.attributes;

			if( node.ns != this._opts.ns ){
				if( node.type == node.ELEMENT_NODE ){
					if( !node.__empty && node.__close ){
						res.push('</'+ node.name +'>');
					} else {
						res.push('<'+node.name);
						var _rns = new RegExp(this._opts.ns+':', 'i');
						utils.each(attrs, function (attr){
							if( _rns.test(attr.value) ){
								res.push(
									  ' '+attr.name+'="'
									, { name: 'value', value: this.escape(attr.value.replace(_rns, '')) }
									, '"'
								);
							} else {
								res.push(' '+attr.name+'="'+attr.value+'"');
							}
						}, this);
						res.push(node.__empty ? '/>' : '>');
					}
				}
			} else {
				switch( node.name ){
					case 'if': val = attrs.test && attrs.test.value; break;
					case 'choose': this.__choose = node.__open ? 1 : 0; break;
					case 'when':
							val = node.__close ? '}' : (this.__choose == 1 ? '' : ' else ') + 'if('+ this.safe(attrs.test.value) +'){';
							this.__choose++;
						break;

					case 'otherwise': val = node.__close ? '}' : ' else {'; break;

					case 'foreach': attrs = { from: attrs.iterate, key: attrs.index, item: attrs.as }; break;

					case 'value':
							val = this.escape(input.shift().value);
							input.shift();
						break;

					case 'include': val = attrs.src.value; break;

					case 'comment':
							node.type = node.TEXT_NODE;
							if( node.__empty ){
								val	= '';
							} else {
								val	= '<!--'+ input.shift().value + '-->';
								input.shift();
							}
						break;

					case 'text':
							node.type	= node.TEXT_NODE;
							val	= input.shift().value;
							input.shift();
						break;

					case 'template': return null; break; 
				}
			}

			if( val !== undef ){
				node.value	= val;
			}
			node.attributes = attrs;

			return	res.length  ? res : this._super._trans.call(this, node, input);
		}
	};


	// @export
	if( typeof __build !== 'undefined' )
		__build('./XML', XML);
	else
		module.exports = XML;
})(require('./utils'));
