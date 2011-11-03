this.chunk(function() {
	this.push('<div> 	 	');
	if (__ctx.get("checknew").get("userdomain").mod("toLowerCase") == "corp.mail.ru") {
		this.push(' 		<h2>', __ctx.get("checknew"), '</h2> 	');
	}
	this.push('  	');
	__ctx.each(__ctx.get("checknew"), "M", "idx", function(__ctx) {
		this.push(' 		', __ctx.get("idx") + 1, '. ', __ctx.get("M"), '|', __ctx.get("M"), '|', __ctx.get("M"), '|', __ctx.get("M"), ' 	');
	}, this);
	this.push('  </div> ');
});
