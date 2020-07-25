import React, { PureComponent, useState, useEffect } from "react";
export const createState = require("jstates");

export function subscribe(
  Compt,
  statesToSubscribeTo,
  mapStatesToProps = (states) => ({ states })
) {
  if (!Compt) {
    throw new Error(
      "subscribe was called without a component. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
    );
  }

  if (!statesToSubscribeTo) {
    throw new Error(
      "subscribe was called without states to subscribe to. subscribe(Component, [statesToSubscribeTo], mapStatesToProps)"
    );
  }
  statesToSubscribeTo = Array.isArray(statesToSubscribeTo)
    ? statesToSubscribeTo
    : [statesToSubscribeTo];

  return class Subscribe extends PureComponent {
    constructor(props) {
      super(props);

      this.mounted = true;
      this.onUpdate = this.onUpdate.bind(this);
      statesToSubscribeTo.forEach((state) => {
        state.subscribe(this.onUpdate);
      });
      this.state = this.generateState();
    }

    generateState() {
      return mapStatesToProps(...statesToSubscribeTo.map((i) => i.state));
    }

    componentWillUnmount() {
      this.mounted = false;
      statesToSubscribeTo.forEach((state) => {
        state.unsubscribe(this.onUpdate);
      });
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

export const useSubscribe = (stateInstance) => {
  const [subscribeState, setSubscribeState] = useState(
    stateInstance && stateInstance.state
  );

  useEffect(() => {
    if (!stateInstance) {
      throw new Error(
        "useSubscribe was called without a state. It should be called like this: useSubscribe(stateInstance);"
      );
    }

    const updateState = () => {
      setSubscribeState(stateInstance.state);
    };

    stateInstance.subscribe(updateState);

    return () => {
      stateInstance.unsubscribe(updateState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return subscribeState;
};
