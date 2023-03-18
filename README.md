[![SWUbanner](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://github.com/vshymanskyy/StandWithUkraine/blob/main/docs/README.md)
## Warning: Project is not actively maintained. This project was supposed to be an example of how simple state libraries can be.
<div align="center">
  <br><br><br><br><br>
  <img src="https://raw.githubusercontent.com/oryoffe/jstates-react/master/jstates.png" alt="jstates Logo" width="400">
  <br><br><br><br><br><br><br><br>
</div>

# JStates for React.js

A subscribe function to and a useSubscribe hook use [JStates state library](https://github.com/orYoffe/jstates)

<!-- [codesandbox jstates-react example](https://codesandbox.io/s/jstates-react-93uhx) -->

[![NPM](https://nodei.co/npm/jstates-react.png)](https://npmjs.org/package/jstates-react)

![GitHub issues](https://img.shields.io/github/issues/orYoffe/jstates-react.svg)
![license](https://img.shields.io/github/license/orYoffe/jstates-react.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/jstates-react)
![npm](https://img.shields.io/npm/v/jstates-react.svg)

<!-- ![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/jstates-react.svg) -->

## Install

```sh
npm i -S jstates-react
```

## Usage

### Creating a state instance

```js
// counterState.js
import { createState } from "jstates-react";

const counterState = createState({ counter: 0 });

export default counterState;
```

### Making state changes

```js
// Counter.jsx
import counterState from "./counterState";

function Counter() {
  return (
    <div>
      <button
        onClick={() => {
          counterState.setState(({ counter }) => ({ counter: counter + 1 }));
        }}
      >
        add one +
      </button>
      <button
        onClick={() => {
          counterState.setState(({ counter }) => ({ counter: counter - 1 }));
        }}
      >
        remove one -
      </button>
      <button
        onClick={() => {
          counterState.setState({ counter: 0 });
        }}
      >
        reset
      </button>
    </div>
  );
}
export default Counter;
```

### Subscribing to state changes

```js
// App.jsx with hooks
import { useSubscribe } from "jstates-react";
import counterState from "./counterState";
import Counter from "./Counter";

function App() {
  const { counter } = useSubscribe(counterState);
  return (
    <div>
      <p>Current counter: {counter}</p>
      <Counter />
    </div>
  );
}

export default App;
```

```js
// App.jsx with HOC
import { subscribe } from "jstates-react";
import counterState from "./counterState";
import Counter from "./Counter";

function App({ states }) {
  return (
    <div>
      <p>Current counter: {states[0].counter}</p>
      <Counter />
    </div>
  );
}

export default subscribe(App, counterState);
```

### `useSubscribe` hook

`useSubscribe` should be called with one jstates state instance.
Then would get updated whatever changes are made to the state it subscribed to

```js
const someState = createState({ userLikes: "nothing yet" });

function App() {
  const { userLikes } = useSubscribe(someState);

  return (
    <div>
      <p>You like: {userLikes}</p>
      <button onClick={() => someState.setState({ userLikes: "Monkeys" })}>
        Monkeys
      </button>
      <button onClick={() => someState.setState({ userLikes: "Horses" })}>
        Horses
      </button>
    </div>
  );
}
```

### HOC `subscribe`

#### Minimal requirement

`subscribe` should be called with a component and a state or an array with at least one jstates state instance.
Then would get updated whatever changes are made to the states it subscribed to

```js
const someState = createState({});

subscribe(Component, someState);

// With multiple states
const someOtherState = createState({});

subscribe(Component, [someState, someOtherState]);
```

#### `mapStatesToProps`

`subscribe` can be called with an additional function to map the states it subscribes to
into the props of the component. This pattern can be seen also in libraries like react-redux and is easy to test

```js
const mapStatesToProps = (counterState, otherState) => ({
  counter: counterState.counter,
  someOtherValue: otherState.someOtherValue,
});

function App({ counter, someOtherValue }) {
  return (
    <div>
      <p>Current counter: {counter}</p>
      <p>Another value: {someOtherValue}</p>
      <Counter />
    </div>
  );
}

subscribe(App, [counterState, otherState], mapStatesToProps);
```
