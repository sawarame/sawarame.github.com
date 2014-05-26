/*
 * easybg ver 1.0.
 *
 * written by sawarame 鰆目 靖士
 * http://sawara.me/
 *
 */
(function($)
{
	var methods = {
		/*
		 * 初期化処理
		 */
		init : function(options)
		{
			return this.each(function()
			{
				var $this = $(this);
				var data = $this.data('easybg');
				if(!data)
				{
					$this.settings = $.extend(defaults, options);
					// 画像名が設定されていなければ何もしない
					if($this.settings.images === null)
					{
						return true;
					}
					// 配列でなければ配列にする
					if(!($this.settings.images instanceof Array))
					{
						$this.settings.images = [$this.settings.images];
					}
					
					// 画像を先読みする
					for(var i = 0; i < $this.settings.images.length; i++)
					{
						$("<img>").attr("src", $this.settings.images[i]);
					}
					
					// 初期画像を表示
					methods.setImageUrl.apply($this, [$this.settings.images[0]]);
					
					var timer = null;
					timer = setInterval(function()
					{
						var index = Math.floor(Math.random() * $this.settings.images.length);
						methods.changeImage.apply($this, [index]);
					}, $this.settings.interval);
				}
			});
		},
		/*
		 * 破棄処理
		 */
		destory : function()
		{
			return this.each(function()
			{
				var $this = $(this);
				var data = $this.data('easybg');
				$(window).unbind('.easybg');
				data.easybg.remove();
				$this.removeData('easybg');
			});
		},
		/*
		 * 背景画像を変更する処理
		 */
		changeImage : function(index)
		{	
			var child1 = methods.makeClone.apply(this);
			methods.setImage.apply(child1, [methods.getImage.apply(this)]);
			methods.setZIndex.apply(child1, [methods.getZIndex.apply(this) - 1]);
			this.prepend(child1);
			
			var child2 = methods.makeClone.apply(this);
			methods.setImageUrl.apply(child2, [this.settings.images[index]]);
			methods.setZIndex.apply(child2, [methods.getZIndex.apply(child1) - 1]);
			this.prepend(child2);
			
			// 一旦要素の画像の設定を解除
			methods.setImageUrl.apply(this, ['']);
			
			var self = this;
			var timer = null;
			var opacity = 1;
			timer = setInterval(function()
			{
				opacity -= 0.01;
				if(opacity <= 0)
				{
					// 変更が完了したら要素の画像設定を変更し、クローンを削除
					methods.setImageUrl.apply(self, [self.settings.images[index]]);
					child1.empty().remove();
					child2.empty().remove();
					
					clearInterval(timer);
					timer = null;
				}
				else
				{
					methods.setOpacity.apply(child1, [opacity]);
				}
			}, self.settings.speed / 100);
		},
		/*
		 * 要素のクローンを作成し要素に被せる
		 */
		makeClone : function()
		{
			// 要素のクローンを作成
			//var child = this.clone(false).empty();
			var child = $('<div />');
			child.attr('class', this.attr('class'));
			
			// IDは別で設定（デフォルトNULL）
			child.attr('id', this.settings.cloneClassId);
			
			// クローンにclassを設定
			child.addClass(this.settings.cloneClassName);
			
			// 元要素のpositionをrelativeにする
			this.css('position', 'relative');
			
			// クローンを元要素に被せる
			child.css({
				position : 'absolute',
				top : '0',
				left : '0',
				width : this.outerWidth(),
				height : this.outerHeight()
			});
			return child;
		},
		/*
		 * 背景画像を設定
		 */
		setImage : function(image)
		{
			this.css('background-image', image );
		},
		/*
		 * 背景画像を設定
		 */
		setImageUrl : function(image)
		{
			this.css('background-image', 'url(' + image + ')');
		},
		/*
		 * 背景画像を設定
		 */
		getImage : function()
		{
			return this.css('background-image');
		},
		/*
		 * z-indexを指定
		 */
		setZIndex : function(index)
		{
			this.css('z-index', index);
		},
		/*
		 * z-indexを取得
		 */
		getZIndex : function(index)
		{
			return parseInt(this.css('zIndex'), 10) || 0;
		},
		/*
		 * z-indexを取得
		 */
		setOpacity : function(opacity)
		{
			this.css('opacity', opacity);
		}
	};
	
	var defaults = {
		images : null,
		interval : 30000, // 30秒
		speed : 1000, // 1秒
		cloneClassId : null,
		cloneClassName : 'easybgClone'
	}
	
	$.fn.easybg = function(method)
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
			alert('Method ' +  method + ' does not exist on jQuery.tooltip');
		}
	}
	
})( jQuery );