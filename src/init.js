import ScrollBar from './scrollbar';
export default function initScrollBar(options) {
  const scrollbar = new ScrollBar(options);
  scrollbar._generateElems();
  scrollbar._bindMouseEvent();
  return scrollbar;
}