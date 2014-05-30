$(window).load(function()
{
	$('body').easybg({
		images: [
			'http://sawara.me/img/th_P9262350.jpg',
			'http://sawara.me/img/th_P3171220.jpg', 
			'http://sawara.me/img/th_P4062921.jpg', 
			'http://sawara.me/img/th_P4141497.jpg', 
			'http://sawara.me/img/th_P4272951.jpg', 
			'http://sawara.me/img/th_P5091865.jpg', 
			'http://sawara.me/img/th_P5121881.jpg', 
			'http://sawara.me/img/th_P5253029.jpg', 
			'http://sawara.me/img/th_P5253043.jpg', 
			'http://sawara.me/img/th_P8111986.jpg', 
			'http://sawara.me/img/th_P8312333.jpg'
		],
		interval: 15000,
		initIndex : 0,
		ignoreError : true,
		debug : false
	});
	
	$("#easybgModal").modal({show : false});
});