'use strict';
__ondata('<span id="13219080607031000">');
__this.pullSync(ctx, "sync", function(err, sync) {
	if (!err) {
		__ondata(__utils.escape((function() {
			try {
				return sync
			} catch(e) {
				return""
			}
		})()));
	}
	__ondata('</span>');
	__ondata('<span id="1321908060703611">');
	__this.pullSync(ctx, "fail", function(error, fail) {
		if (error) {
			__ondata(__utils.escape((function() {
				try {
					return error
				} catch(e) {
					return""
				}
			})()));
		}
		__ondata('</span>');
		__ondata('<span id="1321908060703696">');
		__this.pull(ctx, "async");
		__ondata('...');
		__this.pull(ctx, "async", function(err, async) {
			if (!err) {
				__ondata(__utils.escape((function() {
					try {
						return async
					} catch(e) {
						return""
					}
				})()));
			}
			__ondata('</span>');
		});
		__ondata('<script>(function(a, b){try{b.insertBefore(a);a.parentNode.removeChild(a);}catch(er){}})(document.getElementById("1321908060703696"), document.getElementById("success1321908060703696"));</script>');
		__ondata('</span>');
		__ondata('end');
	});
});
