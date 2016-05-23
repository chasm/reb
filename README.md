# React/Redux Intermediate final class

**Server-side rendering and boilerplate/starter kits**

Here are the notes for the final class.

We'll use the [redux-easy-boilerplate](https://github.com/anorudes/redux-easy-boilerplate.git) to get a head start. I'll take you through the kit and explain what it does.

First, clone the app, `cd` into the folder, and run `npm install`. You'll also need to instal nodemon and concurrently:

```sh
git clone https://github.com/anorudes/redux-easy-boilerplate.git reb && cd reb
npm install
npm i -g nodemon concurrently
```

This kit is under heavy development. These notes are current as of commit 5bcac18a9b90dd8363ad1277b2ac96cee8d5e1cd. You might want to check it out just to make sure you have the same code:

```sh
git checkout 5bcac18a9b90dd8363ad1277b2ac96cee8d5e1cd
```

Now we can run the sample app. First we'll start the API server in one terminal tab:

```sh
npm run api-debug
```

This runs the api on [localhost:3030/api/posts](http://localhost:3030/api/posts) and a debugger on [localhost:5858](http://localhost:5858/).

Then, in a second tab, we'll start the development server:

```sh
npm start
```

This runs the app on [localhost:3000/](http://localhost:3000/). Finally, we can open a third terminal tab and run the tests in watch mode:

```sh
npm run test:watch
```

This will rerun the test anytime we save changes to a file.

From the application page, open the Page Source to look at the HTML sent from the server. You should see something like this in the `<body>`:

```html
<div id="root"></div>

<script>
  window.__INITIAL_STATE__ = {};
</script>

<script src="http://localhost:3000/dist/vendor.js"></script>
<script src="http://localhost:3000/dist/main.js"></script>
```

The page loads our app in a bundle called `main.js`, and then React renders the app into the above `<div>` element. This happens *after* the page loads.

Now stop the dev server with Ctrl-c and start the server-side-rendering version:

```sh
npm run start-ssr
```

Reload the page source and you'll see this in the `<body>` element instead:

```html
<div id="root"><section data-reactroot="" data-reactid="1" data-react-checksum="-554999873"><!-- react-empty: 2 --><div class="header" data-reactid="3"><ul class="header__menu" data-reactid="4"><li data-reactid="5"><a href="/posts" data-reactid="6">Posts</a></li><li data-reactid="7"><a href="/about" data-reactid="8">About</a></li><li data-reactid="9"><a href="/async-example" data-reactid="10">Async page example</a></li></ul></div><section class="posts" data-reactid="11"><!-- react-empty: 12 --><h1 data-reactid="13">Posts page</h1><div class="posts__list" data-reactid="14"><div class="post__item" data-reactid="15"><!-- react-text: 16 -->1<!-- /react-text --><!-- react-text: 17 -->) <!-- /react-text --><!-- react-text: 18 -->example 1<!-- /react-text --></div><div class="post__item" data-reactid="19"><!-- react-text: 20 -->2<!-- /react-text --><!-- react-text: 21 -->) <!-- /react-text --><!-- react-text: 22 -->example 2<!-- /react-text --></div><div class="post__item" data-reactid="23"><!-- react-text: 24 -->3<!-- /react-text --><!-- react-text: 25 -->) <!-- /react-text --><!-- react-text: 26 -->example 3<!-- /react-text --></div></div></section></section></div>

<script>
  window.__INITIAL_STATE__ = {"app":{"spinnerAsyncPage":false},"posts":{"items":[{"id":"1","text":"example 1"},{"id":"2","text":"example 2"},{"id":"3","text":"example 3"}]}};
</script>

<script src="http://localhost:3001/dist/vendor.js"></script>
<script src="http://localhost:3001/dist/main.js"></script>
```

Note that the HTML for the page has already been rendered, and that the data needed has been added to a global variable called `__INITIAL_STATE__`. This means no waiting on the client side: the page renders immediately upon loading. When the React bundle(s) finish loading, React takes over and from there on out the application becomes a single-page application (SPA).

Server-side rendering like this using mostly the same code that's used to build the components on the client side is called "Universal JavaScript" (or, sometimes, "Isomorphic JavaScript"). The Universal name is easier to remember and understand, and seems to be catching on quickly.

Shut the server-side rendering mode off with `Control-c` and then restart the dev server with `npm start`. Now let's take a run through the code and see where everything is.

In the folder structure the first folder is called `api` and holds the code for the Express server used to produce the JSON REST API on port 3030.

The server code is located in the `api/index.js` file. Here's what it does:

1. First we import `Express` and create a new `app` with `new Express()`. Then we import `http` and create an instance of a server, passing our Express app to it:

    ```js
    import Express from 'express';
    import http from 'http';

    const app = new Express();
    const server = new http.Server(app);
    ```

2. Next we use `morgan` for logging. We import it and `fs` for use with the filesystem. We set the path to the logs, create a write stream that appends to the log file (the 'a' flag), and then add the logger as middleware to Express, telling it to combine the standard and error outputs into one log:

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

8. We also let Express know that we're behind a proxy server and to trust the `X-Forwarded-*` headers: "Although the app will not fail to run if the application variable trust proxy is not set, it will incorrectly register the proxy’s IP address as the client IP address unless trust proxy is configured."

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

Now we'll need to add our route files in the `/api/routes` folder. We can use the `/api/routes/posts.js` file as a guide:

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

So we can make one for cards at `/api/routes/cards.js`. Let's add a route to GET an individual card as well.

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

Conveniently, `ramda` is already installed. We'll use the `filter` method to grab the rows with the passed in `id`, then the `head` method to grab the first item in the returned array. Of course, there should be only one item with that `id`. The `:id` parameter is passed in by Express as `req.params.id`, but remember that it's a string, so we'll need to parse it to a base 10 integer with `parseInt`. If we find the card, we return it as `json` using the object shorthand (instead of `{ card: card }` we can do simply `{ card }` and get the same result). If we don't find the card, then we'll return a 404 Not Found.

And another route file for  the topics:

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

And we'll need to add our JSON to the `/api/constants/index.js` file:

```js
// api/constants/index.js
export const DB = {
  topics: [
    {
      id: 1,
      title: 'Literary Devices',
    },
    {
      id: 2,
      title: 'Famous Dogs',
    },
  ],
  cards: [
    {
      id: 1,
      topicId: 1,
      word: 'Accumulation',
      definition: 'Accumulation is derived from a Latin word which means "pile up". It is a stylistic device that is defined as a list of words which embody similar abstract or physical qualities or meanings with the intention to emphasize the common qualities that words hold. It is also an act of accumulating the scattered points. Accumulation examples are found in literary pieces and in daily conversations.',
      example: 'Then shall our names,<br>Familiar in his mouth as household words,<br>Harry the King, Bedford and Exeter,<br>Warwick and Talbot, Salisbury and Gloucester,<br>Be in their flowing cups freshly remembered',
      misses: 0,
      hits: 0,
    },
    {
      id: 2,
      topicId: 1,
      word: 'Ballad',
      definition: 'The word Ballad is of French provenance. It is a type of poetry or verse which was basically used in dance songs in the ancient France. Later on, during the late 16th and 17th century, it spread over the majority of European nations. Owing to its popularity and emotional appeal, it remained a powerful tool for poets and lyricists to prepare music in the form of lyrical ballads and earn a handsome income from it.',
      example: 'Day after day, day after day<br>We stuck nor breathe, nor motion;<br>As idle as a painted ship<br>Upon a painted ocean',
      misses: 0,
      hits: 0,
    },
    {
      id: 3,
      topicId: 1,
      word: 'Cacophony',
      definition: 'If we speak literally, cacophony points to a situation where there is a mixture of harsh and inharmonious sounds. In literature, however, the term refers to the use of words with sharp, harsh, hissing and unmelodious sounds primarily those of consonants to achieve desired results.',
      example: 'I detest war because cause of war is always trivial.',
      misses: 0,
      hits: 0,
    },
    {
      id: 4,
      topicId: 1,
      word: 'Dactyl',
      definition: 'Dactyl is a metrical foot, or a beat in a line, containing three syllables in which first one is accented followed by second and third unaccented syllables (accented/unaccented/unaccented) in quantitative meter such as in the word "humanly." In dactyl, we put stress on first syllable and do not stress on second and third syllables, try to say it loud-"HU-man-ly." Dactyl originates from a Greek word dáktylos, which means finger, because it is like bones of human fingers, beginning from central long knuckle, which is followed by two short bones.',
      example: '<b>Half</b> a league, <b>half</b> a league,<br><b>Half</b> a league <b>on</b>ward,<br><b>All</b> in the <b>val</b>ley of <b>Death</b> <br><b>Rode</b> the six <b>hun</b>dred.<br>"<b>For</b>ward, the <b>Light</b> Brigade!<br><b>Charge</b> for the <b>guns</b>!" he said.<br><b>In</b>to the <b>val</b>ley of <b>Death</b><br><b>Rode</b> the six <b>hun</b>dred.',
      misses: 0,
      hits: 0,
    },
    {
      id: 5,
      topicId: 1,
      word: 'Elegy',
      definition: 'Elegy is a form of literature which can be defined as a poem or song in the form of elegiac couplets, written in honor of someone deceased. It typically laments or mourns the death of the individual.',
      example: 'My Captain does not answer, his lips are pale and still;<br>My father does not feel my arm, he has no pulse nor will;<br>The ship is anchor’d safe and sound, its voyage closed and done;<br>From fearful trip, the victor ship, comes in with object won;<br>Exult, O shores, and ring, O bells!<br>But I, with mournful tread,<br>Walk the deck my Captain lies,<br>Fallen cold and dead.',
      misses: 0,
      hits: 0,
    },
    {
      id: 6,
      topicId: 1,
      word: 'Fable',
      definition: 'The word fable is derived from a Latin word "fibula" which means a story that is a derivative of a word "fari" which means to speak. Fable is a literary device which can be defined as a concise and brief story intended to provide a moral lesson at the end.',
      example: 'Now, comrades, what is the nature of this life of ours? Let us face it: our lives are miserable, laborious, and short. We are born, we are given just so much food as will keep the breath in our bodies… and the very instant that our usefulness has come to an end…. No animal in England knows the meaning of happiness or leisure after he is a year old. No animal in England is free. The life of an animal is misery and slavery….',
      misses: 0,
      hits: 0,
    },
    {
      id: 7,
      topicId: 1,
      word: 'Genre',
      definition: 'Genre means the type of art, literature or music characterized by a specific form, content and style. For example, literature has four main genres; poetry, drama, fiction and non-fiction. All of these genres have particular features and functions that distinguish them from one another. Hence, it is necessary on the part of readers to know which category of genre they are reading in order to understand the message it conveys, as they may have certain expectations prior to the reading concerned.',
      example: '',
      misses: 0,
      hits: 0,
    },
    {
      id: 8,
      topicId: 1,
      word: 'Haiku',
      definition: 'A haiku poem has three lines, where the first and last lines have five moras, while the middle line has seven. The pattern in Japanese genre is 5-7-5. The mora is another name of a sound unit, which is like a syllable, but it is different from a syllable. As the moras cannot be translated into English, they are modified and syllables are used instead. The lines of such poems rarely rhyme with each other.',
      example: 'Autumn moonlight-<br>a worm digs silently<br>into the chestnut.',
      misses: 0,
      hits: 0,
    },
    {
      id: 9,
      topicId: 1,
      word: 'Iamb',
      definition: 'An iamb is a literary device that can be defined as a foot containing unaccented and short syllables followed by a long and accented syllable in a single line of a poem (unstressed/stressed syllables). Two of Robert Frost`\'`s poems <i>Dust of Snow</i> and <i>The Road not Taken</i> are considered two of the most popular examples of iamb.',
      example: 'Has <b>giv</b>en my <b>heart</b><br>A <b>change</b> of <b>mood</b><br>And <b>saved</b> some <b>part</b><br>Of a <b>day</b> I had <b>rued</b>.',
      misses: 0,
      hits: 0,
    },
    {
      id: 10,
      topicId: 1,
      word: 'Jargon',
      definition: 'Jargon is a literary term that is defined as a use of specific phrases and words by writers in a particular situation, profession or trade. These specialized terms are used to convey hidden meanings accepted and understood in that field. Jargon examples are found in literary and non-literary pieces of writing.',
      example: 'Certain medications can cause or worsen nasal symptoms (especially congestion). These include the following: birth control pills, some drugs for high blood pressure (e.g., alpha blockers and beta blockers), antidepressants, medications for erectile dysfunction, and some medications for prostatic enlargement. If rhinitis symptoms are bothersome and one of these medications is used, ask the prescriber if the medication could be aggravating the condition.',
      misses: 0,
      hits: 0,
    },
  ],
  count: 0,
};
```

We'll probably need to restart our API server. If we test our API now, we'll see that we can GET both lists of [topics](http://localhost:3030/api/topics) and [cards](http://localhost:3030/api/cards) as well as individual [topics](http://localhost:3030/api/topics/1) and [cards](http://localhost:3030/api/cards/4). If we try a [non-existent topic](http://localhost:3030/api/topics/5) we should get a 404 Not Found error.

So our REST JSON API server is actually quite simple.

## The React/Redux application

Let's take a look in the `app` folder next. Here we should see these folders and files:

```
components/
constants/
redux/
server/
test/
utils/
index.js
routes.js
```

Let's take each one at a time. The first folder is the `components` folder. This, as before, is where our React components live. In this instance, the developer has made no distinction between components and containers. Instead, he has organized the components into three subfolders:

```
Modules/
Pages/
Root/
```

The Root folder is the root of our React app. It contains the following:

```
styles/
    app.scss
    normalize.css
    typography.scss
