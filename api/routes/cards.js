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
