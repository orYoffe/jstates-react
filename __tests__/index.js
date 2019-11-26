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
});
