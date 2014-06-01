/**
 * easyscrl ver 1.0.0
 * IDへのリンクをぬるっとscrollさせる
 *
 * written by sawarame 鰆目 靖士
 * http://sawara.me/
 *
 */
(function($)
{	
	var methods = {
		/**
		 * 初期化処理
		 */
		init : function(options)
		{
			return this.each(function()
			{
				var $this = $(this);
				var data = $this.data('easyscrl');
				if(!data)
				{
					$this.settings = $.extend(defaults, options);
					
					$this.click(function()
					{
						self = $(this);
						methods.log.apply($this, [self.attr('href')]);
						var target = $(self.attr('href'));
						if(target.size() > 0)
						{
							var top = target.offset().top;
							methods.log.apply($this, [top]);
							// してした位置へスクロール
							$('html,body').animate(
								{scrollTop: (top - $this.settings.marginTop) },
								$this.settings.speed,
								$this.settings.easing
							);
						}
						return false;
					});
				}
			});
		},
		/**
		 * 破棄処理
		 */
		destory : function()
		{
			return this.each(function()
			{
				var $this = $(this);
				var data = $this.data('easyscrl');
				$(window).unbind('.easyscrl');
				data.easyscrl.remove();
				$this.removeData('easyscrl');
			});
		},
		/**
		 * コンソールにログ出力
		 */
		log : function(str)
		{
			if(this.settings.debug)
			{
				console.log(str);
			}
		},
		/**
		 * コンソールにエラー出力
		 */
		error : function(str)
		{
			if(this.settings.debug)
			{
				console.error(str);
			}
		}
	};
	
	// 初期値
	var defaults = {
		speed : 1000, // 1秒
		easing : 'swing',
		marginTop : 0,
		debug : false
	}
	
	$.fn.easyscrl = function(method)
	{
		if(methods[method])
		{
			return methods[ method ].apply(this, Array.prototype.slice.call( arguments, 1 ));
		}
		else if (typeof method === 'object' || !method )
		{
			return methods.init.apply( this, arguments );
		}
		else
		{
			alert('Method ' +  method + ' does not exist on jquery.easyscrl');
		}
	}
	
})(jQuery);