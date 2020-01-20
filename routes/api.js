/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const mongoose = require('mongoose');
const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_pw: { type: String, required: true }
});
const Reply = new mongoose.model('Reply', replySchema);
const threadSchema = new mongoose.Schema({ 
  text: { type: String, required: true },
  created_on: { type: Date, required: true, default: Date.now },
  bumped_on: { type: Date, required: true, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true },
  replies: [ replySchema ]
});
const Thread = new mongoose.model('Thread', threadSchema);

const expect = require('chai').expect;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      console.log('POST received for board: ' + req.params.board, req.body);
      const { text, delete_password } = req.body;
      const board = req.params.board;
      if (!text || !delete_password || !board) { 
        res.send("Missing parameter!");
        return
      };
      
      const newThread = new Thread({ 
        text,
        delete_password
      });
    
      try {
        newThread.save();
        res.send("Thread saved!");
      } catch(err) {
        console.log(err);
        res.send("Error saving new thread to db");
      }

    });
    
  app.route('/api/replies/:board');

};
