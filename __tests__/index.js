import "babel-polyfill";
import React from "react";
import renderer from "react-test-renderer";
import { act } from "react-dom/test-utils";
import { render as DomRender, unmountComponentAtNode } from "react-dom";
const { createState, subscribe, useSubscribe } = require("../index");

describe("jstates-react", () => {
  describe("State", () => {
    it("should initialize with state and subscribers", () => {
      const initialState = { fake: "value" };
      const state = createState(initialState);

      expect(state.state).toEqual(initialState);
    });

    it("should change state and call subscribed functions when state changes", () => {
      const initialState = { fake: "value" };
      const state = createState(initialState);
      const subscriber = jest.fn();
      state.subscribe(subscriber);
      const newState = { fake: "value", some: "new value" };

      return state.setState(newState).then(() => {
        expect(state.state).toEqual(newState);
        expect(subscriber).toHaveBeenCalledTimes(1);
      });
    });
  });

  const extractValuesFromStates = (states) => {
    const values = [];
    Object.keys(states).forEach((key) => {
      const i = states[key];
      Object.keys(i).forEach((key2) => {
        values.push(i[key2]);
      });
    });
    return values;
  };

  describe("subscribe", () => {
    const initialState = { fake: "value" };
    const newState = createState(initialState);
    const otherprops = { other: "props" };

    it("should throw an error when called without a component", () => {
      expect(() => subscribe()).toThrow(
        "subscribe was called without a component. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
      );
    });

    it("should throw an error when called without statesToSubscribeTo", () => {
      expect(() => subscribe(true)).toThrow(
        "subscribe was called without states to subscribe to. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
      );
    });

    it("with mapStates", () => {
      const SubscriberComponent = jest.fn(({ fake }) => <p>{fake}</p>);
      const SubscribedComponent = subscribe(
        SubscriberComponent,
        newState,
        (newState) => ({
          fake: newState.fake,
        })
      );
      const component = renderer.create(
        <SubscribedComponent {...otherprops} />
      );

      const props = {
        fake: newState.state.fake,
        ...otherprops,
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
      expect(component.root.findByType(SubscriberComponent).props).toEqual(
        props
      );
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake,
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value" }).then(() => {
        const newprops = {
          fake: newState.state.fake,
          ...otherprops,
        };
        expect(component.root.findByType(SubscriberComponent).props).toEqual(
          newprops
        );
        expect(component.root.findByType("p").children).toEqual([
          newState.state.fake,
        ]);

        expect(SubscriberComponent).toHaveBeenCalledTimes(1);
        expect(SubscriberComponent).toHaveBeenCalledWith(newprops, {});
      });
    });

    it("without mapStates", () => {
      const SubscriberComponent = jest.fn(({ states }) => <p>{states.fake}</p>);
      const SubscribedComponent = subscribe(SubscriberComponent, newState);
      const component = renderer.create(
        <SubscribedComponent {...otherprops} />
      );

      const props = {
        states: newState.state,
        ...otherprops,
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
      expect(
        component.root.findByType(SubscriberComponent).props.states
      ).toEqual(newState.state);
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake,
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value 2" }).then(() => {
        const props = {
          states: newState.state,
          ...otherprops,
        };
        expect(SubscriberComponent).toHaveBeenCalledTimes(1);
        expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
        expect(
          component.root.findByType(SubscriberComponent).props.states
        ).toEqual(newState.state);
        expect(component.root.findByType("p").children).toEqual([
          newState.state.fake,
        ]);
      });
    });

    it("integration", () => {
      const otherprops = { other: "props" };
      const initialState = {
        counter: 0,
        unrelated: "value",
      };
      const counterState = createState(initialState);
      const unsubscribeSpy = jest.spyOn(counterState, "unsubscribe");

      const addOne = () =>
        counterState.setState((state) => ({
          counter: ++state.counter,
        }));
      const removeOne = () =>
        counterState.setState((state) => ({
          counter: --state.counter,
        }));

      let updatesCountCounter = 0;
      function Counter() {
        ++updatesCountCounter;
        return (
          <>
            <button test-id="add" onClick={addOne}>
              add one +
            </button>
            <button test-id="remove" onClick={removeOne}>
              remove one -
            </button>
          </>
        );
      }

      let updatesCountDisplay = 0;
      function CountDisplay({ counter }) {
        ++updatesCountDisplay;
        return <p test-id="count">Current counter: {counter}</p>;
      }
      const mapStates = (counterState) => ({
        counter: counterState.counter,
      });

      const SubscribedCountDisplay = subscribe(
        CountDisplay,
        [counterState],
        mapStates
      );

      let updatesCountAlways = 0;
      function UpdatesAlways({ states }) {
        ++updatesCountAlways;
        return (
          <p test-id="always-count">Current state: {JSON.stringify(states)}</p>
        );
      }
      const SubscribedUpdatesAlways = subscribe(UpdatesAlways, counterState);

      let updatesCountApp = 0;
      function App() {
        ++updatesCountApp;
        return (
          <>
            <SubscribedCountDisplay />
            <Counter />
            <SubscribedUpdatesAlways />
          </>
        );
      }

      let component = renderer.create(<App {...otherprops} />);

      const getElementByTestId = (id) =>
        component.root.findByProps({ "test-id": id });

      const alwaysCount = getElementByTestId("always-count");
      const count = getElementByTestId("count");
      const add = getElementByTestId("add");
      const remove = getElementByTestId("remove");

      expect(updatesCountDisplay).toEqual(1);
      expect(updatesCountCounter).toEqual(1);
      expect(updatesCountAlways).toEqual(1);
      expect(updatesCountApp).toEqual(1);
      expect(count.children).toEqual(["Current counter: ", "0"]);
      expect(alwaysCount.children).toEqual([
        "Current state: ",
        '{"counter":0,"unrelated":"value"}',
      ]);
      return add.props.onClick().then(() => {
        expect(updatesCountCounter).toEqual(1);
        expect(updatesCountAlways).toEqual(2);
        expect(updatesCountDisplay).toEqual(2);
        expect(updatesCountApp).toEqual(1);
        expect(count.children).toEqual(["Current counter: ", "1"]);
        expect(alwaysCount.children).toEqual([
          "Current state: ",
          '{"counter":1,"unrelated":"value"}',
        ]);

        return remove.props.onClick().then(() => {
          expect(updatesCountCounter).toEqual(1);
          expect(updatesCountAlways).toEqual(3);
          expect(updatesCountDisplay).toEqual(3);
          expect(updatesCountApp).toEqual(1);
          expect(count.children).toEqual(["Current counter: ", "0"]);
          expect(alwaysCount.children).toEqual([
            "Current state: ",
            '{"counter":0,"unrelated":"value"}',
          ]);

          return counterState
            .setState({ otherValue: "somethig different" })
            .then(() => {
              expect(updatesCountCounter).toEqual(1);
              expect(updatesCountAlways).toEqual(4);
              expect(updatesCountDisplay).toEqual(3);
              expect(updatesCountApp).toEqual(1);
              expect(count.children).toEqual(["Current counter: ", "0"]);
              expect(alwaysCount.children).toEqual([
                "Current state: ",
                '{"counter":0,"unrelated":"value","otherValue":"somethig different"}',
              ]);

              expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
              // unmounting should unsubcscribe
              component.update(null);
              expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
            });
        });
      });
    });

    describe("performance", () => {
      const createStatesAndSubscribers = (howMany) => {
        // create states
        const states = new Array(howMany).fill(null).map((d, i) => {
          const initialState = { count: 0 };
          for (let index = 0; index < howMany; index++) {
            initialState[`prop${index}`] = Math.random();
          }
          return createState(initialState);
        });

        // create subscribers
        // and subscribe each component to all states
        const onUpdateSpies = [];
        const renderSpies = [];
        const components = new Array(howMany).fill(null).map((d, index) => {
          const Counter = ({ num, ...rest }) => {
            return (
              <div test-id="item">
                {num}
                {extractValuesFromStates(rest)}
              </div>
            );
          };
          const SubscribedCounter = subscribe(Counter, states, (...props) => ({
            num: "num",
            ...props,
          }));
          onUpdateSpies.push(
            jest.spyOn(SubscribedCounter.prototype, "onUpdate")
          );
          renderSpies.push(jest.spyOn(SubscribedCounter.prototype, "render"));
          return <SubscribedCounter key={`Counter${index}`} />;
        });

        return {
          states,
          onUpdateSpies,
          renderSpies,
          components,
        };
      };

      it("states times subscribers plus setState for each state", () => {
        const t0 = performance.now();
        const howMany = 50; // don't go over 50, it starts being slow
        const {
          states,
          onUpdateSpies,
          renderSpies,
          components,
        } = createStatesAndSubscribers(howMany);

        let wrapper;
        function App() {
          return <span test-id="wrapper">{components}</span>;
        }
        wrapper = renderer.create(<App />);
        const items = wrapper.root.findAllByProps({ "test-id": "item" });
        const propsValues = extractValuesFromStates(states.map((i) => i.state));

        expect(items).toHaveLength(howMany);
        items.forEach((i) => {
          expect(i.props).toEqual({
            children: ["num", propsValues],
            "test-id": "item",
          });
        });

        onUpdateSpies.forEach((onUpdate) =>
          expect(onUpdate).toHaveBeenCalledTimes(0)
        );
        renderSpies.forEach((render) =>
          expect(render).toHaveBeenCalledTimes(1)
        );

        // create createState
        const newState = {};
        for (let index = 0; index < howMany; index++) {
          newState[`newProp${index}`] = Math.random();
        }

        // call each setState on each state
        return Promise.all(
          states.map((state) => state.setState(newState))
        ).then(() => {
          const t1 = performance.now();
          expect(parseInt(t1 - t0, 10)).toBeLessThan(howMany * howMany * 4.8);
          console.log(
            "\x1b[36m",
            "*** Creating ",
            "\x1b[32m",
            howMany,
            "\x1b[36m",
            " states with each having",
            "\x1b[32m",
            howMany,
            "\x1b[36m",
            " subscribers and calling setState on each and having them update took ",
            "\x1b[35m",
            parseInt(t1 - t0, 10),
            "\x1b[36m",
            "milliseconds.",
            "\x1b[0m"
          );
          const items = wrapper.root.findAllByProps({
            "test-id": "item",
          });
          const propsValues = extractValuesFromStates(
            states.map((i) => i.state)
          );
          items.forEach((i) => {
            expect(i.props).toEqual({
              children: ["num", propsValues],
              "test-id": "item",
            });
          });

          onUpdateSpies.forEach((onUpdate) =>
            expect(onUpdate).toHaveBeenCalledTimes(howMany)
          );
          renderSpies.forEach((render) =>
            expect(render).toHaveBeenCalledTimes(howMany + 1)
          );
        });
      });
    });
  });

  describe("useSubscribe", () => {
    const initialState = { fake: "value" };
    const newState = createState(initialState);
    const otherprops = { other: "props" };

    let container;

    beforeEach(() => {
      // setup a DOM element as a render target
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      // cleanup on exiting
      unmountComponentAtNode(container);
      container.remove();
      container = null;
    });

    xit("should throw an error when called without a state", () => {
      const ComponentError = () => {
        const obj = useSubscribe();
        return obj;
      };
      expect(() => ComponentError()).toThrow(
        "useSubscribe was called without a state. It should be called like this: useSubscribe(state);"
      );
    });

    it("subscribing, updating and unsubscribing", async () => {
      const SubscriberComponent = jest.fn(() => {
        const { fake } = useSubscribe(newState);
        return <p data-testid="sub">{fake}</p>;
      });
      const unsubscribe = jest.spyOn(newState, "unsubscribe");

      act(() => {
        DomRender(<SubscriberComponent {...otherprops} />, container);
      });
      expect(SubscriberComponent.mock.calls.length).toEqual(1);
      expect(unsubscribe.mock.calls.length).toEqual(0);
      expect(
        container.querySelector("[data-testid='sub']").textContent
      ).toEqual(newState.state.fake);

      await act(async () => {
        await newState.setState({ fake: "new value 2" });
      });
      expect(unsubscribe.mock.calls.length).toEqual(0);
      expect(SubscriberComponent.mock.calls.length).toEqual(2);
      expect(
        container.querySelector("[data-testid='sub']").textContent
      ).toEqual(newState.state.fake);

      unmountComponentAtNode(container);
      await act(async () => {
        await newState.setState({ fake: "new value 3" });
      });
      expect(unsubscribe.mock.calls.length).toEqual(1);
      expect(SubscriberComponent.mock.calls.length).toEqual(2);
      expect(container.querySelector("[data-testid='sub']")).toEqual(null);
    });

    describe("performance", () => {
      const createStatesAndSubscribers = (howMany) => {
        // create states
        const states = new Array(howMany).fill(null).map((d, i) => {
          const initialState = { count: 0 };
          for (let index = 0; index < howMany; index++) {
            initialState[`prop${index}`] = Math.random();
          }
          return createState(initialState);
        });

        // create subscribers
        // and subscribe each component to all states
        const renderCounters = [];
        const components = new Array(howMany).fill(null).map((d, index) => {
          let renderCounter = { count: 0 };
          const Counter = ({ num }) => {
            const rest = states.map((s) => useSubscribe(s));
            renderCounter.count = renderCounter.count + 1;
            return (
              <div data-testid="item">
                {num}
                {extractValuesFromStates(rest)}
              </div>
            );
          };

          renderCounters.push(renderCounter);
          return <Counter key={`Counter${index}`} num="num" />;
        });

        return {
          states,
          renderCounters,
          components,
        };
      };

      it("states times subscribers plus setState for each state", async () => {
        const t0 = performance.now();
        const howMany = 50; // don't go over 50, it starts being slow
        const {
          states,
          renderCounters,
          components,
        } = createStatesAndSubscribers(howMany);

        function App() {
          return <span data-testid="wrapper">{components}</span>;
        }

        act(() => {
          DomRender(<App />, container);
        });

        let items = container.querySelectorAll("[data-testid='item']");
        expect(items).toHaveLength(howMany);

        let propsValues = extractValuesFromStates(states.map((i) => i.state));

        items.forEach((i) => {
          expect(i.textContent).toEqual("num" + propsValues.join(""));
        });

        renderCounters.forEach(({ count }) => expect(count).toEqual(1));

        // create newState
        const newState = {};
        for (let index = 0; index < howMany; index++) {
          newState[`newProp${index}`] = Math.random();
        }

        // call each setState on each state

        await act(async () => {
          await Promise.all(states.map((state) => state.setState(newState)));
        });

        const t1 = performance.now();
        expect(parseInt(t1 - t0, 10)).toBeLessThan(howMany * howMany * 3);
        console.log(
          "\x1b[36m",
          "*** Creating ",
          "\x1b[32m",
          howMany,
          "\x1b[36m",
          " states with each having",
          "\x1b[32m",
          howMany,
          "\x1b[36m",
          " subscribers and calling setState on each and having them update took ",
          "\x1b[35m",
          parseInt(t1 - t0, 10),
          "\x1b[36m",
          "milliseconds.",
          "\x1b[0m"
        );
        items = container.querySelectorAll("[data-testid='item']");
        propsValues = extractValuesFromStates(states.map((i) => i.state));
        items.forEach((i) => {
          expect(i.textContent).toEqual("num" + propsValues.join(""));
        });

        renderCounters.forEach(({ count }) => expect(count).toEqual(2));
      });
    });
  });
});
