import React from "react";
import renderer, { act } from "react-test-renderer";
const { createState, subscribe, useSubscribe } = require("../index");

describe("jstates-react", () => {
  describe("State", () => {
    it("should initialize with name, state and subscribers", () => {
      const initialState = { fake: "value" };
      const state = createState(initialState);

      expect(state.getState()).toEqual(initialState);
    });

    it("should change state and call subscribed functions when state changes", () => {
      const name = "newState";
      const initialState = { fake: "value" };
      const state = createState(initialState);
      const subscriber = jest.fn();
      state.subscribe(subscriber);
      const newState = { fake: "value", some: "new value" };

      return state.setState(newState).then(() => {
        expect(state.getState()).toEqual(newState);
        expect(subscriber).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("subscribe", () => {
    const initialState = { fake: "value" };
    const newState = createState(initialState);
    const otherprops = { other: "props" };

    it("should throw an error when called without a component", () => {
      expect(() => subscribe()).toThrow(
        "subscribe was called without a component or callback. subscribe(Component | callback, [statesToSubscribeTo], mapStatesToProps)"
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
        fake: newState.getState().fake,
        ...otherprops,
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
      expect(component.root.findByType(SubscriberComponent).props).toEqual(
        props
      );
      expect(component.root.findByType("p").children).toEqual([
        newState.getState().fake,
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value" }).then(() => {
        const newprops = {
          fake: newState.getState().fake,
          ...otherprops,
        };
        expect(component.root.findByType(SubscriberComponent).props).toEqual(
          newprops
        );
        expect(component.root.findByType("p").children).toEqual([
          newState.getState().fake,
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
        states: newState.getState(),
        ...otherprops,
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
      expect(
        component.root.findByType(SubscriberComponent).props.states
      ).toEqual(newState.getState());
      expect(component.root.findByType("p").children).toEqual([
        newState.getState().fake,
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value 2" }).then(() => {
        const props = {
          states: newState.getState(),
          ...otherprops,
        };
        expect(SubscriberComponent).toHaveBeenCalledTimes(1);
        expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
        expect(
          component.root.findByType(SubscriberComponent).props.states
        ).toEqual(newState.getState());
        expect(component.root.findByType("p").children).toEqual([
          newState.getState().fake,
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

              // unmounting should unsubcscribe
              component.update(null);
              expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
            });
        });
      });
    });
  });

  describe("useSubscribe", () => {
    const initialState = { fake: "value" };
    const newState = createState(initialState);
    const otherprops = { other: "props" };

    xit("should throw an error when called without a state", () => {
      const ComponentError = () => {
        const obj = useSubscribe();
        return obj;
      };
      expect(() => ComponentError()).toThrow(
        "useSubscribe was called without a state. It should be called like this: useSubscribe(state);"
      );
    });

    it("subscribing and updating", () => {
      const SubscriberComponent = () => {
        const { fake } = useSubscribe(newState);
        return <p>{fake}</p>;
      };

      let component;
      act(() => {
        component = renderer.create(<SubscriberComponent {...otherprops} />);
      });

      expect(component.root.findByType("p").children).toEqual([
        newState.getState().fake,
      ]);

      return act(() => {
        return newState.setState({ fake: "new value 2" });
      }).then(() => {
        expect(component.root.findByType("p").children).toEqual([
          newState.getState().fake,
        ]);
      });
    });
  });

  describe("performance", () => {
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
        onUpdateSpies.push(jest.spyOn(SubscribedCounter.prototype, "onUpdate"));
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
      const propsValues = extractValuesFromStates(
        states.map((i) => i.getState())
      );

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
      renderSpies.forEach((render) => expect(render).toHaveBeenCalledTimes(1));

      // create createState
      const newState = {};
      for (let index = 0; index < howMany; index++) {
        newState[`newProp${index}`] = Math.random();
      }

      // call each setState on each state
      return Promise.all(states.map((state) => state.setState(newState))).then(
        () => {
          const t1 = performance.now();
          expect(parseInt(t1 - t0, 10)).toBeLessThan(howMany ** howMany * 4);
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
          const items = wrapper.root.findAllByProps({ "test-id": "item" });
          const propsValues = extractValuesFromStates(
            states.map((i) => i.getState())
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
        }
      );
    });
  });
});
