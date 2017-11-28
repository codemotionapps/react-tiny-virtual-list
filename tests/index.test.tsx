import {} from 'jest';
import * as React from 'react';
import {render} from 'react-dom';
import VirtualList from '../src/';

const HEIGHT = 100;
const ITEM_HEIGHT = 10;

describe('VirtualList', () => {
  let node: HTMLDivElement;
  function renderItem({index, style}: {index: number, style: React.CSSProperties}) {
    return (
      <div className="item" key={index} style={style}>
        Item #{index}
      </div>
    );
  }
  function getComponent(props = {}) {
    return (
      <VirtualList
        height={HEIGHT}
        overscanCount={0}
        itemSize={ITEM_HEIGHT}
        itemCount={500}
        renderItem={renderItem}
        {...props}
      />
    );
  }

  beforeEach(() => {
    node = document.createElement('div');
  });

  describe('number of rendered children', () => {
    it('renders enough children to fill the view', () => {
      render(getComponent(), node);

      expect(node.querySelectorAll('.item').length).toEqual(
        HEIGHT / ITEM_HEIGHT,
      );
    });

    it('does not render more children than available if the list is not filled', () => {
      render(getComponent({itemCount: 5}), node);

      expect(node.querySelectorAll('.item').length).toEqual(5);
    });

    // it('handles dynamically updating the number of items', () => {
    //   for (let itemCount = 0; itemCount < 5; itemCount++) {
    //     render(getComponent({itemCount}), node);
    //     expect(node.querySelectorAll('.item').length).toEqual(itemCount);
    //   }
    // });
  });

  describe('property updates', () => {
    it('updates scroll position if size shrinks smaller than the current scroll', () => {
      render(getComponent({scrollToIndex: 500}), node);
      render(getComponent({scrollToIndex: 500, itemCount: 10}), node);

      expect(node.textContent).toContain('Item #9');
    });
  });
});
