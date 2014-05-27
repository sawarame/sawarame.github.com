$(window).load(function()
{
	$('#container').easybg({
		images: [
			'/img/th_P4062921.jpg', 
			'/img/th_P4272951.jpg', 
			'/img/th_P5253029.jpg', 
			'/img/th_P5253043.jpg'
		],
		interval: 10000,
		initIndex : 0,
		ignoreError : true,
		debug : true
	});
});