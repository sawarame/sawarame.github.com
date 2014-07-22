/**
 * easymdialog ver 0.1.0
 * ダイアログ用jQueryプラグイン
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
                var data = $this.data('easymdialog');
                if(data)
                {
                    return true;
                }
                // メンバ変数初期化
                $this.settings = $.extend(defaults, options);
                $this.beforeScroll = 0;
                $this.beforeWidth = 0;
                $this.beforeBodyPos = 0;
                $this.overlay1 = null;
                $this.overlay2 = null;
                $this.container = null;
                $this.element = null;
                $this.panel = null;
                $this.header = null;
                $this.close = null;
                $this.data('easymdialog', {target : $this});
                // 非表示にする
                $this.css('display', 'none');
            });
        },
        /**
         * ダイアログオープン
         */
        open : function()
        {
            return this.each(function()
            {
                var data = $(this).data('easymdialog');
                var $this = data.target;
                methods._open.apply($this);
            });
        },
        /**
         * ダイアログオープン
         */
        _open : function()
        {
            var self = this;
            // 現在のスクロール位置と幅を取得
            self.beforeScroll = $(window).scrollTop();
            self.beforeWidth = $("body").width();
            self.beforeBodyPos = $("body").css('position');

            $("body").css('position', 'relative');
            
            // コンテナ裏画面の作成
            if(1 > $("#" + self.settings.dialogId + "Container").length)
            {
                $('body').children().wrapAll('<div id="' + self.settings.dialogId + 'Container"></div>');
                //$("body").html('<div id="' + self.settings.dialogId + 'Container">' + $("body").html() + '</div>');
                self.container = $("#" + self.settings.dialogId + "Container");
                // コンテナ(裏画面)の固定
                self.container.css('position', 'fixed')
                    .css('top', '-' + self.beforeScroll + 'px')
                    .css('width', self.beforeWidth + 'px')
                    .css('margin', '0 auto');
            }
            
            // 裏画面を固定させるためのoverlayを作成
            if(1 > $("#" + self.settings.dialogId + "Overlay1").length)
            {
                $("body").append('<div id="' + self.settings.dialogId + 'Overlay1"></div>');
                self.overlay1 = $("#" + self.settings.dialogId + "Overlay1");
                self.overlay1
                    //.css("position","absolute")
                    .css("top","0px")
                    .css("left","0px")
                    .css("background-color", "#666666")
                    .css("opacity", "0.5")
                    .css("width", ($(document).outerWidth()) + "px")
                    .css("height", ($(document).height() + 200) + "px")
                    .css("z-index",　self.settings.zIndex + 1)
            }

            // スクロールを固定させるためのoverlayを作成
            if(1 > $("#" + self.settings.dialogId + "Overlay2").length)
            {
                $("body").append('<div id="' + self.settings.dialogId + 'Overlay2"></div>');
                self.overlay2 = $("#" + self.settings.dialogId + "Overlay2");
                self.overlay2
                    //.css("position","absolute")
                    .css("top","0px")
                    .css("left","0px")
                    //.css("width", ($(document).outerWidth()) + "px")
                    .css("z-index",　self.settings.zIndex);
            }
            
            // ダイアログ用のエレメントを作成
            if(1 > $("#" + self.settings.dialogId).length)
            {
                $('body').append('<div class="' + self.settings.dialogClass + '" id="' + self.settings.dialogId + '"></div>');
                self.element = $("#" + self.settings.dialogId);
                self.element.css("width", self.settings.width+"px")
                            .css('background-color', '#FFFFFF')
                            .css('border', 'solid 1px #EEEEEE')
                            .css('border-radius', '4px 4px 4px 4px')
                            .css('box-shadow', '10px 10px 6px -6px #444444');
                
                // ヘッダ表示
                if(!self.settings.noHeader)
                {
                    $("#" + self.settings.dialogId).append("<div class='modaldialog_header' id='"+ self.settings.dialogId + 'Header' +"'></div>");
                    self.header = $("#" + self.settings.dialogId + 'Header');
                    self.header.css('background-color', '#F7F7F9')
                               .css('border-bottom', 'solid 1px #EEEEEE')
                               .css('font-size', '18px')
                               .css('font-weight','bold')
                               .css('padding', '10px')
                               .css('text-shadow', '0 1px 0 rgba(255, 255, 255, 0.5)');
                    
                    if(!self.settings.noClose)
                    {
                        self.header.append('<a class="modaldialog_close" id="' + self.settings.dialogId + 'Close">×</a>');
                        self.close  = $('#' + self.settings.dialogId + 'Close');
                        self.close.css('position', 'relative')
                                  .css('color', '#000000')
                                  .css('float', 'right')
                                  .css('font-size', '20px')
                                  .css('font-weight', 'bold')
                                  .css('opacity', '0.2')
                                  .css('text-shadow', '0 1px 0 #FFFFFF')
                                  .css('cursor', 'pointer');
                        self.close.hover(
                            function()
                            {
                                self.close.css('opacity', '0.5');
                                self.close.css('text-decoration', 'none');
                            },
                            function()
                            {
                                self.close.css('opacity', '0.2');
                            }
                        );
                        // 閉じるボタンがクリックされたとき
                        self.close.click(function()
                        {
                            methods._close.apply(self);
                        });
                    }

                    // タイトル表示
                    if('' != self.settings.title)
                    {
                        self.header.append('<b>' + self.settings.title + '</b>');
                    }
                    else
                    {
                        self.header.append('&nbsp;');
                    }
                }                    
                
                // パネル部分表示
                $("#" + self.settings.dialogId).append("<div class='modaldialog_panel' id='"+ self.settings.dialogId + 'Panel' +"'></div>");
                self.panel  = $("#" + self.settings.dialogId + 'Panel');
                self.panel.css('padding', '15px 10px');
                
                self.panel.html(self.html());
                self.empty();
                
                // ダイアログを中央に表示
                var centerX = ($(window).width()/2)+$(window).scrollLeft();
                var posX = centerX - ($("#" + self.settings.dialogId).outerWidth() / 2);
                $("#" + self.settings.dialogId)
                    .css("position","absolute")
                    .css("top", self.settings.top+"px")
                    .css("left",posX + "px")
                    .css("display","none")
                    .css("z-index",　self.settings.zIndex + 2)
                    .fadeIn("fast");
            }
            self.settings.open(self.panel);
            
            methods._fix.apply(self);
        },
        /**
         * ダイアログクローズ
         */
        close : function()
        {
            return this.each(function()
            {
                var data = $(this).data('easymdialog');
                var $this = data.target;
                methods._close.apply($this);
            });
        },
        /**
         * ダイアログクローズ
         */
        _close : function()
        {
            var self = this;
            methods.log.apply(self, ['close']);

            if(1 > $("#" + self.settings.dialogId + "Container").length)
            {
                return;
            }
            
            self.html(self.panel.html());
            self.panel.empty();
            
            // コンテナの中身をbodyに移す
            $('body').css('position', self.beforeBodyPos);
            self.container.children().prependTo($('body'));
            
            if(self.overlay1 != null)
            {
                self.overlay1.remove();
            }
            if(self.overlay2 != null)
            {
                self.overlay2.remove();
            }
            if(self.container != null)
            {
                self.container.remove();
            }
            if(self.element != null)
            {
                self.element.remove();
            }
            if(self.panel != null)
            {
                self.panel.remove();
            }
            if(self.header != null)
            {
                self.header.remove();
            }
            if(self.close != null)
            {
                self.close.remove();
            }
            
            // スクロール位置を元に戻す
            $(window).scrollTop(self.beforeScroll);

            self.settings.close();
        },
        /**
         * スクロール固定
         */
        fix : function()
        {
            return this.each(function()
            {
                var data = $(this).data('easymdialog');
                var $this = data.target;
                methods._fix.apply($this);
            });
        },
        /**
         * スクロール固定
         */
        _fix : function()
        {
            var self = this;
            methods.log.apply(self, ['fix start']);
            if(1 > $("#" + self.settings.dialogId + "Container").length)
            {
                return;
            }

            $(window).scrollTop(0);
            self.element.css("top", self.settings.top+"px");

            var eleHeight = self.element.height() + 200;
            var winHeight = $(window).height();
            var overlay1Height = self.overlay1.height();
            var overlay2Height = eleHeight > winHeight ? eleHeight : winHeight;
            overlay1Height = overlay2Height > overlay1Height ? overlay2Height : overlay1Height;

            self.overlay1.css('position', 'fixed');
            self.overlay2.css('position', 'static');
            self.overlay1.css('height', overlay1Height + "px");
            self.overlay2.css("height", overlay2Height + "px");
        },
        /**
         * 破棄処理
         */
        destory : function()
        {
            return this.each(function()
            {
                var $this = $(this);
                var data = $(this).data('easymdialog');
                methods._close.apply(data.target);
                $this.removeData('easymdialog');
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
        // params
        dialogId : 'easyDialog',
        dialogClass : 'easyDialog',
        top: 100,
        width:500,
        zIndex: 2000,
        title : '',

        noHeader : false,
        noClose : false,

        // method
        open  : function(panel){},
        close : function(){},
        
        debug : false
    }

    $.fn.easymdialog = function(method)
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
            alert('Method ' +  method + ' does not exist on jquery.easymdialog');
        }
    }
    
})(jQuery);