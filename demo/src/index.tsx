import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { spring, Style, PlainStyle, TransitionStyle } from 'react-motion';

import VirtualList from '../../src/';
import './demo.css';

function willLeave({style}: TransitionStyle): Style {
  return {
    top: style.top,
    height: spring(0),
    opacity: spring(0)
  };
}

function willLeaveInvisible({style}: TransitionStyle): Style {
  return {
    top: style.top,
    height: 0,
    opacity: 0
  };
}

function defaultStyle(): Style {
  return {
    height: spring(51),
    opacity: spring(1)
  };
}

function defaultStyleInvisible(): Style {
  return {
    height: 51,
    opacity: 1
  };
}

function willEnter(): PlainStyle {
  return {
    height: 0,
    opacity: 0
  };
}

function keyForIndex(index: number): string {
  return index.toString();
}

class Demo extends React.Component {
  itemCount = 5;

  increase = () => {
    this.itemCount++;
    this.forceUpdate();
  }

  renderItem = (style: TransitionStyle) => (
    <div className="Row" style={style.style} key={style.data}>
      Row #{style.data}
    </div>
  )

  render() {
    return (
      <div className="Root">
        <VirtualList
          width="auto"
          height={700}
          itemCount={this.itemCount}
          renderItem={this.renderItem}
          itemSize={51}
          keyForIndex={keyForIndex}
          willLeave={willLeave}
          willLeaveInvisible={willLeaveInvisible}
          willEnter={willEnter}
          defaultStyle={defaultStyle}
          defaultStyleInvisible={defaultStyleInvisible}
          className="VirtualList"
        />
        <button onClick={this.increase}>Add item</button>
      </div>
    );
  }
}

ReactDOM.render(<Demo />, document.querySelector('#app'));
