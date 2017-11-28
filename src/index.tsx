import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as PropTypes from 'prop-types';
import SizeAndPositionManager, {ItemSize} from './SizeAndPositionManager';
import {
  DIRECTION,
  DIRECTION_VERTICAL,
  DIRECTION_HORIZONTAL,
  SCROLL_CHANGE_REASON,
  SCROLL_CHANGE_OBSERVED,
  SCROLL_CHANGE_REQUESTED,
  positionProp,
  scrollProp,
  sizeProp,
} from './constants';

const STYLE_WRAPPER: React.CSSProperties = {
  overflow: 'auto',
  willChange: 'transform',
  WebkitOverflowScrolling: 'touch',
};

const STYLE_INNER: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minHeight: '100%',
};

export interface ItemStyle {
  top?: number
}

interface StyleCache {
  [id: number]: ItemStyle,
}

export interface ItemInfo {
 index: number,
 style: ItemStyle,
}

export interface RenderedRows {
  startIndex: number,
  stopIndex: number,
}

export interface Props {
  className?: string,
  height: number | string,
  itemCount: number,
  itemSize: ItemSize,
  overscanCount?: number,
  scrollDirection?: DIRECTION,
  style?: any,
  transitionName?: string,
  transitionDuration?: number,
  width?: number | string,
  getRef?(ref: HTMLDivElement): void,
  renderItem(itemInfo: ItemInfo): React.ReactNode,
}

export interface State {
  offset: number,
  scrollChangeReason: SCROLL_CHANGE_REASON,
}

export default class VirtualList extends React.PureComponent<Props, State> {
  static defaultProps = {
    overscanCount: 3,
    scrollDirection: DIRECTION_VERTICAL,
    width: '100%',
    transitionName: '',
    transitionDuration: 0,
  };

  static propTypes = {
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    itemCount: PropTypes.number.isRequired,
    itemSize: PropTypes.oneOfType([PropTypes.number, PropTypes.array, PropTypes.func]).isRequired,
    overscanCount: PropTypes.number,
    renderItem: PropTypes.func.isRequired,
    scrollDirection: PropTypes.oneOf([DIRECTION_HORIZONTAL, DIRECTION_VERTICAL]).isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  };

  sizeAndPositionManager = new SizeAndPositionManager({
    itemCount: this.props.itemCount,
    itemSizeGetter: (index) => this.getSize(index),
  });

  state = {
    offset: 0,
    scrollChangeReason: SCROLL_CHANGE_REQUESTED,
  };

  private rootNode: HTMLElement;

  private styleCache: StyleCache = {};

  componentWillReceiveProps(nextProps: Props) {
    const {
      itemCount,
      itemSize,
    } = this.props;
    const itemPropsHaveChanged = (
      nextProps.itemCount !== itemCount ||
      nextProps.itemSize !== itemSize
    );

    if (nextProps.itemCount !== itemCount) {
      this.sizeAndPositionManager.updateConfig({
        itemCount: nextProps.itemCount,
      });
    }

    if (itemPropsHaveChanged) {
      this.recomputeSizes();
    }
  }

  handleScroll = (e: React.UIEvent<HTMLDivElement>)  => {
    const offset = this.getNodeOffset();

    if (offset < 0 || this.state.offset === offset || e.target !== this.rootNode) {
      return;
    }

    this.setState({
      offset,
      scrollChangeReason: SCROLL_CHANGE_OBSERVED,
    });
  }

  getNodeOffset() {
    const {scrollDirection = DIRECTION_VERTICAL} = this.props;
    return this.rootNode[scrollProp[scrollDirection]];
  }

  getSize(index: number) {
    const {itemSize} = this.props;

    if (typeof itemSize === 'function') {
      return itemSize(index);
    }

    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  }

  getStyle(index: number) {
    const style = this.styleCache[index];
    if (style) { return style; }

    const {scrollDirection = DIRECTION_VERTICAL} = this.props;
    const {offset} = this.sizeAndPositionManager.getSizeAndPositionForIndex(index);

    return this.styleCache[index] = {
      [positionProp[scrollDirection]]: offset,
    };
  }

  recomputeSizes(startIndex = 0) {
    this.styleCache = {};
    this.sizeAndPositionManager.resetItem(startIndex);
  }

  render() {
    const {
      height,
      overscanCount = 3,
      renderItem,
      itemCount,
      itemSize,
      scrollDirection = DIRECTION_VERTICAL,
      style,
      getRef,
      transitionName,
      transitionDuration,
      width,
      ...props,
    } = this.props;
    const {offset} = this.state;
    const {start, stop} = this.sizeAndPositionManager.getVisibleRange({
      containerSize: this.props[sizeProp[scrollDirection]] || 0,
      offset,
      overscanCount,
    });
    const items: React.ReactNode[] = [];

    if (typeof start !== 'undefined' && typeof stop !== 'undefined') {
      for (let index = start; index <= stop; index++) {
        items.push(renderItem({
          index,
          style: this.getStyle(index),
        }));
      }
    }

    return (
      <div ref={this.getRef} {...props} onScroll={this.handleScroll} style={{...STYLE_WRAPPER, ...style, height, width}}>
        <ReactCSSTransitionGroup
          transitionName={transitionName}
          transitionEnterTimeout={transitionDuration}
          transitionLeaveTimeout={transitionDuration}
          component="div"
          style={{...STYLE_INNER, [sizeProp[scrollDirection]]: this.sizeAndPositionManager.getTotalSize()}}
        >
          {items}
        </ReactCSSTransitionGroup>
      </div>
    );
  }

  private getRef = (node: HTMLDivElement): void => {
    this.rootNode = node;
    if(this.props.getRef){
      this.props.getRef(node);
    }
  }
}
