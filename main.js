(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ScrollBar = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScrollBar = function () {
  function ScrollBar(options) {
    _classCallCheck(this, ScrollBar);

    if (!options.selector) throw new Error('need to specify a selector');
    this.elem = document.querySelector(options.selector);
    this.parent = this.elem.parentElement;
    this.callback = options.callback || undefined;
    return this;
  }

  _createClass(ScrollBar, [{
    key: '_generateElems',
    value: function _generateElems() {
      var firstChild = this.elem.firstElementChild;
      var secondChild = firstChild.nextElementSibling;
      this.spacing = (secondChild.offsetLeft - firstChild.offsetLeft - firstChild.clientWidth) / 2;
      this.elemArr = copyElem.call(this, this.elem);
      // clone elements twice to animate smoothly
      function copyElem(elem) {
        var offsetPadding = 0;
        var clientWidth = 0;
        // pay attension that if elem displays none, the offsetLeft will always be 0
        if (elem.offsetParent === null) {
          // here elem displays none
          var node = elem.cloneNode(true);
          var nodeStyle = document.defaultView.getComputedStyle(elem);
          var parentDisplay = document.defaultView.getComputedStyle(elem.parentElement).display;
          var recordParentDisplay = parentDisplay;
          // node.style.cssText = nodeStyle.cssText;
          node.style.display = nodeStyle.display === 'none' ? 'block' : nodeStyle.display;
          node.style.zIndex = -1;
          elem.parentElement.style.display = parentDisplay === 'none' ? 'block' : parentDisplay;
          elem.parentElement.appendChild(node);
          offsetPadding = node.firstElementChild.nextElementSibling.offsetLeft - node.firstElementChild.offsetLeft - node.firstElementChild.clientWidth;
          node.style.paddingRight = offsetPadding + 'px';
          this.spacing = offsetPadding / 2;
          clientWidth = node.clientWidth;
          elem.parentElement.removeChild(node);
          elem.parentElement.style.display = recordParentDisplay;
        } else {
          offsetPadding = secondChild.offsetLeft - firstChild.offsetLeft - firstChild.clientWidth;
          elem.style.paddingRight = offsetPadding + 'px';
          clientWidth = elem.clientWidth;
        }
        var leftElem = getCopyElem(elem);
        leftElem.style.left = -clientWidth + 'px';
        // remove selected style
        leftElem.querySelector('.selected').classList.remove('selected');
        elem.parentElement.prepend(leftElem);
        var rightElem = getCopyElem(elem);
        rightElem.style.left = clientWidth + 'px';
        rightElem.querySelector('.selected').classList.remove('selected');
        elem.parentElement.append(rightElem);
        return [leftElem, elem, rightElem];

        function getCopyElem(elem) {
          var newElem = elem.cloneNode(true);
          // newElem.style.cssText = document.defaultView.getComputedStyle(elem).cssText;
          return newElem;
        }
      }
    }
  }, {
    key: '_bindMouseEvent',
    value: function _bindMouseEvent() {
      // ipad/iphone/android both understand touchend and mouseup event.
      var isMobile = /iphone|ipad|android/i.test(navigator.userAgent);
      var myDown = isMobile ? "touchstart" : "mousedown";
      var myMove = isMobile ? "touchmove" : "mousemove";
      var myUp = isMobile ? "touchend" : "mouseup";
      var self = this;
      var startX = 0;
      var canMove = false;
      var isClick = false;
      this.leftOffset = 0;

      addMouseEvent();
      // register mouse and touch event
      function addMouseEvent() {
        self._addEvent(myDown, handleStart);
        self._addEvent(myMove, handleMove);
        self._addEvent(myUp, handleEnd);
      }

      function handleStart(evt) {
        canMove = true;
        isClick = true;
        startX = evt instanceof MouseEvent ? evt.x : evt.changedTouches[0].pageX;
      }

      function handleMove(evt) {
        isClick = false;
        if (!canMove) return;
        var pointX = evt instanceof MouseEvent ? evt.x : evt.changedTouches[0].pageX;
        var offset = pointX - startX;
        self.elemArr[0].style.left = offset + self.leftOffset - self.elem.clientWidth + 'px';
        self.elemArr[1].style.left = offset + self.leftOffset + 'px';
        self.elemArr[2].style.left = offset + self.leftOffset + self.elem.clientWidth + 'px';
        // adjust the position of adjacent elements
        self._moveElem();
      }

      function handleEnd(evt) {
        // judge click on li
        if (isClick && evt.target.tagName === 'LI') {
          var src = evt.target;
          var i = self.elemArr.indexOf(src.parentElement);
          var j = Array.prototype.indexOf.call(src.parentElement.children, src);
          self.moveTo(i, j);
          return;
        }
        canMove = false;
        self._rebound(self.elemArr);
      }
    }
  }, {
    key: '_addEvent',
    value: function _addEvent(type, callback) {
      this.parent.addEventListener(type, callback, false);
    }
  }, {
    key: 'moveTo',
    value: function moveTo(i, j) {
      var _this = this;

      if (arguments.length === 1) i = 1;
      this._setSelected(i, j);
      var leftOffset = +this.elemArr[i].style.left.split('px')[0] + this.elemArr[i].children[j].offsetLeft;
      this._timer(leftOffset, -1).then(function () {
        // move elements
        _this._moveElem();
        // event will always trigger by center element
        _this._trigger(_this.elemArr[1].children[j], j);
      });
    }
    // move elements may change the selected element's index

  }, {
    key: '_moveElem',
    value: function _moveElem() {
      if (this.leftOffset <= -this.elem.clientWidth) {
        // move first child to last
        this.parent.append(this.elemArr[0]);
        this.elemArr.push(this.elemArr.shift());
        // reassign leftOffset
        this.leftOffset = +this.elemArr[1].style.left.split('px')[0];
        this.elemArr[0].style.left = this.leftOffset - this.elem.clientWidth + 'px';
        this.elemArr[2].style.left = this.leftOffset + this.elem.clientWidth + 'px';
      } else if (this.leftOffset >= this.elem.clientWidth) {
        // slide right
        this.parent.prepend(this.elemArr[2]);
        this.elemArr.unshift(this.elemArr.pop());
        this.leftOffset = +this.elemArr[1].style.left.split('px')[0];
        this.elemArr[0].style.left = this.leftOffset - this.elem.clientWidth + 'px';
        this.elemArr[2].style.left = this.leftOffset + this.elem.clientWidth + 'px';
      }
    }
    // _rebound

  }, {
    key: '_rebound',
    value: function _rebound() {
      var _this2 = this;

      for (var i = 0; i < this.elemArr.length; i++) {
        var _loop = function _loop(j) {
          var offsetLeft = +_this2.elemArr[i].style.left.split('px')[0];
          var leftClient = _this2.elemArr[i].children[j].offsetLeft + offsetLeft;
          if (leftClient >= 0 && leftClient <= _this2.spacing) {
            _this2._setSelected(i, j);
            // Because the selected element's style changes, here the leftClient will be remeasured.
            leftClient = _this2.elemArr[i].children[j].offsetLeft + offsetLeft;
            _this2._timer(leftClient, -1).then(function () {
              // move elements
              _this2._moveElem();
              // event will always trigger by center element
              _this2._trigger(_this2.elemArr[1].children[j], j);
            });
            return {
              v: void 0
            };
          } else if (leftClient < 0 && Math.abs(leftClient + _this2.elemArr[i].children[j].clientWidth) < _this2.spacing) {
            _this2._setSelected(i, j);
            leftClient = _this2.elemArr[i].children[j].offsetLeft + offsetLeft;
            _this2._timer(leftClient, 1).then(function () {
              // move elements
              _this2._moveElem();
              _this2._trigger(_this2.elemArr[1].children[j], j);
            });
            return {
              v: void 0
            };
          }
        };

        for (var j = 0; j < this.elemArr[i].children.length; j++) {
          var _ret = _loop(j);

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
      }
    }
    // direction: -1 left, 1 right

  }, {
    key: '_timer',
    value: function _timer(lOffset, direction) {
      var _this3 = this;

      return new Promise(function (resolve) {
        var step = 0;
        var speed = Math.abs(Math.round(lOffset / 10));
        var offsetOriginal = +_this3.elemArr[1].style.left.split('px')[0];
        var id = setInterval(function () {
          step += speed;
          if (step >= Math.abs(-lOffset * direction)) {
            clearInterval(id);
            // amend the position
            Array.prototype.forEach.call(_this3.elemArr, function (v, i) {
              v.style.left = offsetOriginal - lOffset + v.clientWidth * (i - 1) + 'px';
            });
            // revise leftOffset here
            _this3.leftOffset = +_this3.elemArr[1].style.left.split('px')[0];
            resolve();
            return;
          }
          Array.prototype.forEach.call(_this3.elemArr, function (v, i) {
            v.style.left = offsetOriginal + direction * step + v.clientWidth * (i - 1) + 'px';
          });
        }, 20);
      });
    }
    // set selected style

  }, {
    key: '_setSelected',
    value: function _setSelected(i, j) {
      this.elem.parentElement.querySelector('.selected').classList.remove('selected');
      this.elemArr[i].children[j].classList.add('selected');
    }
    // trigger event after rebound

  }, {
    key: '_trigger',
    value: function _trigger(elem, j) {
      this.callback(j);
    }
  }]);

  return ScrollBar;
}();

function initScrollBar(options) {
  var scrollbar = new ScrollBar(options);
  scrollbar._generateElems();
  scrollbar._bindMouseEvent();
  return scrollbar;
}

return initScrollBar;

})));
