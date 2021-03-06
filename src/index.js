/*
 下拉OR上拉刷新模块
 * */
(function () {
    "use strict";
    var $that = this,
        $d,
        $b;
    //$lock;
    var $hasTouch = "ontouchstart" in $that;
    var $eventStart = $hasTouch ? "touchstart" : "mousedown",
        $eventEnd = $hasTouch ? "touchend" : "mouseup",
        $eventMove = $hasTouch ? "touchmove" : "mousemove",
        $eventResize = $hasTouch ? "orientationchange" : "resize",
        $eventcancel = $hasTouch ? "touchcancel" : "mouseup";
    var $touch;
    var _d = document;
    var getScrollTop = function getScrollTop() {
        var bodyScrollTop = 0;
        var documentScrollTop = 0;
        if (_d.body) {
            bodyScrollTop = _d.body.scrollTop;
        }
        if (_d.documentElement) {
            documentScrollTop = _d.documentElement.scrollTop;
        }
        return bodyScrollTop - documentScrollTop > 0 ? bodyScrollTop : documentScrollTop;
    };

// 文档的总高度
    var getScrollHeight = function getScrollHeight() {
        var bodyScrollHeight = 0;
        var documentScrollHeight = 0;
        if (document.body) {
            bodyScrollHeight = document.body.scrollHeight;
        }
        if (document.documentElement) {
            documentScrollHeight = document.documentElement.scrollHeight;
        }
        return bodyScrollHeight - documentScrollHeight > 0 ? bodyScrollHeight : documentScrollHeight;
    };

// 浏览器视口的高度
    var getWindowHeight = function getWindowHeight() {
        var windowHeight = 0;
        if (document.compatMode === 'CSS1Compat') {
            windowHeight = document.documentElement.clientHeight;
        } else {
            windowHeight = document.body.clientHeight;
        }
        return windowHeight;
    };
    var $utils = {
        prefix: (function () {
            var styles = window.getComputedStyle(document.documentElement, ''),
                pre = (Array.prototype.slice
                        .call(styles)
                        .join('')
                        .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                )[1],
                dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
            return {
                dom: dom,
                lowercase: pre,
                css: '-' + pre + '-',
                js: pre[0].toUpperCase() + pre.substr(1)
            };
        })(),
        css: function (obj, key, value, closePrefix) {
            obj.style[(closePrefix?'':$utils.prefix.css) + key] = value;
        },
        mouseXY: function (_e) {
            // 用于扩展JQ的触摸事件
            var $x, $y;
            if (_e.originalEvent && _e.originalEvent.changedTouches) {
                $x = _e.originalEvent.changedTouches[0].pageX;
                $y = _e.originalEvent.changedTouches[0].pageY;
            } else if (_e.changedTouches) {
                $x = _e.changedTouches[0].pageX;
                $y = _e.changedTouches[0].pageY;
            }
            else {
                $x = _e.pageX;
                $y = _e.pageY;
            }
            return {x: $x, y: $y};
        },
        //DOM没有提供insertAfter()方法
        insertAfter: function (nowNode, newNode) {
            var parent = nowNode.parentNode;
            if (parent.lastChild == nowNode) {
                parent.appendChild(newNode);
            }
            else {
                parent.insertBefore(newNode, nowNode.nextSibling);
            }
        }
    };
    var success = (function () {
        if (!this.isLock && this.status.loading) {
            this.status.loading=false;
            this.obj.css('transform', 'translate3d(0,0,0)');
            this.upObj.innerHTML = this.opt.up.template.success;
        }
    });

    $touch = function (element, _opt) {
        var $obj = null;
        $d = $that.document;
        $b = $d.body;
        if (element == undefined) {
            $obj = $b;
        } else {
            $obj = element;
        }
        this.opt = _opt;
        this.opt.windowHeight = window.innerHeight / 5;
        this.obj = $obj;
        this.obj.css = function (key, value) {
            if (arguments.length === 2) {
                $utils.css(this, key, value);
            } else {
                return this.style[key];
            }
        };
        var that = this;
        $obj.addEventListener($eventStart, function (e) {
            $touch.start.call(that, e);
        });

        $obj.addEventListener($eventEnd, function (e) {
            $touch.end.call(that, e);
        });

        $obj.addEventListener($eventMove, function (e) {
            $touch.move.call(that, e);
        });
        window.addEventListener($eventResize, function (e) {
            $touch.resize.call(that, e);
        });

        $obj.addEventListener($eventcancel, function (e) {
            $touch.cancel.call(that, e);
        });
        $obj.addEventListener('transitionend', function (e) {
            console.log('transitionend');
        });
        window.addEventListener('scroll', function (e) {
            if (getScrollTop() + getWindowHeight() >= getScrollHeight() - 50) {
                console.log('go to bottom');
                // 到底
                that.status.loading=true;
                that.opt.down.fn(success.bind(that));
            }
        });
        // 初始化CSS
        $utils.css($obj, 'transform', 'translate3d(0,0,0)');
        $utils.css($obj, 'position', 'relative',true);
        $utils.css($obj, 'z-index', '20',true);
        this.initTemplate();
        this.status = {
            lock:false,
            loading:false
        };
        return this;
    };

    $touch.prototype.initTemplate = function () {
        // 初始化上部分
        var $div;
        if (!document.querySelector('.js-mdropload-up')) {
            $div = document.createElement('div');
            $div.innerHTML = this.opt.up.template.none;
            $div.className = 'js-mdropload-up';
            this.obj.parentNode.insertBefore($div, this.obj);
        }
        // 初始化下部分
        if (!document.querySelector('.js-mdropload-down')) {
            $div = document.createElement('div');
            $div.innerHTML = this.opt.up.template.none;
            $div.className = 'js-mdropload-down';
            $utils.insertAfter(this.obj, $div);
        }
        this.upObj = document.querySelector('.js-mdropload-up');
        this.downObj = document.querySelector('.js-mdropload-down');
    };

    $touch.start = function (e) {
        console.log('touch start');
        // 取当前transform高度
        this.offsetY = this.obj.css('transform').split(',')[1].replace('px', '').trim() * 1;
        if (isNaN(this.offsetY)) {
            this.offsetY = 0;
        }
        this.status.lock=true;
        this.status.loading=false;
        this.obj.css('transition-duration', '0s');
        this.startMouse = $utils.mouseXY(e);
    };

    $touch.end = function (e) {
        console.log('touch end');
        if(this.status.lock){
            this.endMouse = $utils.mouseXY(e);
            var mouseY = this.endMouse.y - this.startMouse.y;
            // 操作完成之后的回调方法
            this.status.lock= false;
            var _success=success.bind(this);
            this.obj.css('transition-duration', '.5s');
            this.obj.css('transform', 'translate3d(0,' + this.opt.height + 'px,0)');
            if (mouseY > this.opt.height) {
                this.upObj.innerHTML = this.opt.up.template.loading;
                this.status.loading=true;
                this.opt.up.fn(_success);
            } else {
                _success();
            }
        }
        // this.upObj.innerHTML = this.opt.up.template.none;
    };
    $touch.move = function (e) {
        if(this.status.lock){
            console.log('touch move');
            e.preventDefault();
            if (getScrollTop() === 0) {
                var mouse = $utils.mouseXY(e);
                var mouseY = mouse.y - this.startMouse.y;
                if (mouseY > 0 && mouseY < this.opt.windowHeight) {
                    this.obj.css('transform', 'translate3d(0,' + (mouseY + this.offsetY) + 'px,0)');
                }
                if (mouseY > this.opt.height) {
                    this.upObj.innerHTML = this.opt.up.template.message;
                }
            }
        }
    };
    $touch.resize = function (e) {

    };
    $touch.cancel = function (e) {
    };
    $that.Mdropload = function (_el, _opt) {
        return new $touch(_el, _opt);
    };
}).call(this, document);