export default class ScrollBar {
  constructor(options) {
    if (!options.selector) throw new Error('need to specify a selector');
    this.elem = document.querySelector(options.selector);
    this.parent = this.elem.parentElement;
    this.callback = options.callback || undefined;
    return this;
  }
  _generateElems() {
    const firstChild = this.elem.firstElementChild;
    const secondChild = firstChild.nextElementSibling;
    this.spacing = (secondChild.offsetLeft - firstChild.offsetLeft - firstChild.clientWidth) / 2;
    this.elemArr = copyElem.call(this, this.elem);
    // clone elements twice to animate smoothly
    function copyElem(elem) {
      let offsetPadding = 0;
      let clientWidth = 0;
      // pay attension that if elem displays none, the offsetLeft will always be 0
      if (elem.offsetParent === null) {
        // here elem displays none
        const node = elem.cloneNode(true);
        const nodeStyle = document.defaultView.getComputedStyle(elem);
        const parentDisplay = document.defaultView.getComputedStyle(elem.parentElement).display;
        const recordParentDisplay = parentDisplay;
        node.style.cssText = nodeStyle.cssText;
        node.style.display = (nodeStyle.display === 'none') ? 'block' : nodeStyle.display;
        node.style.zIndex = -1;
        elem.parentElement.style.display = (parentDisplay === 'none') ? 'block' : parentDisplay;
        elem.parentElement.appendChild(node);
        offsetPadding = node.firstElementChild.nextElementSibling.offsetLeft - node.firstElementChild.offsetLeft -
          node.firstElementChild.clientWidth;
        this.spacing = offsetPadding / 2;
        clientWidth = node.clientWidth;
        elem.parentElement.removeChild(node);
        elem.parentElement.style.display = recordParentDisplay;
      } else {
        offsetPadding = secondChild.offsetLeft - firstChild.offsetLeft - firstChild.clientWidth;
        clientWidth = elem.clientWidth;
      }
      elem.style.paddingRight = offsetPadding + 'px';
      const leftElem = getCopyElem(elem);
      leftElem.style.left = -clientWidth + 'px';
      // remove selected style
      leftElem.querySelector('.selected').classList.remove('selected');
      elem.parentElement.prepend(leftElem);
      const rightElem = getCopyElem(elem);
      rightElem.style.left = clientWidth + 'px';
      rightElem.querySelector('.selected').classList.remove('selected');
      elem.parentElement.append(rightElem);
      return [leftElem, elem, rightElem];

      function getCopyElem(elem) {
        const newElem = elem.cloneNode(true);
        newElem.style.cssText = document.defaultView.getComputedStyle(elem).cssText;
        return newElem;
      }
    }
  }
  _bindMouseEvent() {
    // ipad/iphone/android both understand touchend and mouseup event.
    const isMobile = (/iphone|ipad|android/i).test(navigator.userAgent);
    const myDown = isMobile ? "touchstart" : "mousedown";
    const myMove = isMobile ? "touchmove" : "mousemove";
    const myUp = isMobile ? "touchend" : "mouseup";
    const self = this;
    let startX = 0;
    let canMove = false;
    let isClick = false;
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
      const pointX = evt instanceof MouseEvent ? evt.x : evt.changedTouches[0].pageX;
      const offset = pointX - startX;
      self.elemArr[0].style.left = (offset + self.leftOffset - self.elem.clientWidth) + 'px';
      self.elemArr[1].style.left = (offset + self.leftOffset) + 'px';
      self.elemArr[2].style.left = (offset + self.leftOffset + self.elem.clientWidth) + 'px';
      // adjust the position of adjacent elements
      self._moveElem();
    }

    function handleEnd(evt) {
      // judge click on li
      if (isClick && (evt.target.tagName === 'LI')) {
        const src = evt.target;
        const i = self.elemArr.indexOf(src.parentElement);
        const j = Array.prototype.indexOf.call(src.parentElement.children, src);
        self.moveTo(i, j);
        return;
      }
      canMove = false;
      self._rebound(self.elemArr);
    }
  }
  _addEvent(type, callback) {
    this.parent.addEventListener(type, callback, false);
  }
  moveTo(i, j) {
    if (arguments.length === 1) i = 1;
    this._setSelected(i, j);
    const leftOffset = +this.elemArr[i].style.left.split('px')[0] + this.elemArr[i].children[j].offsetLeft;
    this._timer(leftOffset, -1).then(() => {
      // move elements
      this._moveElem();
      // event will always trigger by center element
      this._trigger(this.elemArr[1].children[j], j);
    })
  }
  // move elements may change the selected element's index
  _moveElem() {
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
  _rebound() {
    for (let i = 0; i < this.elemArr.length; i++) {
      for (let j = 0; j < this.elemArr[i].children.length; j++) {
        const offsetLeft = +this.elemArr[i].style.left.split('px')[0];
        let leftClient = this.elemArr[i].children[j].offsetLeft + offsetLeft;
        if (leftClient >= 0 && leftClient <= this.spacing) {
          this._setSelected(i, j);
          // Because the selected element's style changes, here the leftClient will be remeasured.
          leftClient = this.elemArr[i].children[j].offsetLeft + offsetLeft;
          this._timer(leftClient, -1).then(() => {
            // move elements
            this._moveElem();
            // event will always trigger by center element
            this._trigger(this.elemArr[1].children[j], j);
          });
          return;
        } else if (leftClient < 0 && Math.abs(leftClient + this.elemArr[i].children[j].clientWidth) < this.spacing) {
          this._setSelected(i, j);
          leftClient = this.elemArr[i].children[j].offsetLeft + offsetLeft;
          this._timer(leftClient, 1).then(() => {
            // move elements
            this._moveElem();
            this._trigger(this.elemArr[1].children[j], j);
          });
          return;
        }
      }
    }
  }
  // direction: -1 left, 1 right
  _timer(lOffset, direction) {
    return new Promise((resolve) => {
      let step = 0;
      const speed = Math.abs(Math.round(lOffset / 10));
      const offsetOriginal = +this.elemArr[1].style.left.split('px')[0];
      const id = setInterval(() => {
        step += speed;
        if (step >= Math.abs(-lOffset * direction)) {
          clearInterval(id);
          // amend the position
          Array.prototype.forEach.call(this.elemArr, (v, i) => {
            v.style.left = (offsetOriginal - lOffset + v.clientWidth * (i - 1)) + 'px';
          });
          // revise leftOffset here
          this.leftOffset = +this.elemArr[1].style.left.split('px')[0];
          resolve();
          return;
        }
        Array.prototype.forEach.call(this.elemArr, (v, i) => {
          v.style.left = (offsetOriginal + direction * step + v.clientWidth * (i - 1)) + 'px';
        });
      }, 20)
    })
  }
  // set selected style
  _setSelected(i, j) {
    this.elem.parentElement.querySelector('.selected').classList.remove('selected');
    this.elemArr[i].children[j].classList.add('selected');
  }
  // trigger event after rebound
  _trigger(elem, j) {
    this.callback(elem, j);
  }
}