import React from "react";
import renderer from "react-test-renderer";
const { State, subscribe } = require("../index");

describe("jstates-react", () => {
  describe("State", () => {
    it("should throw an error when created without name", () => {
      expect(() => new State()).toThrow(
        "State was not given a name. new State(name, initialState)"
      );
    });

    it("should initialize with name, state and subscribers", () => {
      const name = "newState";
      const initialState = { fake: "value" };
      const state = new State(name, initialState);

      expect(state.name).toEqual(name);
      expect(state.state).toEqual(initialState);
    });

    it("should change state and call subscribed functions with the changed keys when state changes", () => {
      const name = "newState";
      const initialState = { fake: "value" };
      const state = new State(name, initialState);
      const subscriber = jest.fn();
      state.subscribe(subscriber);
      const newState = { fake: "value", some: "new value" };

      return state.setState(newState).then(() => {
        expect(state.state).toEqual(newState);
        expect(subscriber).toHaveBeenCalledWith(Object.keys(newState));
      });
    });
  });

  describe("subscribe", () => {
    const name = "newState";
    const initialState = { fake: "value" };
    const newState = new State(name, initialState);
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
        [newState],
        ({ newState }) => ({
          fake: newState.fake
        })
      );
      const component = renderer.create(
        <SubscribedComponent {...otherprops} />
      );

      const props = {
        fake: newState.state.fake,
        ...otherprops
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
      expect(component.root.findByType(SubscriberComponent).props).toEqual(
        props
      );
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value" }).then(() => {
        const newprops = {
          fake: newState.state.fake,
          ...otherprops
        };
        expect(component.root.findByType(SubscriberComponent).props).toEqual(
          newprops
        );
        expect(component.root.findByType("p").children).toEqual([
          newState.state.fake
        ]);

        expect(SubscriberComponent).toHaveBeenCalledTimes(1);
        expect(SubscriberComponent).toHaveBeenCalledWith(newprops, {});
      });
    });

    it("without mapStates", () => {
      const SubscriberComponent = jest.fn(({ newState }) => (
        <p>{newState.fake}</p>
      ));
      const SubscribedComponent = subscribe(SubscriberComponent, [newState]);
      const component = renderer.create(
        <SubscribedComponent {...otherprops} />
      );

      const props = {
        newState: newState.state,
        ...otherprops
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
      expect(
        component.root.findByType(SubscriberComponent).props.newState
      ).toEqual(newState.state);
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value 2" }).then(() => {
        const props = {
          newState: newState.state,
          ...otherprops
        };
        expect(SubscriberComponent).toHaveBeenCalledTimes(1);
        expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
        expect(
          component.root.findByType(SubscriberComponent).props.newState
        ).toEqual(newState.state);
        expect(component.root.findByType("p").children).toEqual([
          newState.state.fake
        ]);
      });
    });

    it("with stateKeysToListenTo", () => {
      newState.setState({ different: "value" });
      const SubscriberComponent = jest.fn(({ fake }) => <p>{fake}</p>);
      const SubscribedComponent = subscribe(
        SubscriberComponent,
        [newState],
        ({ newState }) => ({
          fake: newState.fake
        }),
        ["different"]
      );
      const component = renderer.create(
        <SubscribedComponent {...otherprops} />
      );

      const oldProps = {
        fake: newState.state.fake,
        ...otherprops
      };
      expect(SubscriberComponent).toHaveBeenCalledTimes(1);
      expect(SubscriberComponent).toHaveBeenCalledWith(oldProps, {});
      expect(component.root.findByType(SubscriberComponent).props).toEqual(
        oldProps
      );
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);

      jest.clearAllMocks();
      return newState.setState({ fake: "new value" }).then(() => {
        expect(component.root.findByType(SubscriberComponent).props).toEqual(
          oldProps
        );
        expect(component.root.findByType("p").children).toEqual([
          oldProps.fake
        ]);

        expect(SubscriberComponent).toHaveBeenCalledTimes(0);

        jest.clearAllMocks();
        return newState.setState({ different: "new value 2" }).then(() => {
          const props = {
            fake: newState.state.fake,
            ...otherprops
          };
          expect(SubscriberComponent).toHaveBeenCalledTimes(1);
          expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
          expect(component.root.findByType(SubscriberComponent).props).toEqual(
            props
          );
          expect(component.root.findByType("p").children).toEqual([
            newState.state.fake
          ]);
          expect(SubscriberComponent).toHaveBeenCalledTimes(1);
          expect(SubscriberComponent).toHaveBeenCalledWith(props, {});
        });
      });
    });
  });

  it("integration", () => {
    const otherprops = { other: "props" };
    const initialState = {
      counter: 0,
      unrelated: "value"
    };
    const counterState = new State("counterState", initialState);

    const addOne = () =>
      counterState.setState(state => ({
        counter: ++state.counter
      }));
    const removeOne = () =>
      counterState.setState(state => ({
        counter: --state.counter
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
    const mapStates = ({ counterState }) => ({
      counter: counterState.counter
    });

    const SubscribedCountDisplay = subscribe(
      CountDisplay,
      [counterState],
      mapStates,
      ["counter"]
    );

    let updatesCountAlways = 0;
    function UpdatesAlways({ counterState }) {
      ++updatesCountAlways;
      return (
        <p test-id="always-count">
          Current state: {JSON.stringify(counterState)}
        </p>
      );
    }
    const SubscribedUpdatesAlways = subscribe(UpdatesAlways, [counterState]);

    let updatesCountApp = 0;
    function App({ counter }) {
      ++updatesCountApp;
      return (
        <>
          <SubscribedCountDisplay />
          <Counter />
          <SubscribedUpdatesAlways />
        </>
      );
    }

    const component = renderer.create(<App {...otherprops} />);

    const getElementByTestId = id =>
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
      '{"counter":0,"unrelated":"value"}'
    ]);
    return add.props.onClick().then(() => {
      expect(updatesCountCounter).toEqual(1);
      expect(updatesCountAlways).toEqual(2);
      expect(updatesCountDisplay).toEqual(2);
      expect(updatesCountApp).toEqual(1);
      expect(count.children).toEqual(["Current counter: ", "1"]);
      expect(alwaysCount.children).toEqual([
        "Current state: ",
        '{"counter":1,"unrelated":"value"}'
      ]);

      return remove.props.onClick().then(() => {
        expect(updatesCountCounter).toEqual(1);
        expect(updatesCountAlways).toEqual(3);
        expect(updatesCountDisplay).toEqual(3);
        expect(updatesCountApp).toEqual(1);
        expect(count.children).toEqual(["Current counter: ", "0"]);
        expect(alwaysCount.children).toEqual([
          "Current state: ",
          '{"counter":0,"unrelated":"value"}'
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
              '{"counter":0,"unrelated":"value","otherValue":"somethig different"}'
            ]);
          });
      });
    });
  });
});
