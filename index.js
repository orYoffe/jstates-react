import React, { PureComponent, useState, useEffect } from "react";
export const createState = require("jstates");

export function subscribe(
  Compt,
  statesToSubscribeTo,
  mapStatesToProps = (states) => ({ states })
) {
  if (!Compt) {
    throw new Error(
      "subscribe was called without a component or callback. subscribe(Component | callback, [statesToSubscribeTo], mapStatesToProps)"
    );
  }

  if (!statesToSubscribeTo) {
    throw new Error(
      "subscribe was called without states to subscribe to. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
    );
  }
  const hasMultipleStates = Array.isArray(statesToSubscribeTo);

  return class Subscribe extends PureComponent {
    constructor(props) {
      super(props);

      this.mounted = true;
      this.onUpdate = this.onUpdate.bind(this);
      if (hasMultipleStates) {
        statesToSubscribeTo.forEach((state) => {
          state.subscribe(this.onUpdate);
        });
      } else {
        statesToSubscribeTo.subscribe(this.onUpdate);
      }
      this.state = this.generateState();
    }

    generateState() {
      if (hasMultipleStates)
        return mapStatesToProps(
          ...statesToSubscribeTo.map((i) => i.getState())
        );
      return mapStatesToProps(statesToSubscribeTo.getState());
    }

    componentWillUnmount() {
      this.mounted = false;
      if (hasMultipleStates) {
        statesToSubscribeTo.forEach((state) => {
          state.unsubscribe(this.onUpdate);
        });
      } else {
        statesToSubscribeTo.unsubscribe(this.onUpdate);
      }
    }

    onUpdate() {
      return new Promise((resolve) => {
        if (this.mounted) {
          this.setState(this.generateState(), resolve);
        } else {
          resolve();
        }
      });
    }

    render() {
      return <Compt {...this.props} {...this.state} />;
    }
  };
}

export const useSubscribe = (state) => {
  const [subscribeState, setSubscribeState] = useState(
    state && state.getState()
  );

  useEffect(() => {
    if (!state) {
      throw new Error(
        "useSubscribe was called without a state. It should be called like this: useSubscribe(state);"
      );
    }

    const updateState = () => {
      setSubscribeState(state.getState());
    };

    state.subscribe(updateState);

    return () => {
      state.unsubscribe(updateState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return subscribeState;
};
