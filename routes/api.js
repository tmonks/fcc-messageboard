/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require('mongoose');
const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, required: true, default: Date.now },
  reported: { type: Boolean, required: true, default: false }
});
const Reply = new mongoose.model('Reply', replySchema);
const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  created_on: { type: Date, required: true, default: Date.now },
  bumped_on: { type: Date, required: true, default: Date.now },
  reported: { type: Boolean, required: true, default: false },
  delete_password: { type: String, required: true },
  replies: [ replySchema ]
});
const Thread = new mongoose.model('Thread', threadSchema);

const expect = require('chai').expect;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    // POST new threads to /api/threads/:board
    .post(async (req, res) => {
      //console.log('Thread received for board: ' + req.params.board, req.body);
      const { text, delete_password } = req.body;
      const board = req.params.board;
      if (!text || !delete_password || !board) { 
        res.send("Missing parameter!");
        return;
      };
      
      try {
        const hash = await bcrypt.hash(delete_password, saltRounds);
        const newThread = new Thread({
          board,
          text,
          delete_password: hash
        });
        newThread.save();
        res.send("Thread saved!");
      } catch(err) {
        console.log(err);
        res.send("Error saving new thread to db");
      }

    })
    
    // PUT to report a thread_id
    .put(async (req, res) => {
      const thread_id = req.body.thread_id;
      if(!thread_id) {
        res.send("Missing thread_id");
        return;
      }
      console.log("Report request received for ", thread_id);
    
      try {
        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send("success");  
      } catch(err) {
        console.log(err);
        res.send("Error reporting thread");
      }
    })
  
    // DELETE a thread_id
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      if(!thread_id || !delete_password) {
        res.send("Missing parameter");
        return;
      }
      
      try {
        const thread = await Thread.findById(thread_id);
        //console.log("attempting to delete thread: " + thread_id + " " + thread.text + " with pw " + delete_password);
        if(await bcrypt.compare(delete_password, thread.delete_password)) {
          //console.log("Password matches, deleting thread");
          await Thread.findByIdAndDelete(thread_id);
          res.send("success");
        } else {
          res.status(403).send("incorrect password");
        }
      } catch(err) {
        console.log(err);
        res.send("Error deleting thread");
      }
    })
    // GET 10 most recent bumped threads with 3 most recent replies
    .get(async (req, res) => {
      const board = req.params.board;
      if(!board) { 
        res.send("Missing board parameter");
        return;
      }
    
      //console.log("GET request received for board " + board);
      
      try {
        const results = await Thread.find(
          { board }, 
          { 
            delete_password: 0,
            reported: 0,
            replies: { $slice: -3 }, 
            "replies.delete_password": 0,
            "replies.reported": 0
          })
          .sort({ bumped_on: -1 })
          .limit(10)
          //.select({ delete_password: 0, reported: 0 });
        
        res.json(results);
      } catch(err) {
        console.log(err);
        res.send("Error retrieving thread");
      }
      
    });
  
    
  app.route('/api/replies/:board')
    // POST a new reply to thread_id
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const board = req.params.board;
      //console.log('Reply received for board: ' + board, req.body);
      if(!text || !delete_password || !thread_id || !board) {
        res.send("Missing parameter!");
        return;
      }
    
      try {
        const hash = await bcrypt.hash(delete_password, saltRounds);
        const newReply = new Reply({ text, delete_password: hash, reported: false})
        
        // Classic way of find, update, then save
        // const thread = await Thread.findById(thread_id);
        // thread.replies.push(newReply);
        // thread.bumped_on = newReply.created_on;
        // await thread.save();
        
        await Thread.findByIdAndUpdate(
          thread_id, 
          { 
            "bumped_on": newReply.created_on, 
            "$push": { "replies": newReply }
          });
        
        //console.log("Reply saved to " + thread_id + " successfully!");
        res.send("Reply saved!");
      } catch(err) {
        console.log(err);
        res.send("Error saving new reply to db");
      }
    })

    // PUT a reply_id and thread_id to report a reply
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      if(!thread_id || !reply_id) {
        res.send("Missing parameter");
        return;
      }
      //console.log("Received report request for ", thread_id, reply_id);
    
      try {
        const thread = await Thread.findByIdAndUpdate(thread_id);
        const reply = thread.replies.id(reply_id);
        if(!reply) { throw new Error("thread not found"); }
        reply.reported = true;
        await thread.save();
        //console.log("Updated reply: ", reply);
        res.send("success");
      } catch(err) {
        console.log(err);
        res.send("Error reporting thread");
      }
    })
  
    // DELETE a reply_id from thread_id
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      if(!thread_id || !reply_id || !delete_password ) {
        res.send("Missing parameter");
        return;
      }
      //console.log("Received delete request for ", thread_id, reply_id);
    
      try {
        const thread = await Thread.findById(thread_id);
        const reply = thread.replies.id(reply_id);
        if(await bcrypt.compare(delete_password, reply.delete_password)) {
          reply.text = "[deleted]";
          await thread.save();
          res.send("success");
        } else {
          res.status(403).send("incorrect password");
        }
      } catch(err) {
        console.log(err);
        res.send("Error deleting reply");
      } 
    })
    // GET entire thread for thread_id
    .get(async (req, res) => {
      const board = req.params.board;
      const thread_id = req.query.thread_id;
      if(!board) { 
        res.send("Missing board parameter");
        return;
      }
    
      //console.log("GET request received for board " + board + " and thread " + thread_id);
      
      try {
        const results = await Thread.findById(thread_id, { 
          delete_password: 0, 
          reported: 0, 
          "replies.delete_password": 0,
          "replies.reported": 0
        });
        res.json(results);
      } catch(err) {
        console.log(err);
        res.send("Error retrieving thread");
      }
    });
  

};
