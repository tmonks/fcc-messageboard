/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    let thread_id;
    const delete_password = 'Password123';
    // let thread_count;
    
    suite('POST', function() {
      test('POST new thread', done => {
        chai.request(server)
          .post('/api/threads/testing')
          .send({ text: 'test thread', delete_password })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('GET list of threads', done => {
        chai.request(server)
          .get('/api/threads/testing')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'An array is returned');
            assert.isAtLeast(res.body.length, 1, 'At least one thread is returned');
            assert.isAtMost(res.body.length, 10, 'At most 10 threads are returned');
            assert.property(res.body[0], '_id', 'Threads have _id property');
            assert.property(res.body[0], 'text', 'Threads have text property');
            assert.property(res.body[0], 'created_on', 'Threads have created_on property');
            assert.property(res.body[0], 'bumped_on', 'Threads have bumped_on property');
            assert.notProperty(res.body[0], 'delete_password', 'delete_password property is hidden');
            assert.notProperty(res.body[0], 'reported', 'reported property is hidden');
            thread_id = res.body[0]._id;
            // thread_count = res.body.length;
            console.log("Working with " + thread_id);
            done();
          });
      })
    });
    
    suite('PUT', function() {
      
      test('PUT to report a thread', done => {
        chai.request(server)
          .put('/api/threads/testing')
          .send({ thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });  
      
      
    }); // PUT suite
    
    suite('DELETE', function() {
      test('DELETE thread with wrong password', done => {
        chai.request(server)
          .delete('/api/threads/testing')
          .send({ thread_id, delete_password: "wrongpassword" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('DELETE thread with correct password', done => {
        chai.request(server)
          .delete('/api/threads/testing')
          .send({ thread_id, delete_password })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success', "Response is 'success'");
            done();
          });
      });
      
      test('Deleted thread is gone', done => {
        chai.request(server)
          .get('/api/threads/testing')
          .end((err, res) => {
            assert.equal(res.status, 200);
            // assert.equal(res.body.length, thread_count - 1, 'There is now one less thread');
            if (res.body.length > 0) {
              // find the index of the thread with thread_id if it exists
              const indexOfThread = res.body.indexOf(x => x._id === thread_id);
              assert.equal(indexOfThread, -1, 'thread_id is not found in the returned array');
            }
            done();
          });
      });
      
    }); // DELETE suite
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    const thread_delete_password = "Password123";
    const delete_password = "Test_Password 4567";
    const reply_text = "Test reply";
    let thread_id, reply_id, reply_count;
    
    suite('POST', function() {
      
      test('POST a new reply', async () => {
        try {
          // Add a new 'reply testing' thread
          let res = await chai.request(server)
            .post('/api/threads/testing')
            .send({ text: 'reply testing', delete_password: thread_delete_password });
          assert.equal(res.status, 200);
          
          // Get the thread_id for the new thread
          res = await chai.request(server)
            .get('/api/threads/testing');
          assert.equal(res.status, 200);
          assert.isAbove(res.body.length, 0, 'At least one thread was returned');
          thread_id = res.body[0]._id;
          console.log("Thread added: " + thread_id);
          
          // Add a reply to thread_id
          res = await chai.request(server)
            .post('/api/replies/testing')
            .send({ thread_id, text: reply_text, delete_password });
          assert.equal(res.status, 200);
        } catch(err) {
          throw(err);
        }
      });
    });
    
    suite('GET', function() {
      // get list of replies for above thread
      test('GET replies for a thread', done => {
        chai.request(server)
          .get('/api/replies/testing?&thread_id=' + thread_id)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isNotArray(res.body, 'Data returned is not an array');
            assert.property(res.body, 'replies', 'Response has a replies property');
            assert.isArray(res.body.replies, 'replies is an array');
            assert.isAbove(res.body.replies.length, 0, 'There is at least one reply');
            reply_count = res.body.replies.length;
            assert.property(res.body.replies[0], '_id', 'Replies have an _id property');
            reply_id = res.body.replies[0];
            assert.notProperty(res.body.replies[0], 'delete_password', 'Replies do not have delete_password property');
            assert.notProperty(res.body.replies[0], 'reported', 'Replies do not have reported property');          
            assert.property(res.body.replies[0], 'text', 'Replies have a text property');
            assert.property(res.body.replies[0], 'created_on', 'Replies have a created_on property');
            assert.equal(res.body.replies[0].created_on, res.body.bumped_on, 'Thread\'s bumped_on date should equal the reply\'s created_on date');
            done();
          });
        
      });
      
    });
    
    suite('PUT', function() {
      // returns 200 status
      // returns 'success'
      test('PUT to report a reply', done => {
        chai.request(server)
          .put('/api/replies/testing')
          .send({ thread_id, reply_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      // incorrect password returns 'incorrect password'
      // correct password returns 'success'
      // GET and confirm deleted reply is now '[deleted]'
      
      test('DELETE with incorrect password', done => {
        chai.request(server)
          .delete('/api/replies/testing')
          .send({ thread_id, reply_id, delete_password: "wrong password"})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('DELETE with correct password', done=> {
        chai.request(server)
          .delete('/api/replies/testing')
          .send({ thread_id, reply_id, delete_password })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
      
      test('Deleted reply is marked deleted', done => {
        chai.request(server)
          .get('/api/replies/testing?thread_id=' + thread_id)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, 'replies', 'Returned data has a replies property');
            assert.isArray(res.body.replies, 'replies property is an array');
            assert.property(res.body.replies[0], 'text', 'replies have a text property');
            assert.equal(res.body.replies[0].text, '[deleted]', 'Deleted reply is marked \'[deleted]\'');
            done();
          });
      });
      
      test('Delete testing thread', done => {
        chai.request(server)
          .delete('/api/threads/testing')
          .send({ thread_id, delete_password: thread_delete_password })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
      
    }); // DELETE suite
    
  });

});
