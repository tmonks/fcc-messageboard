/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const bcrypt = require("bcrypt");
const saltRounds = 10;

const mongoose = require("mongoose");
const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, required: true, default: Date.now },
  reported: { type: Boolean, required: true, default: false }
});
const Reply = new mongoose.model("Reply", replySchema);
const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  created_on: { type: Date, required: true, default: Date.now },
  bumped_on: { type: Date, required: true, default: Date.now },
  reported: { type: Boolean, required: true, default: false },
  delete_password: { type: String, required: true },
  replies: [replySchema]
});
const Thread = new mongoose.model("Thread", threadSchema);

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    // POST new threads to /api/threads/:board
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      if (!text || !delete_password || !board) {
        res.send("Missing parameter!");
        return;
      }

      try {
        const hash = await bcrypt.hash(delete_password, saltRounds);
        const newThread = new Thread({
          board,
          text,
          delete_password: hash
        });
        newThread.save();
        res.redirect("/b/" + board + "/");
      } catch (err) {
        console.log(err);
        res.send("Error saving new thread to db");
      }
    })

    // PUT to report a thread_id
    .put(async (req, res) => {
      const thread_id = req.body.thread_id;
      if (!thread_id) {
        res.send("Missing thread_id");
        return;
      }

      try {
        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send("success");
      } catch (err) {
        console.log(err);
        res.send("Error reporting thread");
      }
    })

    // DELETE a thread_id
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      if (!thread_id || !delete_password) {
        res.send("Missing parameter");
        return;
      }

      try {
        const thread = await Thread.findById(thread_id);
        if (await bcrypt.compare(delete_password, thread.delete_password)) {
          await Thread.findByIdAndDelete(thread_id);
          res.send("success");
        } else {
          // fcc-back-end-tester.glitch.me seems to expect a status of 200 here
          res.status(200).send("incorrect password");
        }
      } catch (err) {
        console.log(err);
        res.send("Error deleting thread");
      }
    })
  
    // GET 10 most recent bumped threads with 3 most recent replies
    .get(async (req, res) => {
      const board = req.params.board;
      if (!board) {
        res.send("Missing board parameter");
        return;
      }

      try {
        const results = await Thread.find(
          { board },
          {
            delete_password: 0,
            reported: 0,
            replies: { $slice: -3 },
            "replies.delete_password": 0,
            "replies.reported": 0
          }
        )
          .sort({ bumped_on: -1 })
          .limit(10);

        res.json(results);
      } catch (err) {
        console.log(err);
        res.send("Error retrieving thread");
      }
    });

  
  app
    .route("/api/replies/:board")
    
    // POST a new reply to thread_id
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const board = req.params.board;
      if (!text || !delete_password || !thread_id || !board) {
        res.send("Missing parameter!");
        return;
      }

      try {
        const hash = await bcrypt.hash(delete_password, saltRounds);
        const newReply = new Reply({
          text,
          delete_password: hash,
          reported: false
        });

        await Thread.findByIdAndUpdate(thread_id, {
          bumped_on: newReply.created_on,
          $push: { replies: newReply }
        });

        res.redirect("/b/" + board + "/" + thread_id + "/");
      } catch (err) {
        console.log(err);
        res.send("Error saving new reply to db");
      }
    })

    // PUT a reply_id and thread_id to report a reply
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      if (!thread_id || !reply_id) {
        res.send("Missing parameter");
        return;
      }

      try {
        const thread = await Thread.findById(thread_id);
        const reply = thread.replies.id(reply_id);
        if (!reply) {
          throw new Error("reply not found");
        }
        reply.reported = true;
        await thread.save();
        res.send("success");
      } catch (err) {
        console.log(err);
        res.send("Error reporting reply");
      }
    })

    // DELETE a reply_id from thread_id
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      if (!thread_id || !reply_id || !delete_password) {
        res.send("Missing parameter");
        return;
      }

      try {
        const thread = await Thread.findById(thread_id);
        const reply = thread.replies.id(reply_id);
        if (await bcrypt.compare(delete_password, reply.delete_password)) {
          reply.text = "[deleted]";
          await thread.save();
          res.send("success");
        } else {
          // fcc-back-end-tester.glitch.me seems to expect a status of 200 here
          res.status(200).send("incorrect password");
        }
      } catch (err) {
        console.log(err);
        res.send("Error deleting reply");
      }
    })
  
    // GET entire thread for thread_id
    .get(async (req, res) => {
      const board = req.params.board;
      const thread_id = req.query.thread_id;
      if (!board) {
        res.send("Missing board parameter");
        return;
      }

      try {
        const results = await Thread.findById(thread_id, {
          delete_password: 0,
          reported: 0,
          "replies.delete_password": 0,
          "replies.reported": 0
        });
        res.json(results);
      } catch (err) {
        console.log(err);
        res.send("Error retrieving thread");
      }
    });
};
