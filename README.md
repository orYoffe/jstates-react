<div align="center">
  <br><br><br><br><br>
  <img src="https://raw.githubusercontent.com/oryoffe/jstates-react/master/jstates.png" alt="jstates Logo" width="400">
  <br><br><br><br><br><br><br><br>
</div>

# JStates for React.js

[The code JStates Library](https://github.com/orYoffe/jstates)

[JStates](https://github.com/orYoffe/jstates) React - A subscribe function to use [JStates](https://github.com/orYoffe/jstates) state library

[![NPM](https://nodei.co/npm/jstates-react.png)](https://npmjs.org/package/jstates-react)

![GitHub issues](https://img.shields.io/github/issues/orYoffe/jstates-react.svg)
![license](https://img.shields.io/github/license/orYoffe/jstates-react.svg)
![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/jstates-react.svg)
![npm](https://img.shields.io/npm/v/jstates-react.svg)

## Install

```sh
npm i -S jstates-react
```

## Usage

```js
// counterState.js
import { State } from "jstates-react";

const initialState = { counter: 0 };

const counterState = new State("counterState", initialState);

export default counterState;
```

```js
// Counter.js
import React from "react";
import counterState from "./counterState";

const addOne = () =>
  counterState.setState(state => ({ counter: ++state.counter }));
const removeOne = () =>
  counterState.setState(state => ({ counter: --state.counter }));
function Counter() {
  return (
    <>
      <button onClick={addOne}>add one +</button>
      <button onClick={removeOne}>remove one -</button>
    </>
  );
}

export default Counter;
```

```js
// App.js
import React from "react";
import { subscribe } from "jstates-react";
import counterState from "./counterState";
import Counter from "./Counter";

function App({ counter }) {
  return (
    <>
      <p>Current counter: {counter}</p>
      <Counter />
    </>
  );
}

const mapStatesToProps = ({ counterState }) => ({
  counter: counterState.counter
});

export default subscribe(App, [counterState], mapStatesToProps);
```

### `subscribe` options

#### Minimal requirement

`subscribe` can be called with a component and an array with at least one jstates state instance.
Then would get updated whatever changes are made to the states it subscribes to

```js
const someState = new State("someState", {});

subscribe(Component, [someState]);

// With multiple states
const someOtherState = new State("someState", {});

subscribe(Component, [someState, someOtherState]);
```

#### `mapStatesToProps`

`subscribe` can be called with an additional function to map the states it subscribes to
into the props of the component. This pattern can be seen also in libraries like react-redux and is easy to test

```js
const mapStatesToProps = ({ counterState }) => ({
  counter: counterState.counter
});

subscribe(Component, [someState], mapStatesToProps);
```

#### stateKeysToListenTo

`subscribe` can be called with an additional array of state keys.
Then the component would be updated only if one of those keys changed in the state

```js
const stateKeysToListenTo = ["counter"];

// Without mapStatesToProps
subscribe(Component, [someState], null, stateKeysToListenTo);

// With mapStatesToProps
subscribe(Component, [someState], mapStatesToProps, stateKeysToListenTo);
```

[Check out multiple states in the Jstates project](https://github.com/orYoffe/jstates)

## Advanced (no need until you have performance issues) Multiple states

It is recommended in order to separate your renders,
to use multiple states to minimize the components that would be called on update

```js
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

// Counter would get called only once
function Counter() {
  return (
    <>
      <button onClick={addOne}>add one +</button>
      <button onClick={removeOne}>remove one -</button>
    </>
  );
}

// Counter would get called only when counter property changes
function CountDisplay({ counter }) {
  return <p>Current counter: {counter}</p>;
}
const mapStates = ({ counterState }) => ({
  counter: counterState.counter
});

const SubscribedCountDisplay = subscribe(
  CountDisplay, // component
  [counterState], // states to subscribe to
  mapStatesToProps, // maps the states to component props
  ["counter"] // state keys to update only if they changed
);

// UpdatesAlways would get called on every state change
// it subscribes to the counterState updates and not to a specific property
function UpdatesAlways({ counterState }) {
  ++updatesCountAlways;
  return <p>Current state: {JSON.stringify(counterState)}</p>;
}
const SubscribedUpdatesAlways = subscribe(UpdatesAlways, [counterState]);

// App would get called only once
function App({ counter }) {
  return (
    <>
      <SubscribedCountDisplay />
      <Counter />
      <SubscribedUpdatesAlways />
    </>
  );
}
```
