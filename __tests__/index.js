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

    it("with mapStates", () => {
      const SubscriberComponent = jest.fn(({ fake }) => <p>{fake}</p>);
      const SubscribedComponent = subscribe(
        SubscriberComponent,
        [newState],
        ({ newState }) => ({
          fake: newState.state.fake
        })
      );
      const component = renderer.create(<SubscribedComponent />);

      expect(component.root.findByType(SubscriberComponent).props).toEqual({
        fake: newState.state.fake
      });
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);

      newState.setState({ fake: "new value" });

      expect(component.root.findByType(SubscriberComponent).props).toEqual({
        fake: newState.state.fake
      });
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);
    });

    it("without mapStates", () => {
      const SubscriberComponent = jest.fn(({ newState }) => (
        <p>{newState.state.fake}</p>
      ));
      const SubscribedComponent = subscribe(SubscriberComponent, [newState]);
      const component = renderer.create(<SubscribedComponent />);

      expect(
        component.root.findByType(SubscriberComponent).props.newState.state
      ).toEqual(newState.state);
      expect(
        component.root.findByType(SubscriberComponent).props.newState.setState
      ).toEqual(newState.setState);
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);

      newState.setState({ fake: "new value 2" });

      expect(
        component.root.findByType(SubscriberComponent).props.newState.state
      ).toEqual(newState.state);
      expect(
        component.root.findByType(SubscriberComponent).props.newState.setState
      ).toEqual(newState.setState);
      expect(component.root.findByType("p").children).toEqual([
        newState.state.fake
      ]);
    });
  });
});
