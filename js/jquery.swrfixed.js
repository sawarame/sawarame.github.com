/*
 * jquery.swrfixed v0.0.3
 *
 * written by sawarame 鰆目 靖士
 * http://sawara.me/
 *
 */
(function($)
{
    /**
     * インナークラスを定義
     *
     * インスタンス作成時に要素のイベントを設定する
     */
    var ClassSwrFixed = function(elements, settings)
    {
        var self = this;
        self.elements = elements;
        self.settings = settings;

        self.body = $('body');

        self.timer = false;

        self.elements.each(function()
        {
            // 各要素を取得
            var curElement = $(this);
            // デフォルトの値を取得しておく
            curElement.defaultOffsetTop     = curElement.offset().top;
            curElement.defaultOffsetBottom  = curElement.defaultOffsetTop + curElement.height();
            curElement.defaultTop           = curElement.css("top");
            curElement.defaultBottom        = curElement.css("bottom");
            curElement.defaultLeft          = curElement.css("left");
            curElement.defaultPosition      = curElement.css("position");
            curElement.defaultWidth         = curElement.css("width");
            curElement.defaultZIndex        = curElement.css("z-index");

            curElement.defaultDisplay       = curElement.css("display");
            curElement.defaultFloat         = curElement.css("float");

            $(window).scroll(function(evt)
            {
                self.scrollprocess(curElement, $(this));
            });

            $(window).resize(function()
            {
                if(false !== self.timer)
                {
                    clearTimeout(self.timer);
                }
                self.timer = setTimeout(function()
                {
                    self.resizeprocess(curElement, $(this));
                }, 200);
            });
        });
        
        return self.elements;
    }

    ClassSwrFixed.prototype.scrollprocess = function(element, window)
    {
        var self = this;

        // 現在の要素の幅高さを取得する
        var eleTop    = element.offset().top;
        var eleLeft   = element.offset().left;
        var eleWidth  = element.width();
        var eleHeight = element.height();
                
        // 要素の現在の下の位置を取得
        var eleBottom = eleTop + eleHeight;

        // 要素のmarginを数値型で取得
        var eleMarginTop    = parseInt(element.css("margin-top"), 10);
        var eleMarginBottom = parseInt(element.css("margin-bottom"), 10);
        var eleMarginLeft   = parseInt(element.css("margin-left"), 10);
        var eleMarginRight  = parseInt(element.css("margin-right"), 10);

        // 親要素の位置と高さの取得
        var pare       = element.parent();
        var pareTop    = pare.offset().top;
        var pareLeft   = pare.offset().left;
        var pareWidth  = pare.width();
        var pareHeight = pare.height();

        // 親要素の下の位置を取得
        var pareBottom = pareTop + pareHeight;

        // ウィンドウのスクロール位置取得とウィンドウ下部を取得
        var winTop = window.scrollTop();
        var winHeight = window.height();
        var winBottom = winTop + winHeight;

        // スクロールの下限はbodyの高さよりも大きい値は取得しない
        if(winBottom > self.body.height())
        {
            winBottom = self.body.height();
        }

        // 設定する要素の初期値
        var newTop = element.css("top");
        var newBottom = element.css("bottom");
        var newLeft = element.css("left");
        var newPosition = element.css("position");
        var newWidth = element.width();
        var newZIndex = element.css("z-index");
        
        // デフォルトの要素の上部がwindowの一番上によりも上に有ればtrue
        var defaultTopFlg =  (element.defaultOffsetTop - eleMarginTop - self.settings.top) < winTop;
        // デフォルトの要素の下部がwindowの一番下によりも上に有ればtrue
        var defaultBottomFlg = (element.defaultOffsetBottom - eleMarginTop - self.settings.bottom) < winBottom;
        // 表示スクロール位置が設定されていて、表示スクロール位置に達していればtrue
        // (表示スクロール位置が設定されていなければ常にtrue)
        var scrollFlg = (0 == self.settings.scroll) 
                        || ((0 < self.settings.scroll) && (self.settings.scroll < winTop));
        
        // 要素の位置がスクロール位置より小さくなった(上になった)とき
        if(defaultTopFlg && defaultBottomFlg && scrollFlg)
        {
            // 固定表示開始時
            if("static" == element.css("position"))
            {
                if(false === self.settings.onFixed(element, winTop, self.settings))
                {
                    return false;
                }
            }

            // 要素の高さを持った空ボックス要素を作成
            if(0 == element.next('.swrfixedSpaceBox').length)
            {
                element.after('<div class="swrfixedSpaceBox"> </div>');
                element.next('.swrfixedSpaceBox').css("display", element.defaultDisplay);
                element.next('.swrfixedSpaceBox').css("float", element.defaultFloat);
                element.next('.swrfixedSpaceBox').css("width", eleWidth + eleMarginLeft + eleMarginRight + "px");
                element.next('.swrfixedSpaceBox').css("height", eleHeight + eleMarginTop + eleMarginBottom + "px");
            }
            
            // 要素の高さがウィンドウの高さより大きいとき
            if(eleHeight > winHeight)
            {
                // 親要素を超えてスクロールした場合
                if(winBottom >= pareBottom + self.settings.bottom || winTop > pareBottom)
                {
                    pare.css('position', 'relative');
                    newTop = "";
                    newBottom = "0";
                    newLeft = eleLeft - pareLeft - eleMarginLeft;
                    newPosition = "absolute";
                    newWidth =  eleWidth + "px";
                    newZIndex = "auto";
                }
                else
                {
                    newTop = "";
                    newBottom = self.settings.bottom;
                    newLeft = eleLeft - eleMarginLeft;
                    newPosition = "fixed";
                    newWidth =  eleWidth + "px";
                    newZIndex = self.settings.zIndex;
                }
            }
            // 要素の高さがウィンドウの高さより小さいとき
            else
            {
                // 親要素を超えてスクロールした場合
                if(
                    (
                        (eleBottom + eleMarginTop >= pareBottom)
                        && winTop > (pareBottom - eleHeight - eleMarginTop - self.settings.top)
                    ) || winTop > pareBottom)
                {
                    pare.css('position', 'relative');
                    newTop = "";
                    newBottom = "0";
                    newLeft = eleLeft - pareLeft - eleMarginLeft;
                    newPosition = "absolute";
                    newWidth =  eleWidth + "px";
                    newZIndex = "auto";
                }
                else
                {
                    newTop = self.settings.top;
                    newBottom = "";
                    newLeft = eleLeft - eleMarginLeft;
                    newPosition = "fixed";
                    newWidth =  eleWidth + "px";
                    newZIndex = self.settings.zIndex;
                }
            }
        }
        // 要素の位置がスクロール位置より大きくなった(下になった)とき
        else
        {
            // 固定表示解除時
            if("static" != element.css("position"))
            {
                if(false === self.settings.onStatic(element, winTop, self.settings))
                {
                    return false;
                }
            }
            
            if(0 < element.next('.swrfixedSpaceBox').size())
            {
                element.next('.swrfixedSpaceBox').remove();
            }
            newTop = element.defaultTop;
            newBottom = element.defaultBottom;
            newLeft = element.defaultLeft;
            newPosition = "static";
            newWidth = element.defaultWidth;
            newZIndex = element.defaultZIndex;
        }
        // 要素に反映
        element.css("position", newPosition)
               .css("top", newTop)
               .css("bottom", newBottom)
               .css("left", newLeft)
               .css("width", newWidth)
               .css("z-index", newZIndex);
               
    }

    ClassSwrFixed.prototype.resizeprocess = function(element, window)
    {
        var self = this;
        self.settings.onResize(element, window.scrollTop(), self.settings)
    }

    $.fn.swrfixed = function(options)
    {
        var defaults = {
            zIndex  : 10,
            scroll  : 0,
            top     : 0,
            bottom  : 0,
            onFixed : function(element, scroll, options)
            {
                return true;
            },
            onStatic: function(element, scroll, options)
            {
                return true;
            },
            onResize: function(element, scroll, options)
            {
                return true;
            }
        };

        return new ClassSwrFixed(this, $.extend(defaults, options));
    }
})(jQuery);

