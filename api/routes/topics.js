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
