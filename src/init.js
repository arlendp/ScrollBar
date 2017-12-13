import ScrollBar from './scrollbar';
export default function initScrollBar(options) {
  const scrollbar = new ScrollBar(options);
  scrollbar.generateElems();
  scrollbar.bindMouseEvent();
  return scrollbar;
}