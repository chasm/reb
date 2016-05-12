# REB

We'll use a starter kit for the final class. In this instance it's a fairly simple kit that let's us work with server-side rendering. We'll also add some drag-and-drop, very simple animation, and a bit of redux-form.

First, clone the app, `cd` into the folder, and run `npm install`. You'll also need to instal nodemon and concurrently:

```sh
npm i -g nodemon concurrently
```

Now we can run the sample app. First we'll start the API server in one terminal tab:

```sh
npm run api-mon
```

Then, in a second tab, we'll start the development server:

```sh
npm start
```

We can go to [http://localhost:3030/api/posts](http://localhost:3030/api/posts) to see the output of the API server, and [http://localhost:3000/](http://localhost:3000/) to see the application itself.

From the application page, open the Page Source to look at the HTML sent from the server. You should see something like this in the `<body>`:

```html
<div id="root"></div>

<script>
  window.__INITIAL_STATE__ = {};
</script>
```

The page loads React in a bundle called `main.js`, and then React renders itself into the above `<div>` element. This happens *after* the page loads.

Now stop the dev server with Ctrl-c and start the server-side-rendering version:

```sh
npm run start-ssr
```

Reload the page source and you'll see this instead:

```html
<div id="root"><section data-reactroot="" data-reactid="1" data-react-checksum="-1301760188"><!-- react-empty: 2 --><div class="header" data-reactid="3"><ul class="header__menu" data-reactid="4"><li data-reactid="5"><a href="/posts" data-reactid="6">Posts</a></li><li data-reactid="7"><a href="/about" data-reactid="8">About</a></li><li data-reactid="9"><a href="/async-example" data-reactid="10">Async page example</a></li></ul></div><section class="posts" data-reactid="11"><!-- react-empty: 12 --><h1 data-reactid="13">Posts page</h1><div class="posts__list" data-reactid="14"></div></section></section></div>

<script>
  window.__INITIAL_STATE__ = {"app":{"spinnerAsyncPage":false},"posts":{"items":[],"posts":[{"id":"1","text":"example 1"},{"id":"2","text":"example 2"},{"id":"3","text":"example 3"}]}};
</script>
```

Note that the HTML for the page has already been rendered, and that the data needed has been added to a global variable called `__INITIAL_STATE__`. This means no waiting on the client side: the page renders immediately upon loading. When the React bundle(s) finish loading, React takes over and from there on out the application becomes a single-page application (SPA).

Server-side rendering like this using mostly the same code that's used to build the components on the client side is called "Universal JavaScript" (or, sometimes, "isomorphic JavaScript"). The Universal name is easier to remember and understand, and seems to be catching on quickly.

Now let's take a run through the code and see where everything is.

In the folder structure the first folder is called `api` and holds the code for the Express server used to produce the JSON REST API on port 3030.

The server code is located in the `api/index.js` file. Here's what it does:

1. First we import `Express` and create a new `app` with `new Express()`. Then we import `http` and create an instance of a server, passing our Express app to it:

    ```js
    import Express from 'express';
    const app = new Express();
    const server = new http.Server(app);
    ```

2. Next we use `morgan` for logging. We import it and `fs`
 for use with the filesystem. We set the path to the logs, create a write stream that appends to the log file (the 'a' flag), and then add the logger as middleware to Express, telling it to combine the standard and error outputs into one log:

     ```js
     import morgan from 'morgan';
     import fs from 'fs';
     const logPath = __dirname + '/../logs/api.log';
     const accessLogStream = fs.createWriteStream(logPath, { flags: 'a' });
     app.use(morgan('combined', { stream: accessLogStream }));
     ```

 3. With logging good to go, we add a body parser to parse request bodies (for example, from forms). We'll tell the body parser to parse json, and we'll use the urlencoded extended set to false to tell it NOT to use [qs](https://github.com/ljharb/qs) to parse query strings, allowing nesting, but to treat them as regular query strings instead.

    ```js
    import bodyParser from 'body-parser';
    app.use(bodyParser.urlencoded({
      extended: false
    }));
    app.use(bodyParser.json());
    ```

4. We can use [`cors`](https://github.com/expressjs/cors) to avoid problems with [cross-origin resource sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing). Here we have it set up for simple usage, which enables ALL CORS requests. (This allows us to hit the API server from pages that were served by the dev server.)

    ```js
    import cors from 'cors';
    app.use(cors());
    ```

5. [helmet](https://github.com/helmetjs/helmet) sets a bunch of HTTP headers that protect us. Kind of like a helmet.

    ```js
    import helmet from 'helmet';
    app.use(helmet());
    ```

6. The [cookie-parser]() middleware parses the cookies and dumps them into the Request keyed by name:

    ```js
    import cookieParser from 'cookie-parser';
    app.use(cookieParser());
    ```

7. We have our routes in a separate `routes.js` file that we import and add to our app:

    ```js
    import routes from './routes.js';
    app.use(routes);
    ```

8. We also let Express now that we're behind a proxy server and to trust the X-Forwarded headers:

    ```js
    app.set('trust proxy', 1);
    ```

9. Finally, we start the API server and print a message out to the console:

    ```js
    server.listen(3030, () => {
      const host = server.address().address;
      const port = server.address().port;

      console.log('Api is listening on http://%s:%s', host, port);
    });
    ```

Next we come to the `routes.js` file. This file couldn't be simpler. It just imports and then re-exports the routes, acting as a central place for them. Note the JavaScript 2016 style of having a comma after *every* item in an array or key-value pair in an object. This makes it easier to automate adding items because we don't need to have a special case for the last item.

```js
import Posts from './routes/posts';

export default [
  Posts,
];
```

Let's add our Cards and Topics routes:

```js
import Cards from './routes/cards';
import Posts from './routes/posts';
import Topics from './routes/topics';

export default [
  Cards,
  Posts,
  Topics,
];
```

Now we'll need to add a file in the `/api/routes` folder. We can use the `/api/routes/posts.js` file as a guide:

```js
import Express from 'express';
import wrap from 'express-async-wrap'; // can use async, await

const Router = new Express.Router();

export default [

  // See in /app/redux/modules/posts/posts.js
  Router.get('/api/posts', wrap(async function(req, res) {
    console.log(req.query.testParam); // example

    res.json({
      posts: [ /* ... */ ],
    });
  })),
];
```

We're using [express-async-wrap](https://github.com/Greenfields/express-async-wrap) which gives us JavaScript 2016 (the *next* standard) `async` superpowers. We create an instance of the Express.Router, then add a `GET` route to `/api/posts` and return some JSON (elided for convenience).

So we can make one for cards at `/api/routes/cards.js`:

```js
// api/routes/cards.js
import Express from 'express';
import wrap from 'express-async-wrap';
import { filter, head } from 'ramda';

import { DB } from '../constants';

const Router = new Express.Router();

export default [

  Router.get('/api/cards', wrap(async function(req, res) {
    res.json({
      cards: DB.cards,
    });
  })),

  Router.get('/api/cards/:id', wrap(async function(req, res) {
    const id = parseInt(req.params.id, 10);
    const card = head(filter(c => (c.id === id), DB.cards));

    card
      ? res.json({ card })
      : res.send(404);
  })),
];
```

And another for topics:

```js
// api/routes/topics.js
import Express from 'express';
import wrap from 'express-async-wrap';
import { filter, head } from 'ramda';

import { DB } from '../constants';

const Router = new Express.Router();

export default [

  Router.get('/api/topics', wrap(async function(req, res) {
    res.json({
      topics: DB.topics,
    });
  })),

  Router.get('/api/topics/:id', wrap(async function(req, res) {
    const id = parseInt(req.params.id, 10);
    const topic = head(filter(t => (t.id === id), DB.topics));

    topic
      ? res.json({ topic })
      : res.send(404);
  })),
];
```

If we test our API now, we'll see that we can GET both lists of topics and cards as well as individual topics and cards.

## Running it all

We'll skip the `app` folder for now and we'll come back to it. First, let's see how the configuration works.

In the `bin` folder we have different configuration files for running the API server, the server-side rendering (SSR) server, the production server, the tests, and the webpack dev server. These are controlled by the configuration files in the `webpack` folder and by the scripts in the `package.json` file. Let's look at them one by one. Here are the available scripts (you can use `npm run` to see them all):

1. `npm start`

    This runs:

    ```sh
    rimraf dist && NODE_ENV=development node bin/server.js
    ```

    [`rimraf`](https://github.com/isaacs/rimraf) is the node equivalent of `rm -rf` (get it?), so `rimraf dist` removes the `dist` folder and everything in it.

    Then `NODE_ENV=development` sets the environment to "development" before using node to execute the `bin/server.js` file.

    Let's take a look at that file:

    ```js
    const fs = require('fs');

    const config = JSON.parse(fs.readFileSync('./.babelrc'));
    require('babel-core/register')(config);
    require('../app/server/server.js');
    ```

    What does this do? It reads the `.babelrc` file, passes that as configuration to babel, and then runs the server at `/app/server/server.js`. That server works for both production and development, so . . .

2. `npm run start:prod`

    This time we set the environment to "production" and again call the `/app/server/server.js` file. We'll take a close look at that when we go through the example app.

3. `npm run start-ssr`

    This deletes the `dist` folder and sets the environment to "development", but then it gets a bit tricky.

    First it uses [concurrently](https://github.com/kimmobrunfeldt/concurrently) to kill any previously running servers, then start two at once:

    1. `nodemon --watch app bin/server-ssr.js` runs the `bin/server-ssr.js` file using [nodemon](https://github.com/remy/nodemon), which will restart it automatically, and `--watch` to watch files in the `app` folder and reload them if they change.
    2. `node bin/webpack-server.js` runs the webpack-dev-server.

4. `npm run start-ssr:prod` does the same thing in production mode.

5. We can run the API server using `bin/api.js` *four different ways*:

    1. `npm run api-mon` uses nodemon and `--watch api` to watch for changes in the API server files and to restart the server (mon for monitoring).
    2. `npm run api-mon-debug` sets the `--DEBUG` flag and uses concurrently to run a `node-inspector` on port 3020 (check it out)
    3. `npm run api` just runs the api without watching it for changes, and
    4. `npm run api:prod` runs the api without watching for changes, but in production mode.

6. `npm run build`

    Runs the build using webpack and the configuration file located at `webpack/common.config.js` to build the React app into the `dist` folder.

7. `npm run build:analyze` does the same thing for production, but also runs the [webpack-bundle-size-analyzer](https://github.com/robertknight/webpack-bundle-size-analyzer) to analyze what's making your webpack bundles so big, and you don't want big webpack bundles, do you?

8. `npm test` uses `mocha` and `bin/test.js` to configure things, then looks for `*spec.js` files anywhere in the `app` folder or subfolders. This allows us to put our spec files in with our modules (the code they test).

9. `npm run test:watch` runs the tests as above, but watches for changes in files and re-runs the tests when it finds them.

That's quite a lot. Now let's tackle the app, and we'll look back at some of these files as we go.

Static files go in the `static` folder. Why this folder and a `dist` folder if both are served statically? Well, we're using `rimraf` to delete the `dist` folder before rebuilding, so we need somewhere to keep files we don't want to delete (such as images). We'll set our server up to serve statically from *both* folders seamlessly.

The rest of the front end app sits in the `/app` folder.

## The application

The `/app` folder is organized by function.

1. The `constants` folder holds a few constants we'll need. A glance is sufficient.

2. The `tests` folder does not hold our specifications, but our test setup files. This works together with the `/bin/test.js` file mentioned earlier. That file looks like this:

    ```js
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('./.babelrc'));

    // Ignore scss, remove prop-types, webpack alias
    const ignore = [
      [
        'babel-plugin-transform-require-ignore', {
          extensions: ['.scss'],
        },
      ],
      'react-remove-prop-types', ['babel-plugin-webpack-alias', {
        config: __dirname + '/../webpack/common.config.js',
      }],
    ];

    config.plugins = config.plugins.concat(ignore);
    require('babel-core/register')(config);
    require('asset-require-hook')({
      extensions: ['jpg', 'png'],
    });

    global.__CLIENT__ = false;

    require('../app/test/setup.js');
    ```

    We read in the `.bablerc` file and use it to configure babel, but not before adding configuration for the `ignore` plugin. This is the same thing we need to do when we render things server-side. The [asset-require-hook](https://github.com/aribouius/asset-require-hook) makes sure that our `jpg` and `png` assets get loaded. Tests don't happen in the clients, so we set __CLIENT__ to false, and then we require the `/app/test/setup.js` file:

    ```js
    import React from 'react'; // eslint-disable-line no-unused-vars
    import chai, { expect } from 'chai';
    import sinonChai from 'sinon-chai';
    import sinon from 'sinon';
    import chaiAsPromised from 'chai-as-promised';
    import chaiEnzyme from 'chai-enzyme';
    import { jsdom } from 'jsdom';

    chai.use(sinonChai);
    chai.use(chaiAsPromised);
    chai.use(chaiEnzyme());

    global.document = jsdom('');
    global.window = document.defaultView;
    global.navigator = { userAgent: 'browser' };

    global.React = React;
    global.expect = expect;
    global.sinon = sinon;

    global.fdescribe = (...args) => describe.only(...args);
    global.fit = (...args) => it.only(...args);

    window.matchMedia = window.matchMedia || function () {
      return {
        matches: () => {},
        addListener: () => {},
        removeListener: () => {},
      };
    };
    ```

    This looks very similar to the setup file we used previously. Sinon is used for spies and mocks and stubs. [window.matchMedia](https://developer.mozilla.org/en/docs/Web/API/Window/matchMedia) represents the results of a parsed media query. Here we're just mocking it out if it doesn't exist.

    `fdescribe` and `fit` are used to "focus" (f) tests on particular `describe` or `fit` blocks -- the tests only run on those specs. Learn more about [focused specs](http://jasmine.github.io/2.1/focused_specs.html).

    Meanwhile our `/app/tests/constants/index.js` file provides an initial state, and the `/app/tests/utils/redux.js` file provides a `mountWithStore` function that takes a component and wraps it with a Provider and store: useful in some tests.

3. The `/app/index.js` file is, as usual, the entry point for our client-side app:

    ```js
    import React from 'react';
    import ReactDOM from 'react-dom';
    import { Provider } from 'react-redux';
    import { Router, browserHistory } from 'react-router';
    import configureStore from './redux/store/configureStore';
    import routes from './routes';

    if (__CLIENT__ && __DEVELOPMENT__) {
      // https://facebook.github.io/react/docs/advanced-performance.html
      window.Perf = require('react-addons-perf');
    }

    let initialState;
    try {
      initialState = window.__INITIAL_STATE__; // for server-side-rendering
    } catch (err) {
      initialState = {};
    }

    export const history = browserHistory;

    export const store = configureStore(initialState);

    if (__CLIENT__) {
      ReactDOM.render(
        <Provider store={store}>
          <Router history={history}>
            {routes}
          </Router>
        </Provider>,
        document.getElementById('root')
      );
    }
    ```

    Pretty standard stuff. What the `window.Perf` does is beyond the scope of the course, but you can [learn more](https://facebook.github.io/react/docs/advanced-performance.html) if you're interested. One change thanks to server-side rendering is that we're going to look to see if our initialState has been included in a global `__INITIAL_STATE__` variable, as we saw above. We'll get to the store configuration below. Finally, because we're using this file *Universally* (rendering on *both* the client and the server), we've checked to make sure that we only run *this* `render` call when we're on the client.

4. We load our client-side routes from the `/app/routes.js` file:

    ```js
    import React from 'react';
    import { Route, IndexRoute } from 'react-router';

    import { asyncComponent } from './utils/asyncComponent'; /* for show loading component */

    import Root from './components/Root';
    import Posts from './components/Pages/Posts';
    import About from './components/Pages/About';

    export default (
      <Route path="/" component={Root}>
        <IndexRoute component={Posts} />
        { /* async component */}
        <Route path="/async-example" getComponent={(location, callback) =>
          __CLIENT__
            ? asyncComponent(require.ensure([], require => callback('', require('./components/Pages/AsyncExample').default), 'async-example'))
            : callback('', require('./components/Pages/AsyncExample').default)
        } />

        <Route path="/posts" component={Posts} />
        <Route path="/about" component={About} />
      </Route>
    );
    ```

    There's a bit of tricky stuff going on here around asynchronously loading components. Mostly, it just hides and shows a spinner. It's amazing how we can complicate the simplest things, isn't it? Let's trace it down.

    1. In the `/app/redux/modules/app/app.js` file (whew!), we find two action creators (not actions) that we'll use to change the *state* (in redux) to hide or show the spinner:

        ```js
        export const showSpinnerAsyncPage = () => ({
          type: 'SHOW_SPINNER_ASYNC_PAGE',
        });

        export const hideSpinnerAsyncPage = () => ({
          type: 'HIDE_SPINNER_ASYNC_PAGE',
        });
        ```

    
