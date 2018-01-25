import * as React from 'react';
import { TransitionMotion, TransitionStyle, Style, PlainStyle } from 'react-motion'; // TODO: import from react-motion/lib/TransitionMotion
import * as PropTypes from 'prop-types';
import SizeAndPositionManager from './SizeAndPositionManager';
import {
  DIRECTION,
  DIRECTION_VERTICAL,
  DIRECTION_HORIZONTAL,
  scrollProp,
  sizeProp,
  positionProp
} from './constants';

const STYLE_WRAPPER: React.CSSProperties = {
  overflow: 'auto',
  willChange: 'transform',
  WebkitOverflowScrolling: 'touch'
};

const STYLE_INNER: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minHeight: '100%'
};

export type ItemSizeGetter = (key: string) => number;
export type ItemSize = number | number[] | ItemSizeGetter;

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
  width?: number | string,
  defaultStyle(key: string, size: number): Style,
  defaultStyleInvisible(key: string, size: number): Style,
  willEnter(style: TransitionStyle): PlainStyle,
  willLeave(style: TransitionStyle): Style,
  willLeaveInvisible(style: TransitionStyle): Style,
  // didLeave?(style: TransitionStyle): void,
  keyForIndex(index: number): string,
  renderItem(style: TransitionStyle): React.ReactNode,
  getRef?(ref: HTMLDivElement): void,
}

export interface State {
  offset: number
}

export default class VirtualList extends React.PureComponent<Props, State> {
  static defaultProps = {
    overscanCount: 3,
    scrollDirection: DIRECTION_VERTICAL,
    width: '100%'
    // didLeave: () => {} // tslint:disable-line no-empty
  };

  static propTypes = {
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    itemCount: PropTypes.number.isRequired,
    itemSize: PropTypes.oneOfType([PropTypes.number, PropTypes.array, PropTypes.func]).isRequired,
    overscanCount: PropTypes.number,
    renderItem: PropTypes.func.isRequired,
    scrollDirection: PropTypes.oneOf([DIRECTION_HORIZONTAL, DIRECTION_VERTICAL]).isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
  };

  sizeAndPositionManager = new SizeAndPositionManager({
    itemCount: this.props.itemCount,
    itemSizeGetter: (index) => this.getSize(index)
  });

  state = {
    offset: 0
  };

  private invisible = true;

  private lastOffsets: number[] = [];
  private lastRender: React.ReactNode[] = [];

  private rootNode: HTMLElement;

  constructor(props){
    super(props);

    // this.willEnter = this.willEnter.bind(this);
    this.willLeave = this.willLeave.bind(this);
    this.willLeaveInvisible = this.willLeaveInvisible.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentWillReceiveProps(nextProps: Props) {
    const {
      itemCount,
      itemSize
    } = this.props;
    const itemPropsHaveChanged = (
      nextProps.itemCount !== itemCount ||
      nextProps.itemSize !== itemSize
    );

    if (nextProps.itemCount !== itemCount) {
      this.sizeAndPositionManager.updateConfig({
        itemCount: nextProps.itemCount
      });
    }

    if (itemPropsHaveChanged) {
      this.recomputeSizes();
    }
  }

  handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const offset = this.getNodeOffset();

    if (offset < 0 || this.state.offset === offset || e.target !== this.rootNode) {
      return;
    }

    this.invisible = true;

    this.setState({
      offset
    });
  }

  getNodeOffset() {
    const {scrollDirection = DIRECTION_VERTICAL} = this.props;
    return this.rootNode[scrollProp[scrollDirection]];
  }

  getSize(index: number) {
    const { itemSize, keyForIndex } = this.props;

    if (typeof itemSize === 'function') {
      return itemSize(keyForIndex(index));
    }

    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  }

  willLeave(style: TransitionStyle): Style {
    const { scrollDirection = DIRECTION_VERTICAL } = this.props;
    const offset = this.lastOffsets[style.data];
    const offsetProp = positionProp[scrollDirection];
    style[offsetProp] = offset;
    return this.props.willLeave(style);
  }

  willLeaveInvisible(style: TransitionStyle): Style {
    const { scrollDirection = DIRECTION_VERTICAL } = this.props;
    const offset = this.lastOffsets[style.data];
    const offsetProp = positionProp[scrollDirection];
    style[offsetProp] = offset;
    return this.props.willLeaveInvisible(style);
  }

  recomputeSizes(startIndex = 0) {
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
      width,
      defaultStyle,
      defaultStyleInvisible,
      willLeave,
      willLeaveInvisible,
      willEnter,
      // didLeave,
      keyForIndex,
      ...props
    } = this.props;
    const {offset} = this.state;
    const { sizeAndPositionManager: manager, invisible } = this;
    const { start, stop } = manager.getVisibleRange({
      containerSize: this.props[sizeProp[scrollDirection]] || 0,
      offset,
      overscanCount
    });
    const items: TransitionStyle[] = [];

    const loadedKeys: {[key: string]: boolean} = {};

    if (typeof start !== 'undefined' && typeof stop !== 'undefined') {
      const offsetProp = positionProp[scrollDirection];
      for (let index = start; index <= stop; index++) {
        const { size, offset } = manager.getSizeAndPositionForIndex(index);
        this.lastOffsets[index] = offset;
        const key = keyForIndex(index);
        const style: Style = {
          ...invisible ? defaultStyleInvisible(key, size) : defaultStyle(key, size),
          [offsetProp]: offset
        };
        loadedKeys[key] = true;
        items.push({
          key,
          data: index,
          style
        });
      }
    }

    return <div
      ref={this.getRef}
      {...props}
      onScroll={this.handleScroll}
      style={{...STYLE_WRAPPER, ...style, height, width}}
    >
      <TransitionMotion
        willLeave={invisible ? this.willLeaveInvisible : this.willLeave}
        willEnter={willEnter}
        // didLeave={didLeave}
        styles={items}
      >
        {(styles) => <div style={{...STYLE_INNER, [sizeProp[scrollDirection]]: this.sizeAndPositionManager.getTotalSize()}}>
          {styles.map((style) => {
            const { key } = style;
            if(!loadedKeys[key]){
              return this.lastRender[key];
            }
            return this.lastRender[key] = renderItem(style);
          })}
        </div>}
      </TransitionMotion>
    </div>;
  }

  componentDidMount(){
    this.invisible = false;
  }

  componentDidUpdate(){
    this.invisible = false;
  }

  private getRef = (node: HTMLDivElement): void => {
    this.rootNode = node;
    if(this.props.getRef){
      this.props.getRef(node);
    }
  }
}