index.js
```

What we care about is the `index.js` file. After the imports, it uses a `require` call to import the stylesheet for the app. Webpack does this for us.

The tricky part is this code:

```js
// in app/components/Root/index.js
@connect(
  state => ({ ...state.app }),
  dispatch => bindActionCreators({
    ...actionCreators.app,
  }, dispatch),
)
```

This is an ES7 decorator. We need to use the `stage-0` babel presets to get this. Actually, I think we need to add more than that now as they were removed from babel 6. Yep. If you check the `package.json` file you'll see that `babel-plugin-transform-decorators-legacy` is listed as a dependency.

What this does is exactly the same as this:

```js
// the old way to do it . . .
const mapStateToProps = state => {
  return { ...state.app }
}

const mapDispatchToProps = dispatch => bindActionCreators({
  ...actionCreators.app,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Root)
```

Instead of creating the `mapStateToProps` and `mapDispatchToProps` functions as above, they are passed to `connect` as anonymous functions. And instead of calling connect with them and then immediately calling the function returned and passing it the Root component, we use the ``@connect()`` decorator syntax, placing it *immediately above* the class it decorates.

The precise syntax for this language feature is still being argued, but annotations/decorators are very popular in many other languages, so I would expect that they will become common in JavaScript soon.

The `bindActionCreators` method is provided by `redux`. It takes the action creators imported from `/app/redux/modules/index.js` and binds them to the `dispatch` function. This causes the action creators to be passed in as props to the Root container. Now we can call them as we do in the lifecycle methods:

```js
// in app/components/Root/index.js
componentDidMount() {
  const { hideSpinnerAsyncPage } = this.props;

  hideSpinnerAsyncPage();
}

componentDidUpdate(prevProps) {
  const { hideSpinnerAsyncPage } = this.props;

  if (prevProps.spinnerAsyncPage === true) {
    hideSpinnerAsyncPage();
  }
}
```

As you can see, this updates the Redux store to set the `spinnerAsyncPage` key to `false`:

```js
// in /app/redux/modules/app/app.js
const initialState = {
  spinnerAsyncPage: false,
};

export default createReducer({
  ['HIDE_SPINNER_ASYNC_PAGE']: () => ({
    spinnerAsyncPage: false,
  }),
}, initialState);

export const hideSpinnerAsyncPage = () => ({
  type: 'HIDE_SPINNER_ASYNC_PAGE',
});
```

Now when we call `hideSpinnerAsyncPage()` in our Root component, it will dispatch this action to the reducer:

```js
{
  type: 'HIDE_SPINNER_ASYNC_PAGE'
}
```

Which sets `spinnerAsyncPage` to 'false'. In the `render` call below, this value (added to the props by this line: `state => ({ ...state.app })`) is used to determine whether to load the spinner or the page:

```js
// in app/components/Root/index.js
{
  spinnerAsyncPage
    ? <Loading /> // show spinner for async component
    : this.props.children &&
        React.cloneElement(this.props.children, this.props)
}
```

Another interesting JavaScript 2015 trick is the `static` keyword:

```js
// in app/components/Root/index.js
static propTypes = {
  location: PropTypes.object,
  children: PropTypes.object,
  params: PropTypes.object,
  history: PropTypes.object,
  spinnerAsyncPage: PropTypes.bool,
  hideSpinnerAsyncPage: PropTypes.func,
};
```

Note: the last I heard, the semicolon after the static assignment is required. The alternative is to assign the `propTypes` outside of the class declaration:

```js
Root.propTypes = {
  ...
}
```

If you're using a pure function, then outside is the way to go. I actually prefer it that way, as it puts the prop type declarations down at the bottom of the file out of the way. This is the same reason that I prefer to do the export at the very bottom of the file. That way I don't have to scan a whole file looking for exports&mdash;they are always the very last line in the file.

The last thing of interest in the `/app/components/Root/index.js` file is this line:

```js
// in app/components/Root/index.js
<Helmet
  title="posts"
/>
```

This uses [react-helmet](https://github.com/nfl/react-helmet) to "manage the `<head>`" of the document. This line will cause the `<title>` element in the HTML `<head>` section to be "posts".

The Root component imports the Loading and Header components, so let's look at those next:

```js
// in app/components/Root/index.js
import Loading from 'components/Modules/Loading';
import Header from 'components/Modules/Header';
```

A quick check of these two files reveals that they are simple to understand. The Loader simply returns a spinner image, and the Header an unordered list with three `react-router` links. Nothing to see here, move along, move along.

The Pages folder contains the About, AsyncExample, and Posts page components.

The About page contains an interesting bit of code:

```js
// in app/components/Pages/About/index.js
// Get window height if client (just for example)
// Why need?
// Just try remove __CLIENT__ check and start server-side-rendering
const windowHeight = __CLIENT__ ? window.innerHeight : null;

return (
  <section className="about">
    <Helmet
      title="about"
    />
    <h1>Example page</h1>
    window height = {windowHeight} (see __CLIENT__ condition in code)<br />

    <img src="/static/images/example.jpg" />
  </section>
);
```

What's going on here? First we set a `windowHeight` constant, but we use a ternary operator and check the value of the `__CLIENT__` variable first. If `__CLIENT__` returns truthy, we set it to `window.innerHeight`; if it doesn't, we set it to null. Then we output the value in our page.

What is the point of this? When the page is rendered server side, *there is no window because there is no browser*. So we can't measure `innerHeight`. Once the page is rendered on the client, however, and React finishes loading, it will re-render the page. This time `__CLIENT__` will by truthy and we'll get the value of the window's height.

If we're *not* rendering server side, then this code won't render until it's in the browser and it will just work. For normal React without server-side rendering, we wouldn't bother with the `__CLIENT__` variable.

Try removing the variable and just using `window.windowHeight` in the render method, and then running the server-side rendering to see what the difference is.

We'll come back to the AsyncExample page when we discuss the redux middleware and the router.

The Posts page is a bit more interesting. We have the same `@connect` decorator as in the Root container (which makes the Post component a container as well), but using the `posts` state and the `posts` action creators:

```js
// in app/components/Pages/Posts/index.js
componentDidMount() {
  console.log('props', this.props);
  const { apiGetPosts } = this.props;

  // Get posts from api server
  // See in '/app/redux/modules/posts/posts.js' and  '/api/routes/posts.js'

  apiGetPosts();
}
```

Once the component is mounted, `apiGetPosts()` is called. This is an action creator from the `/app/redux/modules/posts/posts.js` file. The `posts` reducer handles three actions:

- GET_POSTS_REQUEST when the AJAX request to the API is first sent. This sets the state's `items` key to an empty array.
- GET_POSTS_SUCCESS called if the AJAX request returns successfully. This receives a payload of the Post items as JSON and sets the state's `item` key to the returned posts.
- GET_POSTS_FAILURE console logs an error. Oddly, it does not return the state unchanged, which seems like an error in the code to me. But what do I know?

```js
// in app/redux/modules/posts/posts.js
export default createReducer({
  ['GET_POSTS_REQUEST']: state => ({
    ...state,
    items: [],
  }),
  ['GET_POSTS_SUCCESS']: (state, { payload }) => ({
    ...state,
    items: payload.posts,
  }),
  ['GET_POSTS_FAILURE']: () => console.log('error')
}, initialState);
```

All of these are called by one action creator: `apiGetPosts`:

```js
// in app/redux/modules/posts/posts.js
export const apiGetPosts = () => ({
  mode: 'GET',
  type: 'GET_POSTS',
  url: 'posts',
  data: { testParam: 'test' },
  onSuccess: res => { console.log(res); },
  onFailure: res => { console.log(res); },
  callback: res => { console.log(res); }
});
```

What on Earth does this do? It doesn't make any sense at all at first glance? Isn't this supposed to do some AJAX, then pass the response payload to the reducer so it can be inserted into the state? But there's none of that here. It's just returns an object with some data and a few methods.

The trick is that this gets passed through the reducer *middleware*. When we get to the store, we'll see these lines:

```js
// in app/redux/store/configureStore.js
const middlewares = [
  apiMiddleware,
  promiseMiddleware(),
  thunkMiddleware,
  !__PRODUCTION__ && __CLIENT__ && logger,
].filter(Boolean);
```

See the `apiMiddleware`? That is imported from `/app/redux/middleware/api.js`. It looks like this:

```js
// in app/redux/middleware/api.js
export const apiMiddleware = store => next => action => {
  if (action.url) {

    // Generate promise
    const requestPromise = action.mode === 'GET'
      ? request.get(API_URL + action.url)
        .query({ // add query (if get)
          ...action.data,
        })
      : request.post(API_URL + action.url)
        .send({ // add body (if post)
          ...action.data,
        });

    next({
      type: action.type,
      payload: {
        promise: requestPromise
          .promise()
          .then(res => res.body)
          .catch(res => {
            const data = res.res;
            if (action.callback) {
              action.callback(data, store.dispatch);
            }
            if (action.onFailure) {
              action.onFailure(data, store.dispatch);
            }
          })
          .tap(res => {
            if (action.callback) {
              setTimeout(() => action.callback(res, store.dispatch), 10);
            }
          })
          .tap(res => {
            if (action.onSuccess) {
              action.onSuccess && action.onSuccess(res, store.dispatch);
            }
          }),
        data: { ...action.data },
      },
    });
  } else {
    next(action);
  }
};
```

Let's take it one bit at a time. See this line?

```js
export const apiMiddleware = store => next => action => {
```

This says that the apiMiddleware is a function that takes a `store` parameter and returns a *function* that takes a `next` parameter and returns yet another *function* that takes an `action` parameter and returns whatever is between the following braces. In fact, it doesn't "return" anything at all. The `next` parameter is a callback function and when the final function is called, it calls the next function.

Looking at the body we can see that it does one thing if there is a truthy `url` key in the `action` object, and another if there isn't. If there is no `url` included in the action, then it just calls the `next` callback and passes it the action unchanged. So the apiMiddleware *only runs if it finds a URL in the action*. Got it? If it doesn't, the action gets passed on to the reducers unchanged.

But if it *does* have a URL? Well, then we're going to use `superagent-bluebird-promise`, which is a lovely combination of the `superagent` AJAX library with the `bluebird` promise library. We can import it as `request`, and then call `get` and `post` methods just as we would on a regular `superagent` request (kind of like jQuery's `$.ajax`). But instead of passing in a callback, it returns a promise. Here we check wether the action calls for a GET or POST and then return the appropriate promise. For the GET we put the data to send in the query string; for the POST we put it in the body.

Now we create a *new* Redux action, setting the `type` to the same `type` as was passed in, setting the `data` to be a copy of the `data` passed in, but adding as the payload the promise we made to make an AJAX call.

But this *still* doesn't look like anything we'd want to send to the reducer. No worries, it gets passed through the `promiseMiddleware` next.

(To be continued. The notes below are an older version and will be re-written soon, I hope.)

## Running it all

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

        No payload, just a type. Calling these functions returns an action, which can be passed to `dispatch` to update the state of the app.

    2. We also have an initialState, set to false, of course.

        ```js
        const initialState = {
          spinnerAsyncPage: false,
        };
        ```

    3. Now we want to create a reducer that will respond to these two hide and show actions. There is a handy-dandy `createReducer` function that does exactly that:

        ```js
        export default createReducer({
          ['SHOW_SPINNER_ASYNC_PAGE']: () => ({ // show spinner when async component began to load from server
            spinnerAsyncPage: true,
          }),

          ['HIDE_SPINNER_ASYNC_PAGE']: () => ({ // hide spinner after loading component from server
            spinnerAsyncPage: false,
          }),
        }, initialState);
        ```

        This function takes an object with keys that are action types, and values that are functions that update the state accordingly. Here they set `spinnerAsyncPage` to true or false as needed. How does this work? We'll the function is defined in `/app/redux/utils/createReducer.js`:

        ```js
        import R from 'ramda';

        export const createReducer = (handlers, initialState) =>
          (state = initialState, action = {}) => {
            return R.propIs(Function, action.type, handlers)
                ? handlers[action.type](state, action)
                : state;
          };
        ```

        `propIs` is a neat little Ramda function that takes a *type*&mdash;e.g., Number, String, etc.&mdash;a key (here an action type), and an object in which that key might be found and returns true if the value of that key is the type passed, false otherwise. So in this instance, `propIs` checks to see if the value of the key equal to the `action.type` is a Function. If it is, then it calls that function and passes the state and action and returns whatever the function returns (that becomes the new state). If the key is not found or the value is not a Function, then it returns the state unchanged. This should sound familiar: it's what reducers do.

        Here we can ignore the state and the action. All we have to do is change the `spinnerAsyncPage` value from true to false and back again. Easy peasy. And that's how the app's async reducer works.
